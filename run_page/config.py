import os
from collections import namedtuple

# getting content root directory
current = os.path.dirname(os.path.realpath(__file__))
parent = os.path.dirname(current)

OUTPUT_DIR = os.path.join(parent, "activities")
GPX_FOLDER = os.path.join(parent, "GPX_OUT")
TCX_FOLDER = os.path.join(parent, "TCX_OUT")
FIT_FOLDER = os.path.join(parent, "FIT_OUT")
PNG_FOLDER = os.path.join(parent, "PNG_OUT")
ENDOMONDO_FILE_DIR = os.path.join(parent, "Workouts")
FOLDER_DICT = {
    "gpx": GPX_FOLDER,
    "tcx": TCX_FOLDER,
    "fit": FIT_FOLDER,
}
SQL_FILE = os.path.join(parent, "run_page", "data.db")
JSON_FILE = os.path.join(parent, "src", "static", "activities.json")
# 体重序列输出给前端趋势图使用(没有数据源时会是空数组 [])
WEIGHT_JSON_FILE = os.path.join(parent, "src", "static", "weights.json")
SYNCED_FILE = os.path.join(parent, "imported.json")
SYNCED_ACTIVITY_FILE = os.path.join(parent, "synced_activity.json")
NAME_MAPPING_FILE = os.path.join(FIT_FOLDER, "name_mapping.json")

# ==== 体重(体脂秤)数据源,可选 ====
# 留空 = 本功能整体关闭:不写库、不输出数据,前端不显示任何体重相关的列与图表。
# 这样 fork 本仓库但自己没有体脂秤账号的人不需要做任何配置。
# 优先级:命令行参数 > 环境变量 > config.yaml
#
# WEIGHT_SOURCE 选择数据源,目前支持:
#   ""        未配置,功能整体隐藏(默认)
#   yunmai    好轻体脂秤,用账号密码直连(需要 YUNMAI_ACCOUNT / YUNMAI_PASSWORD)
#   url       从一个远端 JSON 地址取数(WEIGHT_SOURCE_URL)
#   file      从一个本地 JSON 文件取数(WEIGHT_SOURCE_FILE)
# 新增数据源的完整说明见 run_page/weight_sources/__init__.py
WEIGHT_SOURCE = os.getenv("WEIGHT_SOURCE", "")
# 远端 JSON 地址(WEIGHT_SOURCE=url 时使用)
WEIGHT_SOURCE_URL = os.getenv("WEIGHT_SOURCE_URL", "")
# 本地 JSON 文件路径,用于离线运行/调试(优先于 URL)
WEIGHT_SOURCE_FILE = os.getenv("WEIGHT_SOURCE_FILE", "")
# 活动当天没有称重记录时,向前后各取多少天内最近的一条
WEIGHT_TOLERANCE_DAYS = int(os.getenv("WEIGHT_TOLERANCE_DAYS", "3"))

# 好轻直连用的凭证。只在使用 WEIGHT_SOURCE=yunmai 时才需要。
YUNMAI_ACCOUNT = os.getenv("YUNMAI_ACCOUNT", "")
YUNMAI_PASSWORD = os.getenv("YUNMAI_PASSWORD", "")
# 从好轻 App 逆向得到的客户端常量。留空则回退到代码里的内置值;
# 建议放进 GitHub Secret,这样公开仓库里不会留下可供他人复用的痕迹。
# 多行 PEM 可以写成一行并用 \n 转义。
YUNMAI_RSA_PUBLIC_KEY = os.getenv("YUNMAI_RSA_PUBLIC_KEY", "")
YUNMAI_API_SECRET = os.getenv("YUNMAI_API_SECRET", "")

# TODO: Move into nike_sync NRC THINGS


BASE_TIMEZONE = "Asia/Shanghai"
UTC_TIMEZONE = "UTC"

start_point = namedtuple("start_point", "lat lon")
run_map = namedtuple("polyline", "summary_polyline")

# add more type here
TYPE_DICT = {
    "running": "Run",
    "RUN": "Run",
    "Run": "Run",
    "track_running": "Run",
    "trail_running": "Trail Run",
    "cycling": "Ride",
    "CYCLING": "Ride",
    "Ride": "Ride",
    "EBikeRide": "Ride",
    "E-Bike": "Ride",
    "road_biking": "Ride",
    "Road Bike": "Ride",
    "Mountain Bike": "Ride",
    "VirtualRide": "VirtualRide",
    "indoor_cycling": "Indoor Ride",
    "Indoor Bike ": "Indoor Ride",
    "walking": "Hike",
    "hiking": "Hike",
    "Walk": "Hike",
    "Hike": "Hike",
    "Swim": "Swim",
    "swimming": "Swim",
    "Pool Swim": "Swim",
    "Open Water": "Swim",
    "rowing": "Rowing",
    "RoadTrip": "RoadTrip",
    "flight": "Flight",
    "kayaking": "Kayaking",
    "Snowboard": "Snowboard",
    "resort_skiing_snowboarding_ws": "Ski",  # garmin
    "AlpineSki": "Ski",  # strava
    "Ski": "Ski",
    "BackcountrySki": "BackcountrySki",
    # google health
    "trail_run": "Run",
    "biking": "Ride",
    "outdoor_bike": "Ride",
    "electric_bike": "Ride",
    "mountain_biking": "Ride",
    "skiing": "Ski",
    "snowboarding": "Swim",
    "swimming_open_water": "Swim",
    "swimming_pool": "Swim",
}

MAPPING_TYPE = [
    "Hike",
    "Ride",
    "VirtualRide",
    "Rowing",
    "Run",
    "Trail Run",
    "Swim",
    "RoadTrip",
    "Kayaking",
    "Snowboard",
    "Ski",
    "BackcountrySki",
]

STRAVA_GARMIN_TYPE_DICT = {
    "Hike": "hiking",
    "Run": "running",
    "EBikeRide": "cycling",
    "VirtualRide": "VirtualRide",
    "Walk": "walking",
    "Swim": "swimming",
}
