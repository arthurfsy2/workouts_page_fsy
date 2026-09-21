"""把体脂秤的体重数据同步进本项目。

本脚本是**编排层**:只负责「选数据源 -> 取数 -> 匹配活动 -> 产出文件」。
具体怎么从各家平台 / 文件拿到数据,由 ``weight_sources/`` 里的适配器负责,
所以新增一个数据源**不需要改动本文件**(见 ``weight_sources/__init__.py``)。

设计前提:本仓库允许被 fork,而 fork 的人不一定有体脂秤账号。
因此核心约束是 **没有数据源时必须安全地什么都不做** —— 不写库也不产出数据,
前端据此整体隐藏体重列与体重趋势图,对方不需要任何改动。

用法::

    # 好轻账号直连(CI 里读 vars.WEIGHT_SOURCE 与 YUNMAI_* secret)
    WEIGHT_SOURCE=yunmai python run_page/weight_sync.py
    # 从远端 JSON 拉取
    python run_page/weight_sync.py --url https://.../weight.json
    # 指向本地文件(离线运行 / 调试 / 只做匹配)
    python run_page/weight_sync.py --file D:/path/to/weight_fsy.json
    # 只取数并产出前端 JSON,不碰数据库(供独立的取数 workflow 使用)
    python run_page/weight_sync.py --fetch-only
    # 显式关闭,并把已有体重数据一并清空
    python run_page/weight_sync.py --disable

数据源契约:对象数组,每项至少要有日期字段与 ``weight``(kg)。
日期字段按 ``createTime`` -> ``date`` -> ``dateNum`` 的顺序自动识别,
``fat``(体脂率 %)可选,其余字段一律忽略 —— 所以好轻那种 33 个字段的原始
dump 可以原样喂进来。

匹配规则:活动当天没有称重记录时,向前后各找 ``WEIGHT_TOLERANCE_DAYS``
天内最近的一条;距离相同时取更早的那条(运动前称重更接近当时的体重)。
"""

import argparse
import datetime
import json
import os
import sys
from bisect import bisect_left

from config import (
    JSON_FILE,
    SQL_FILE,
    WEIGHT_JSON_FILE,
    WEIGHT_SOURCE,
    WEIGHT_SOURCE_FILE,
    WEIGHT_SOURCE_URL,
    WEIGHT_TOLERANCE_DAYS,
    YUNMAI_ACCOUNT,
    YUNMAI_API_SECRET,
    YUNMAI_PASSWORD,
    YUNMAI_RSA_PUBLIC_KEY,
)
from generator.db import Activity, Weight, init_db
from weight_sources import SourceNotConfigured, get_source

PARENT_DIR = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))


def parse_args():
    parser = argparse.ArgumentParser(description="同步体重数据(可选功能)")
    parser.add_argument(
        "--source",
        default="",
        help="数据源代号,如 yunmai / url / file;留空则按配置自动判断",
    )
    parser.add_argument("--url", default="", help="体重 JSON 的远端地址")
    parser.add_argument("--file", default="", help="体重 JSON 的本地路径(优先于 URL)")
    parser.add_argument(
        "--tolerance",
        type=int,
        default=None,
        help="活动当天没有记录时,向前后各取多少天内最近的一条",
    )
    parser.add_argument(
        "--local",
        action="store_true",
        help=(
            "用本仓库已提交的 src/static/weights.json 做匹配 "
            "(调试用;主管线会现拉数据源,不走这条路径)"
        ),
    )
    parser.add_argument(
        "--fetch-only",
        action="store_true",
        help="只取数并产出前端 JSON,不改动数据库(调试 / 供外部消费)",
    )
    parser.add_argument(
        "--disable",
        action="store_true",
        help="显式关闭本次同步,并清空已有体重数据",
    )
    return parser.parse_args()


def load_yaml_weight_config():
    """读取 config.yaml 的 sync.weight 段(可选,config.yaml 不入库)。"""
    path = os.path.join(PARENT_DIR, "config.yaml")
    if not os.path.exists(path):
        return {}
    try:
        import yaml

        with open(path, encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
    except Exception as error:
        print(f"::warning::读取 config.yaml 的 sync.weight 失败,已忽略: {error}")
        return {}
    return (data.get("sync") or {}).get("weight") or {}


def resolve_source(args):
    """确定数据源与其参数、以及容忍天数。

    优先级:命令行参数 > 环境变量 > config.yaml。
    都拿不到数据源时返回空代号,编排层会走「安全跳过」分支。
    """
    yaml_cfg = load_yaml_weight_config()
    url = str(args.url or WEIGHT_SOURCE_URL or yaml_cfg.get("source_url") or "").strip()
    file_path = str(
        args.file or WEIGHT_SOURCE_FILE or yaml_cfg.get("source_file") or ""
    ).strip()
    if args.tolerance is not None:
        tolerance = args.tolerance
    else:
        tolerance = int(yaml_cfg.get("tolerance_days", WEIGHT_TOLERANCE_DAYS))

    # --local:直接吃本仓库已提交的 weights.json 产物。
    # 这条路径不需要任何凭证,主管线据此与「取数」完全解耦。
    if args.local:
        return (
            "file",
            {"url": "", "file_path": WEIGHT_JSON_FILE, "date_field": None},
            tolerance,
        )

    name = (
        str(args.source or WEIGHT_SOURCE or yaml_cfg.get("source") or "")
        .strip()
        .lower()
    )
    if not name and not args.disable:
        # 自动判断:显式给了文件/URL 就用对应适配器;
        # 只有配了账号密码才认为对方想用好轻直连。
        if file_path:
            name = "file"
        elif url:
            name = "url"
        elif YUNMAI_ACCOUNT and YUNMAI_PASSWORD:
            name = "yunmai"

    kwargs = {}
    if name in ("url", "file"):
        kwargs = {
            "url": url,
            "file_path": file_path,
            "date_field": yaml_cfg.get("date_field"),
        }
    elif name == "yunmai":
        kwargs = {
            "account": YUNMAI_ACCOUNT,
            "password": YUNMAI_PASSWORD,
            "rsa_public_key": YUNMAI_RSA_PUBLIC_KEY,
            "api_secret": YUNMAI_API_SECRET,
        }
    return name, kwargs, tolerance


def upsert_weights(session, series):
    existing = {row.date: row for row in session.query(Weight).all()}
    for date, row in existing.items():
        if date not in series:
            session.delete(row)
    for date, point in series.items():
        row = existing.get(date)
        if row is None:
            row = Weight(date=date)
            session.add(row)
        row.weight = point["weight"]
        row.fat = point["fat"]
        row.measured_at = point["measured_at"]


def match_activities(session, series, tolerance_days):
    """给每个活动写入就近匹配到的体重,返回 (活动总数, 匹配成功数)。"""
    dates = list(series)
    ordinals = [datetime.date.fromisoformat(d).toordinal() for d in dates]
    total = 0
    matched = 0

    for activity in session.query(Activity).all():
        total += 1
        # 先清空,避免数据源缩小后残留旧的匹配结果
        activity.weight = None
        activity.weight_date = None
        activity.fat = None

        start = activity.start_date_local or ""
        if len(start) < 10:
            continue
        try:
            target = datetime.date.fromisoformat(start[:10]).toordinal()
        except ValueError:
            continue

        insertion = bisect_left(ordinals, target)
        best_index = None
        best_key = None
        for index in (insertion, insertion - 1):
            if not 0 <= index < len(ordinals):
                continue
            offset = abs(ordinals[index] - target)
            if offset > tolerance_days:
                continue
            # 距离相同时 ordinals[index] > target 为 False 的更早,会被优先选中
            key = (offset, ordinals[index] > target)
            if best_key is None or key < best_key:
                best_key = key
                best_index = index
        if best_index is None:
            continue

        point = series[dates[best_index]]
        activity.weight = point["weight"]
        activity.weight_date = point["date"]
        activity.fat = point["fat"]
        matched += 1

    return total, matched


def write_weights_json(series):
    payload = [
        {"date": point["date"], "weight": point["weight"], "fat": point["fat"]}
        for point in series.values()
    ]
    with open(WEIGHT_JSON_FILE, "w", encoding="utf-8") as f:
        # indent=0 一行一条,和 activities.json 一致,git diff 才能看出单条变化
        json.dump(payload, f, ensure_ascii=False, indent=0)
    print(f"  写出 {WEIGHT_JSON_FILE}({len(payload)} 条)")


def patch_activities_json(session):
    """把体重字段补写进 activities.json。

    activities.json 由各 sync 脚本在末尾生成,本脚本在其之后运行,所以这里
    只补齐字段、不重新扫描 GPX。数据库始终是更权威的来源:体重字段已经在
    ACTIVITY_KEYS 里,之后 JSON 即便被重新生成也会自动带上。
    """
    if not os.path.exists(JSON_FILE):
        print("::warning::activities.json 不存在,跳过补写")
        return

    activities_by_run = {a.run_id: a for a in session.query(Activity).all()}
    with open(JSON_FILE, encoding="utf-8") as f:
        activities = json.load(f)

    for item in activities:
        activity = activities_by_run.get(item.get("run_id"))
        if activity is not None and activity.weight is not None:
            item["weight"] = activity.weight
            item["weight_date"] = activity.weight_date
            item["fat"] = activity.fat
        else:
            # 没有数据源时不写入 null,保持 JSON 干净
            item.pop("weight", None)
            item.pop("weight_date", None)
            item.pop("fat", None)

    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(activities, f, indent=0)


def clear_weight_data(session):
    session.query(Weight).delete()
    for activity in session.query(Activity).all():
        activity.weight = None
        activity.weight_date = None
        activity.fat = None


def reset_weight_data(fetch_only=False):
    """清空体重数据,让前端回到「没有这项功能」的状态。

    ``--fetch-only`` 时不碰数据库(该模式本来就不需要数据库)。
    """
    write_weights_json({})
    if fetch_only:
        return
    session = init_db(SQL_FILE)
    try:
        clear_weight_data(session)
        session.commit()
        patch_activities_json(session)
    finally:
        session.close()


def print_skip_message(reason):
    print(f"体重同步已跳过: {reason}")
    print("  -> 清空已有体重数据,前端不会显示任何体重列与体重图表")


def safe_skip(reason, fetch_only=False):
    """安全跳过:打好日志,然后清空体重数据,始终返回 0。"""
    print_skip_message(reason)
    try:
        reset_weight_data(fetch_only)
    except Exception as error:
        print(f"::warning::清空体重数据时出错(已忽略): {error}")
    return 0


def prepare_series(args):
    """选数据源并取数。

    返回 ``(skip_reason, series, tolerance)``:

    - ``skip_reason`` 非空 -> 应当**清空**体重数据,这是 fork 者的正常路径;
    - ``series`` 非空      -> 取数成功,可以进入匹配流程;
    - 两者都为空           -> 取数失败或数据为空,**保留**现有数据不做改动。
    """
    name, kwargs, tolerance = resolve_source(args)

    # ---- 没有数据源:安全跳过并清空,这是 fork 者的正常路径 ----
    if args.disable or not name:
        reason = (
            "--disable"
            if args.disable
            else "未配置数据源(WEIGHT_SOURCE / WEIGHT_SOURCE_URL / "
            "WEIGHT_SOURCE_FILE / config.yaml)"
        )
        return reason, None, tolerance

    try:
        source = get_source(name, **kwargs)
    except SourceNotConfigured as error:
        return str(error), None, tolerance

    print(f"读取体重数据源: {source.describe()}")
    try:
        series = source.fetch()
    except Exception as error:
        print(f"::warning::体重数据获取失败,保留现有数据不做改动: {error}")
        return None, None, tolerance

    if series:
        return None, series, tolerance

    if args.local:
        # weights.json 是空的,说明本仓库没有配置取数 workflow —— 这是 fork 者的
        # 正常路径,必须**清空**而不是保留,否则会看到上游提交的体重数据。
        return (
            "src/static/weights.json 为空(本仓库未配置体重数据源)",
            None,
            tolerance,
        )

    # 远端数据源偶尔返回空,保留现有数据比清空更安全
    print("::warning::体重数据里没有有效记录,已跳过")
    return None, None, tolerance


def main():
    args = parse_args()
    skip_reason, series, tolerance = prepare_series(args)

    if skip_reason is not None:
        return safe_skip(skip_reason, args.fetch_only)

    if series is None:
        return 0

    if args.fetch_only:
        write_weights_json(series)
        print("  --fetch-only:已产出前端数据,未改动数据库")
        return 0

    session = init_db(SQL_FILE)
    try:
        upsert_weights(session, series)
        total, matched = match_activities(session, series, tolerance)
        session.commit()
        write_weights_json(series)
        patch_activities_json(session)

        rate = matched / total * 100 if total else 0.0
        print(
            f"  体重 {len(series)} 天;活动 {total} 条匹配到 {matched} 条"
            f"(+/-{tolerance} 天),覆盖率 {rate:.1f}%"
        )
        return 0
    finally:
        session.close()


if __name__ == "__main__":
    sys.exit(main())
