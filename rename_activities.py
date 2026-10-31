"""活动批量改名工具（五步流水线）

用法（仓库根目录运行）:
  py rename_activities.py analyze            # 1. 解析所有活动起终点坐标 -> _tmp_endpoints.json
  py rename_activities.py plan               # 2. 生成改名表(锚点匹配+兜底逆地理) -> _tmp_rename.json + _tmp_rename_full.csv
  py rename_activities.py apply-local        # 3. 写入 data.db 并重新生成 activities.json / data.parquet
  py rename_activities.py garmin-map         # 4. 映射 run_id->佳明活动ID 并可 --test 单条验证
  py rename_activities.py garmin-apply       # 5. 佳明批量改名（跳过已验证的）

依赖: polyline httpx duckdb(apply-local) + run_page 的 garmin_sync(garmin-*), AMAP_KEY 环境变量(plan 兜底)。
改名保护: 只改系统自动名(空名/{城市}{类型}/from keep|codoon/电动自行车骑行/其他/开车/操场跑步 等),
用户叙事名一律不动。佳明 sync 只处理新下载活动，不会覆盖本地改名。

地点语义与年代门槛见 memory: family-place-lore；工作流细节见 memory: activity-rename-workflow。
"""
import argparse
import json
import math
import os
import re
import sqlite3
import sys
import time
from collections import Counter

# ---------------- 坐标工具 (WGS-84 -> GCJ-02) ----------------

def _tf_lat(x, y):
    r = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * math.sqrt(abs(x))
    r += (20 * math.sin(6 * x * math.pi) + 20 * math.sin(2 * x * math.pi)) * 2 / 3
    r += (20 * math.sin(y * math.pi) + 40 * math.sin(y / 3 * math.pi)) * 2 / 3
    r += (160 * math.sin(y / 12 * math.pi) + 320 * math.sin(y * math.pi / 30)) * 2 / 3
    return r


def _tf_lng(x, y):
    r = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * math.sqrt(abs(x))
    r += (20 * math.sin(6 * x * math.pi) + 20 * math.sin(2 * x * math.pi)) * 2 / 3
    r += (20 * math.sin(x * math.pi) + 40 * math.sin(x / 3 * math.pi)) * 2 / 3
    r += (150 * math.sin(x / 12 * math.pi) + 300 * math.sin(x / 30 * math.pi)) * 2 / 3
    return r


def wgs2gcj(lat, lng):
    a, ee = 6378245.0, 0.00669342162296594323
    dlat = _tf_lat(lng - 105.0, lat - 35.0)
    dlng = _tf_lng(lng - 105.0, lat - 35.0)
    rad = lat / 180.0 * math.pi
    m = 1 - ee * math.sin(rad) ** 2
    sm = math.sqrt(m)
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (m * sm) * math.pi)
    dlng = (dlng * 180.0) / (a / sm * math.cos(rad) * math.pi)
    return lat + dlat, lng + dlng


def hav(lat1, lng1, lat2, lng2):
    R = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = (math.sin(math.radians(lat2 - lat1) / 2) ** 2
         + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lng2 - lng1) / 2) ** 2)
    return 2 * R * math.asin(math.sqrt(a))


# ---------------- 地点锚点: (标签, 角色, GCJ纬度, GCJ经度, 半径m, 年代门槛(起,止)) ----------------
PLACES = [
    ("御景佳园", "home", 22.585355, 114.263148, 1300, ("2022-09-01", None)),          # 现家(盐田), 2022-09 入住
    ("月子中心", "home", 22.734359, 114.233272, 1200, ("2025-12-01", "2026-06-30")),  # 龙岗侒悦缦, 儿子 2025-12-25
    # 三办/二办 不单独设标签: 与御景佳园仅距 200-600m, 2022-2023 通勤为步行无 GPS 记录
    ("华大时空中心", "office", 22.603566, 114.315145, 850, (None, None)),              # 公司(含公寓=公路车停车区)
    ("中粮前海创新中心", "office", 22.537210, 113.900325, 450, ("2026-01-01", None)),
    ("龙海家园", "home", 22.535265, 113.905808, 850, (None, "2021-12-31")),           # 旧家(前海), 2020-21
    ("海运中心", "office", 22.501038, 113.881042, 650, (None, "2021-12-31")),         # 旧公司(铁路公园旁)
    ("海运中心", "office", 22.506585, 113.884399, 450, (None, "2021-12-31")),         # 香江金融中心=同片区停车点
    ("特力布心工业区", "home", 22.577060, 114.143842, 1000, (None, "2019-12-31")),    # 深粮集团出租房(旧改可能已消失)
    ("田贝三路宿舍", "home", 22.564192, 114.125442, 500, (None, "2018-12-31")),       # 深粮集团最初宿舍
    ("老婆单位", "other", 22.557525, 114.128030, 300, (None, None)),                  # 深圳市人民医院翠竹留医部
    ("老爸家", "home", 20.024734, 110.381707, 1200, (None, None)),                    # 海口枫丹白露
    ("老妈家", "home", 21.192611, 110.393759, 3200, (None, None)),                    # 湛江霞山港务局(含海滨公园)
    ("丈母娘家", "home", 30.891841, 117.639338, 1600, (None, None)),                  # 铜陵陈瑶湖镇
    ("万科翡丽山", "home", 22.931262, 113.740678, 900, (None, None)),                 # 东莞, 曾购房产(2020-01-20 卖掉)
    ("怡泰大厦", "home", 22.554346, 114.127955, 550, (None, None)),                   # 罗湖旧居/落户
    ("金福大厦", "home", 22.557674, 114.130450, 450, (None, None)),
    ("平安金融中心", "home", 22.533074, 114.055674, 550, (None, None)),
]

TYPE_SUFFIX = {"Ride": "骑行", "Run": "跑步", "Hike": "徒步", "e_bike_fitness": "电助力骑行",
               "Swim": "游泳", "RoadTrip": "自驾", "driving_general": "驾车", "Ski": "滑雪"}

TRACK_NAME_BY_DATE = {
    "2025-04-20": "盐田区实验学校操场跑步",
    "2025-04-21": "中山纪念学校操场跑步",
    "2025-04-30": "时空中心楼顶操场跑步",
}

GENERIC = re.compile(
    r"^[一-龥A-Za-z]{2,8}\s?[·\-]?\s?"
    r"(电动自行车骑行|电助力自行车|骑行|跑步|徒步|步行|自行车|操场跑步|开车|驾驶|其他|游泳|滑雪/雪板滑雪)$")
GENERIC_BARE = {"步行", "跑步", "骑行", "徒步", "游泳"}
GENERIC_EXACT = {"Ride from codoon", "Run from codoon", "Walk from codoon",
                 "Ride from keep", "Run from keep", "Walk from keep"}

# 兜底逆地理命名的 POI 误抓修正(楼盘/酒店/商铺顶替真实地名)
GEO_NAME_OVERRIDES = {
    "海豚口腔周边骑行": "海口周边骑行",
    "深圳市大鹏半岛水源工程管理处(金葵东路)周边骑行": "大鹏金葵东路周边骑行",
    "广东省特种设备检测研究院汕尾检测院到保利·金町湾听海": "金町湾到汕尾检测院",
    "洪湖二街50号院夜跑": "洪湖夜跑",
    "中国雷琼世界地质公园到湛江市港湾研学基地": "湖光岩徒步",
    "水荫小区周边徒步": "广州动物园周边徒步",
    "云南野生动物园入口南停车场周边徒步": "云南野生动物园徒步",
    "安隐·李氏大院周边徒步": "大理双廊古镇周边徒步",
    "芜湖松鼠林间酒店(松鼠小镇店)周边徒步": "芜湖松鼠小镇周边徒步",
    "梦幻犁桥民宿酒店周边徒步": "犁桥水镇周边徒步",
    "惠东海王子学习型酒店夜跑": "惠东金海湾夜跑",
    "罗湖区中建花园周边徒步": "罗湖体育馆周边徒步",
    "水贝珠宝总部大厦周边骑行": "永泰路周边骑行",
    "依仙湖居周边徒步": "莲塘周边徒步",
    "顺达大厦到惠州北站": "博罗华侨中学到惠州北站",
    "棕榈湾花园周边电助力骑行": "盐田海山周边电助力骑行",
    "68号花园到赣州十龙聚龟": "巨亿广场到十龙聚龟",
    "华润大厦C座到赣州市第三人民医院章江院区": "华润大厦到赣州市第三人民医院",
    "五洲花苑周边电助力骑行": "沙河镇周边电助力骑行",
    "保利·金町湾天銮到利盛楼": "金町湾周边电助力骑行",
    "金町湾到汕尾检测院": "金町湾周边电助力骑行",
    "大鹏海舍假日酒店周边骑行": "大鹏所城-杨梅坑环线",
    "大鹏金葵东路周边骑行": "葵涌-坝光环线",
    "大理汽车客运站到大理洱海龙湾酒店": "大理汽车客运站到洱海龙湾酒店",
    "西丽湖(地铁站)周边徒步": "西丽湖周边徒步",
    "广东梧桐山风景名胜区周边徒步": "梧桐山周边徒步",
    "深圳国家基因库(SMART- NBC)周边徒步": "国家基因库周边徒步",
    "总统府门楼周边徒步": "南京总统府周边徒步",
    "南京牛首山文化旅游区(东北门)周边徒步": "南京牛首山徒步",
}

ENDPOINTS_FILE = "_tmp_endpoints.json"
RENAME_FILE = "_tmp_rename.json"
CSV_FILE = "_tmp_rename_full.csv"
GARMIN_MAP_FILE = "_tmp_garmin_map.json"
GEO_CACHE_FILE = "_tmp_regeo_cache.json"
DB_FILE = "run_page/data.db"
SECRET_FILE = r"C:\Users\arthurfsy\.garminconnect_fsy"


def is_generic(name):
    if not name or not name.strip():
        return True
    n = name.strip()
    return n in GENERIC_EXACT or n in GENERIC_BARE or bool(GENERIC.fullmatch(n))


def in_era(date_str, era):
    s, e = era
    d = date_str[:10]
    if s and d < s:
        return False
    if e and d > e:
        return False
    return True


def match_place(pt, date_str):
    best, best_d = None, 1e9
    for frame in (0, 1):  # 0=GCJ(转换) 1=原始(兼容已是 GCJ 的数据)
        lat, lng = wgs2gcj(*pt) if frame == 0 else pt
        for label, role, alat, alng, rad, era in PLACES:
            if not in_era(date_str, era):
                continue
            d = hav(lat, lng, alat, alng)
            if d <= rad and d < best_d:
                best, best_d = label, d
    return best


def daypart(hour):
    return "晨" if hour < 11 else ("夜" if hour >= 16 else "午后")


def build_name(a, s, e):
    """a: {type,hour,km,span,track_run}; s/e: 匹配到的地点标签。返回 (新名, 规则)。"""
    typ = a["type"]
    suffix = TYPE_SUFFIX.get(typ, "活动")
    hour, km = a["hour"], a["km"]
    if a.get("track_run"):
        return a["track_run"], "track_run"

    if s and e and s != e:
        s_role = next(p[1] for p in PLACES if p[0] == s)
        e_role = next(p[1] for p in PLACES if p[0] == e)
        if {s_role, e_role} == {"home", "office"}:
            if s_role == "home":
                return f"上班·{s}→{e}", "commute_am"
            return f"下班·{s}→{e}", "commute_pm"
        return f"{s}到{e}", "pair"
    if s and e and s == e:
        if km > 20:
            return f"从{s}出发·{suffix}", "loop_span"
        if km <= 3 and next(p[1] for p in PLACES if p[0] == s) == "office":
            if 6 <= hour < 11:
                return f"上班接驳·{s}", "shuttle_am"
            if 16 <= hour < 21:
                return f"下班接驳·{s}", "shuttle_pm"
            return f"{s}周边{suffix}", "office_loop"
        if typ == "Run":
            dp = daypart(hour)
            return (f"{s}{dp}跑" if dp != "午后" else f"{s}跑步"), "home_loop_run"
        return f"{s}周边{suffix}", "loop"
    if s and not e:
        if km <= 3 and hour >= 16 and next(p[1] for p in PLACES if p[0] == s) == "office":
            return f"下班接驳·{s}", "shuttle_pm"
        return f"从{s}出发·{suffix}", "from"
    if e and not s:
        if km <= 3 and hour < 11 and next(p[1] for p in PLACES if p[0] == e) == "office":
            return f"上班接驳·{e}", "shuttle_am"
        return f"回到{e}·{suffix}", "to"
    return None, "unmatched"


# ---------------- 1. analyze ----------------

def cmd_analyze(args):
    import polyline
    con = sqlite3.connect(DB_FILE)
    rows = con.execute(
        "select run_id, name, type, start_date_local, moving_time, distance, summary_polyline, location_country from activities").fetchall()
    acts, clusters = [], {}
    no_poly = 0
    for run_id, name, typ, start, mt, dist, poly, loc in rows:
        if not poly:
            no_poly += 1
            acts.append({"run_id": run_id, "type": typ, "start_date_local": start, "name": name,
                         "distance": dist, "moving_time": mt, "start": None, "end": None, "loc": loc})
            continue
        try:
            pts = polyline.decode(poly)
            s, e = (pts[0], pts[-1]) if pts else (None, None)
        except Exception:
            s = e = None
        acts.append({"run_id": run_id, "type": typ, "start_date_local": start, "name": name,
                     "distance": dist, "moving_time": mt, "start": s, "end": e, "loc": loc})
        for pt in (s, e):
            if pt:
                k = (round(pt[0] / 0.004) * 0.004, round(pt[1] / 0.004) * 0.004)
                c = clusters.setdefault(k, {"n": 0, "lats": [], "lngs": []})
                c["n"] += 1
                c["lats"].append(pt[0])
                c["lngs"].append(pt[1])
    cl_out = sorted(
        ({"grid": k, "count": c["n"], "lat": sum(c["lats"]) / len(c["lats"]), "lng": sum(c["lngs"]) / len(c["lngs"])}
         for k, c in clusters.items()), key=lambda x: -x["count"])
    json.dump({"activities": acts, "clusters": cl_out}, open(ENDPOINTS_FILE, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"activities={len(acts)} no_polyline={no_poly} clusters={len(cl_out)} -> {ENDPOINTS_FILE}")


# ---------------- 2. plan ----------------

def cmd_plan(args):
    import httpx
    KEY = os.environ.get("AMAP_KEY")
    cache = json.load(open(GEO_CACHE_FILE, encoding="utf-8")) if os.path.exists(GEO_CACHE_FILE) else {}
    client = httpx.Client(timeout=15)

    def regeo(lat, lng):
        key = f"{lat:.4f},{lng:.4f}"
        if key in cache:
            return cache[key]
        g_lat, g_lng = wgs2gcj(lat, lng)
        r = client.get("https://restapi.amap.com/v3/geocode/regeo",
                       params={"location": f"{g_lng},{g_lat}", "key": KEY,
                               "radius": 250, "extensions": "all"}).json()
        time.sleep(0.28)
        re = r.get("regeocode") or {}
        comp = re.get("addressComponent") or {}
        pois = re.get("pois") or []
        name = None
        if pois and pois[0].get("name"):
            name = pois[0]["name"]
        else:
            b = comp.get("building") or {}
            if isinstance(b, dict) and b.get("name"):
                name = b["name"]
            else:
                sn = comp.get("streetNumber") or {}
                if isinstance(sn, dict) and sn.get("street"):
                    name = sn["street"]
                else:
                    name = comp.get("township") or comp.get("district") or comp.get("city") or ""
        cache[key] = name
        json.dump(cache, open(GEO_CACHE_FILE, "w", encoding="utf-8"), ensure_ascii=False)
        return name

    acts = json.load(open(ENDPOINTS_FILE, encoding="utf-8"))["activities"]
    renames, skips, rules = [], Counter(), Counter()

    def fallback_name(a, s_pt, e_pt):
        s_name = regeo(*s_pt) if s_pt else None
        e_name = regeo(*e_pt) if e_pt else None
        if not s_name and not e_name:
            return None, "no_geoname"
        span = hav(*s_pt, *e_pt) if (s_pt and e_pt) else 0
        if s_pt and e_pt and span > 1500 and s_name and e_name and s_name != e_name:
            return f"{s_name}到{e_name}", "geo_pair"
        if s_pt and e_pt:
            if a["type"] == "Run":
                dp = daypart(a["hour"])
                return (f"{s_name}{dp}跑" if dp != "午后" else f"{s_name}跑步"), "geo_loop_run"
            return f"{s_name}周边{TYPE_SUFFIX.get(a['type'], '活动')}", "geo_loop"
        if s_pt:
            return f"从{s_name}出发·{TYPE_SUFFIX.get(a['type'], '活动')}", "geo_from"
        return f"回到{e_name}·{TYPE_SUFFIX.get(a['type'], '活动')}", "geo_to"

    for a in acts:
        old = a["name"]
        if not is_generic(old):
            skips["user_named"] += 1
            continue
        if not a["start"]:
            skips["no_polyline"] += 1
            continue
        date = a["start_date_local"] or "9999"
        hour = int((a["start_date_local"] or "0:00")[11:13])
        km = round((a["distance"] or 0) / 1000, 1)
        a2 = {"type": a["type"], "hour": hour, "km": km}
        if "操场跑步" in (old or ""):
            a2["track_run"] = TRACK_NAME_BY_DATE.get(date[:10])
        s = match_place(tuple(a["start"]), date)
        e = match_place(tuple(a["end"]), date) if a["end"] else None
        new, rule = build_name(a2, s, e)
        if new is None:  # 兜底: 逆地理命名
            new, rule = fallback_name(a2, tuple(a["start"]), tuple(a["end"]) if a["end"] else None)
        if new is None:
            skips[rule] += 1
            continue
        new = GEO_NAME_OVERRIDES.get(new, new)
        if new == old:
            skips["unchanged"] += 1
            continue
        rules[rule] += 1
        renames.append({"run_id": a["run_id"], "old": old, "new": new, "rule": rule,
                        "date": a["start_date_local"], "type": a["type"], "km": km})

    json.dump(renames, open(RENAME_FILE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    with open(CSV_FILE, "w", encoding="utf-8-sig") as f:
        f.write("run_id,日期,类型,距离km,原名称,新名称,规则\n")
        for r in sorted(renames, key=lambda x: x["date"] or ""):
            f.write(f"{r['run_id']},{r['date']},{r['type']},{r['km']},{r['old']},{r['new']},{r['rule']}\n")
    print(f"RENAMES={len(renames)} skips={dict(skips)}")
    print("rules:", dict(rules))
    for n, c in Counter(r["new"] for r in renames).most_common(20):
        print(f"  {c:4d} × {n}")
    print(f"-> {RENAME_FILE} / {CSV_FILE}（核查后执行 apply-local）")


# ---------------- 3. apply-local ----------------

def cmd_apply_local(args):
    ren = json.load(open(RENAME_FILE, encoding="utf-8"))
    con = sqlite3.connect(DB_FILE)
    cur = con.cursor()
    n = 0
    for r in ren:
        cur.execute("update activities set name=? where run_id=?", (r["new"], r["run_id"]))
        n += cur.rowcount
    con.commit()
    ok = sum(1 for r in ren if con.execute("select name from activities where run_id=?", (r["run_id"],)).fetchone()[0] == r["new"])
    print(f"data.db updated={n} verified={ok}/{len(ren)}")

    sys.path.insert(0, "run_page")
    from config import GPX_FOLDER, JSON_FILE, SQL_FILE  # noqa: E402
    from utils import make_activities_file_only  # noqa: E402
    make_activities_file_only(SQL_FILE, GPX_FOLDER, JSON_FILE)
    print("activities.json regenerated")
    import subprocess
    subprocess.run([sys.executable, "run_page/save_to_parqent.py"], check=True)
    print("data.parquet regenerated")


# ---------------- 4. garmin-map ----------------

def _load_garmin_client():
    import asyncio  # noqa: F401
    sys.path.insert(0, "run_page")
    from garmin_sync import Garmin  # noqa: E402
    secret = open(SECRET_FILE, encoding="utf-8").read().strip()
    return Garmin(secret, "CN")


def cmd_garmin_map(args):
    from datetime import datetime

    def parse_local(s):
        s = s.replace("T", " ").split(".")[0]
        return datetime.strptime(s[:19], "%Y-%m-%d %H:%M:%S")

    import asyncio

    async def main():
        ren = json.load(open(RENAME_FILE, encoding="utf-8"))
        g = _load_garmin_client()
        cc = g.client
        garmin = []
        start = 0
        while True:
            batch = await g.get_activities(start, 100)
            if not batch:
                break
            for a in batch:
                garmin.append({"id": a.get("activityId"), "start": parse_local(a.get("startTimeLocal")),
                               "distance": a.get("distance") or 0, "name": a.get("activityName")})
            start += 100
        print(f"garmin activities fetched: {len(garmin)}", flush=True)
        mapping, unmatched = {}, []
        for r in ren:
            if not r["date"]:
                unmatched.append(r)
                continue
            lt = parse_local(r["date"])
            best, best_score = None, None
            for ga in garmin:
                dt = abs((ga["start"] - lt).total_seconds())
                dd = abs(ga["distance"] - r["km"] * 1000)
                if dt <= 180 and dd <= 300 and (best_score is None or dt + dd / 100 < best_score):
                    best, best_score = ga, dt + dd / 100
            if best:
                mapping[r["run_id"]] = {"garmin_id": best["id"], "old_garmin_name": best["name"], "new": r["new"]}
            else:
                unmatched.append(r)
        json.dump(mapping, open(GARMIN_MAP_FILE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"mapped: {len(mapping)}  not-on-garmin: {len(unmatched)} -> {GARMIN_MAP_FILE}", flush=True)

        if args.test:
            rid = next(iter(mapping))
            m = mapping[rid]
            gid = str(m["garmin_id"])
            print(f"TEST: run_id={rid} garmin_id={gid} {m['old_garmin_name']!r} -> {m['new']!r}", flush=True)
            before = cc.get_activity(gid)
            cc.set_activity_name(gid, m["new"])
            await asyncio.sleep(1)
            after = cc.get_activity(gid)
            diffs = [k for k in set(before) | set(after) if k != "activityName" and before.get(k) != after.get(k)]
            print(f"TEST result: name_ok={after.get('activityName') == m['new']} non-name-diffs={diffs}", flush=True)
        await g.req.aclose()

    asyncio.run(main())


# ---------------- 5. garmin-apply ----------------

def cmd_garmin_apply(args):
    import asyncio

    async def main():
        mapping = json.load(open(GARMIN_MAP_FILE, encoding="utf-8"))
        g = _load_garmin_client()
        cc = g.client
        done, failed = 0, []
        items = list(mapping.items())
        for i, (rid, m) in enumerate(items, 1):
            gid = str(m["garmin_id"])
            ok = False
            for attempt in range(3):
                try:
                    cc.set_activity_name(gid, m["new"])
                    ok = True
                    break
                except Exception as e:
                    if "429" in str(e):
                        time.sleep(10 * (attempt + 1))
                        continue
                    if attempt == 2:
                        failed.append((rid, gid, m["new"], str(e)[:120]))
                    break
            done += int(ok)
            if i % 50 == 0:
                print(f"progress: {i}/{len(items)} ok={done} fail={len(failed)}", flush=True)
            time.sleep(0.22)
        print(f"DONE ok={done} fail={len(failed)}", flush=True)
        for f in failed[:20]:
            print("FAIL:", f, flush=True)
        await g.req.aclose()

    asyncio.run(main())


def main():
    p = argparse.ArgumentParser(description="活动批量改名工具（详见文件头注释）")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("analyze", help="解析起终点坐标")
    sub.add_parser("plan", help="生成改名表(需 AMAP_KEY)")
    sub.add_parser("apply-local", help="写入 data.db 并重生成导出文件")
    sp = sub.add_parser("garmin-map", help="映射佳明活动ID")
    sp.add_argument("--test", action="store_true", help="改名单条验证(仅改 lastUpdateDate)")
    sub.add_parser("garmin-apply", help="佳明批量改名")
    args = p.parse_args()
    {"analyze": cmd_analyze, "plan": cmd_plan, "apply-local": cmd_apply_local,
     "garmin-map": cmd_garmin_map, "garmin-apply": cmd_garmin_apply}[args.cmd](args)


if __name__ == "__main__":
    main()
