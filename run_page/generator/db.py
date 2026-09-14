import datetime
import random
import string

from config import TYPE_DICT
from geopy.geocoders import Nominatim, options
from sqlalchemy import (
    Column,
    Float,
    Integer,
    Interval,
    String,
    create_engine,
    inspect,
    text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()


# random user name 8 letters
def randomword():
    letters = string.ascii_lowercase
    return "".join(random.choice(letters) for i in range(4))


options.default_user_agent = "workouts_page"
# reverse the location (lat, lon) -> location detail
g = Nominatim(user_agent=randomword())


ACTIVITY_KEYS = [
    "run_id",
    "name",
    "distance",
    "moving_time",
    "type",
    "start_date",
    "start_date_local",
    "location_country",
    "summary_polyline",
    "average_heartrate",
    "average_speed",
    "elevation_gain",
    "source",
    # 体重相关字段（可选）。数据源未配置或没有数据时恒为 None,
    # 前端会据此整体隐藏体重列与体重趋势图。
    "weight",
    "weight_date",
    "fat",
]


class Activity(Base):
    __tablename__ = "activities"

    run_id = Column(Integer, primary_key=True)
    name = Column(String)
    distance = Column(Float)
    moving_time = Column(Interval)
    elapsed_time = Column(Interval)
    type = Column(String)
    start_date = Column(String)
    start_date_local = Column(String)
    location_country = Column(String)
    summary_polyline = Column(String)
    average_heartrate = Column(Float)
    average_speed = Column(Float)
    elevation_gain = Column(Float)
    streak = None
    source = Column(String)
    # 由体脂秤数据(见 run_page/weight_sync.py)按 ±N 天就近匹配写入
    weight = Column(Float)  # kg
    weight_date = Column(String)  # 实际称重日期 YYYY-MM-DD,与活动日期不同时前端会打星标
    fat = Column(Float)  # 体脂率 %

    def to_dict(self):
        out = {}
        for key in ACTIVITY_KEYS:
            attr = getattr(self, key)
            if isinstance(attr, (datetime.timedelta, datetime.datetime)):
                out[key] = str(attr)
            else:
                out[key] = attr

        if self.streak:
            out["streak"] = self.streak

        return out


class Weight(Base):
    """体脂秤的每日测量记录,与活动表独立。

    本表是可选数据源的落点:没有配置数据源(例如被 fork 后对方没有体脂秤账号)时
    本表为空,activities 里的 weight/weight_date/fat 均为 NULL,
    前端不会渲染任何体重相关的列与图表。
    """

    __tablename__ = "weights"

    date = Column(String, primary_key=True)  # YYYY-MM-DD,北京时间(称重当天)
    weight = Column(Float)  # kg
    fat = Column(Float)  # 体脂率 %,旧记录该值可能为 0(视为缺失,存 NULL)
    measured_at = Column(String)  # 原始测量时间,便于排查


def find_duplicate_activity(session, run_activity, type):
    """识别 run_id 不同但实为同一次活动的已有记录。

    各同步管线用 开始时间戳(毫秒) 当 run_id，同一次活动从两个设备/平台导入时
    开始时间差几秒，就会各自建行（历史上因此积累过大量重复）。这里按
    类型 + 距离差 <500m + 开始时间差 <10分钟 模糊匹配，命中则更新已有记录。
    """
    start = run_activity.start_date_local
    if isinstance(start, str):
        start = datetime.datetime.strptime(start, "%Y-%m-%d %H:%M:%S")
    fmt = "%Y-%m-%d %H:%M:%S"
    lo = (start - datetime.timedelta(minutes=10)).strftime(fmt)
    hi = (start + datetime.timedelta(minutes=10)).strftime(fmt)
    distance = float(run_activity.distance)
    return (
        session.query(Activity)
        .filter(
            Activity.type == type,
            Activity.start_date_local >= lo,
            Activity.start_date_local <= hi,
            Activity.distance >= distance - 500,
            Activity.distance <= distance + 500,
        )
        .first()
    )


def update_or_create_activity(session, run_activity):
    created = False
    try:
        activity = (
            session.query(Activity).filter_by(run_id=int(run_activity.id)).first()
        )
        type = run_activity.type
        source = run_activity.source if hasattr(run_activity, "source") else "gpx"
        if run_activity.type in TYPE_DICT:
            type = TYPE_DICT[run_activity.type]

        if activity is None:
            dup = find_duplicate_activity(session, run_activity, type)
            if dup is not None:
                print(
                    f"duplicate detected: {run_activity.id} matches existing "
                    f"{dup.run_id}, merging"
                )
                activity = dup
        type = run_activity.type
        source = run_activity.source if hasattr(run_activity, "source") else "gpx"
        if run_activity.type in TYPE_DICT:
            type = TYPE_DICT[run_activity.type]

        current_elevation_gain = 0.0  # default value

        # https://github.com/stravalib/stravalib/blob/main/src/stravalib/strava_model.py#L639C1-L643C41
        if (
            hasattr(run_activity, "total_elevation_gain")
            and run_activity.total_elevation_gain is not None
        ):
            current_elevation_gain = float(run_activity.total_elevation_gain)
        elif (
            hasattr(run_activity, "elevation_gain")
            and run_activity.elevation_gain is not None
        ):
            current_elevation_gain = float(run_activity.elevation_gain)

        if not activity:
            start_point = run_activity.start_latlng
            location_country = getattr(run_activity, "location_country", "")
            # or China for #176 to fix
            if (not location_country and start_point) or location_country == "China":
                try:
                    location_country = str(
                        g.reverse(
                            f"{start_point.lat}, {start_point.lon}", language="zh-CN"  # type: ignore
                        )
                    )
                # limit (only for the first time)
                except Exception:
                    try:
                        location_country = str(
                            g.reverse(
                                f"{start_point.lat}, {start_point.lon}",
                                language="zh-CN",  # type: ignore
                            )
                        )
                    except Exception:
                        pass

            activity = Activity(
                run_id=run_activity.id,
                name=run_activity.name,
                distance=run_activity.distance,
                moving_time=run_activity.moving_time,
                elapsed_time=run_activity.elapsed_time,
                type=type,
                start_date=run_activity.start_date,
                start_date_local=run_activity.start_date_local,
                location_country=location_country,
                average_heartrate=run_activity.average_heartrate,
                average_speed=float(run_activity.average_speed),
                elevation_gain=current_elevation_gain,
                summary_polyline=(
                    (run_activity.map and run_activity.map.summary_polyline) or ""
                ),
                source=source,
            )
            session.add(activity)
            created = True
        else:
            # 合并重复记录时,传入副本可能没有名字,避免把已有名字冲掉
            if run_activity.name:
                activity.name = run_activity.name
            activity.distance = float(run_activity.distance)
            activity.moving_time = run_activity.moving_time
            activity.elapsed_time = run_activity.elapsed_time
            activity.type = type
            activity.average_heartrate = run_activity.average_heartrate
            activity.average_speed = float(run_activity.average_speed)
            activity.elevation_gain = current_elevation_gain
            activity.summary_polyline = (
                run_activity.map and run_activity.map.summary_polyline
            ) or ""
            activity.source = source
    except Exception as e:
        print(f"something wrong with {run_activity.id}")
        print(str(e))

    return created


def add_missing_columns(engine, model):
    inspector = inspect(engine)
    table_name = model.__tablename__
    columns = {col["name"] for col in inspector.get_columns(table_name)}
    missing_columns = []

    for column in model.__table__.columns:
        if column.name not in columns:
            missing_columns.append(column)
    if missing_columns:
        with engine.connect() as conn:
            for column in missing_columns:
                column_type = str(column.type)
                conn.execute(
                    text(
                        f"ALTER TABLE {table_name} ADD COLUMN {column.name} {column_type}"
                    )
                )


def init_db(db_path):
    engine = create_engine(
        f"sqlite:///{db_path}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)

    # check missing columns
    add_missing_columns(engine, Activity)

    sm = sessionmaker(bind=engine)
    session = sm()
    # apply the changes
    session.commit()
    return session
