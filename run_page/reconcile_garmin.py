"""对账脚本：清理「佳明官方库已删除、本地 db 仍在」的 Garmin 记录。

使用场景：分段活动合并后删掉了佳明上的分段、或在佳明清理过重复记录——
同步管线只增不删，这些行会一直留在本地 db。本脚本与官方库对账后清理。

用法:
  uv run python run_page/reconcile_garmin.py             # 试运行,只打印疑似失效记录
  uv run python run_page/reconcile_garmin.py --apply     # 真删并重新生成 activities.json

安全边界:
- 只处理 source='Garmin Connect' 的记录;咕咚/Keep/GPX 等其他来源(source='')不查不删
- 匹配规则与入库守卫一致:同一天、开始时间差 <=10 分钟、距离差 <500m
- 官方库匹配不上才会被列为失效,宁漏勿删;删除前务必人工过目试运行输出

佳明 token: 复用 ~/.garminconnect_fsy(内含 oauth token,过期自动刷新);
不存在时按 get_garmin_secret.py 的说明重新生成后存为该文件。
"""

import argparse
import datetime
import json
import os

import garth

garth.configure(domain="garmin.cn", ssl_verify=False)

TOKEN_PATH = os.path.expanduser("~/.garminconnect_fsy")

MATCH_TIME_TOLERANCE = datetime.timedelta(minutes=10)
MATCH_DISTANCE_TOLERANCE = 500  # 米


def load_official_activities():
    """翻页拉取佳明官方全量活动列表。"""
    official = {}
    start = 0
    while True:
        page = garth.client.connectapi(
            f"activitylist-service/activities/search/activities?limit=100&start={start}"
        )
        if not page:
            break
        for a in page:
            day = str(a.get("startTimeLocal", ""))[:10]
            official.setdefault(day, []).append(
                (
                    datetime.datetime.strptime(
                        a["startTimeLocal"], "%Y-%m-%d %H:%M:%S"
                    ),
                    a.get("distance") or 0.0,
                    a["activityId"],
                    a.get("activityName"),
                )
            )
        start += 100
    print(f"official: fetched {start + len(page or [])} activities")
    return official


def find_match(row, official):
    """按同日 + 时间/距离容差在官方列表中找对应活动,找不到返回 None。"""
    start = datetime.datetime.strptime(row.start_date_local, "%Y-%m-%d %H:%M:%S")
    for off_start, off_dist, off_id, off_name in official.get(
        row.start_date_local[:10], []
    ):
        if (
            abs(start - off_start) <= MATCH_TIME_TOLERANCE
            and abs(row.distance - off_dist) < MATCH_DISTANCE_TOLERANCE
        ):
            return off_id
    return None


def regenerate_activities_json(session):
    """删除后重建 activities.json,与各 sync 脚本末尾的导出逻辑一致。"""
    from config import JSON_FILE, SQL_FILE  # noqa: E402
    from generator import Generator  # noqa: E402

    g = Generator(SQL_FILE)
    g.session = session
    activities = g.loadForMapping()
    with open(JSON_FILE, "w") as f:
        json.dump(activities, f, indent=0)
    print(f"activities.json regenerated: {len(activities)} records")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply", action="store_true", help="确认删除(默认只打印,不删)"
    )
    options = parser.parse_args()

    from generator.db import Activity, init_db

    if not os.path.exists(TOKEN_PATH):
        print(
            f"token file not found: {TOKEN_PATH}\n"
            "先用 get_garmin_secret.py 登录并把 garth.client.dumps() 存入该文件"
        )
        raise SystemExit(1)
    garth.client.loads(open(TOKEN_PATH).read())
    garth.client.refresh_oauth2()

    official = load_official_activities()

    session = init_db(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.db")
    )
    rows = (
        session.query(Activity)
        .filter(Activity.source == "Garmin Connect")
        .order_by(Activity.start_date_local)
        .all()
    )
    print(f"db: {len(rows)} rows with source='Garmin Connect'\n")

    suspects = []
    for row in rows:
        if find_match(row, official) is None:
            suspects.append(row)
            print(
                f"SUSPECT {row.run_id} {row.start_date_local} "
                f"{row.distance / 1000:.2f}km {row.name!r}"
            )

    print(f"\nsuspects: {len(suspects)}")
    if not suspects:
        return
    if not options.apply:
        print("dry run only, re-run with --apply to delete")
        return

    for row in suspects:
        session.delete(row)
    session.commit()
    print(f"deleted {len(suspects)} rows")
    regenerate_activities_json(session)


if __name__ == "__main__":
    main()
