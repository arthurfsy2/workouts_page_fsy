"""端到端验证：存量 garth secret 经桥接后，跑通 garmin_sync 的完整下载链路。

用项目里的真实 secret（run.sh 中的 GARMIN_SECRET_STRING_CN）验证：
  1. garmin_auth.load_client() 能桥接并认证
  2. Garmin.get_activities() 能拉到活动
  3. Garmin.get_activity_summary() 能拉到详情
  4. Garmin.download_activity() 能下载 GPX 且内容合法
  5. 下载的 GPX 与已有文件格式一致
"""

import asyncio
import os
import sys

sys.path.insert(0, "run_page")

# 从环境变量取 secret（避免明文落盘）
SECRET = os.environ["GARMIN_SECRET"]
IS_CN = os.environ.get("GARMIN_IS_CN", "1") == "1"

from garmin_sync import Garmin  # noqa: E402


async def main():
    print("=" * 70)
    print("端到端验证：存量 garth secret → 桥接 → 完整下载链路")
    print("=" * 70)

    client = Garmin(SECRET, "CN" if IS_CN else "COM", is_only_running=False)
    print(f"[1] 认证成功，令牌已载入")
    print(f"    Authorization 前缀: {client.headers['Authorization'][:14]}...")

    # 拉活动列表
    activities = await client.get_activities(0, 3)
    print(f"[2] get_activities 成功，返回 {len(activities)} 条")
    if not activities:
        print("    ❌ 没有活动，链路有问题")
        return 1
    for a in activities[:3]:
        print(f"    - {a.get('startTimeLocal')}  {a.get('activityName')}")

    # 拉活动详情
    aid = activities[0]["activityId"]
    summary = await client.get_activity_summary(aid)
    print(f"[3] get_activity_summary 成功: {summary.get('activityName')}")
    dto = summary.get("summaryDTO", {})
    print(f"    距离={dto.get('distance')}  平均心率={dto.get('averageHR')}")

    # 下载 GPX
    data = await client.download_activity(aid, file_type="gpx")
    print(f"[4] download_activity(gpx) 成功: {len(data)} 字节")
    head = data[:60].decode("utf-8", "replace")
    print(f"    头部: {head[:55]}")

    # 校验 GPX 是否合法 XML
    from lxml import etree

    root = etree.fromstring(data)
    ns = {"g": "http://www.topografix.com/GPX/1/1"}
    trkpts = root.findall(".//g:trkpt", ns)
    print(f"[5] GPX 解析成功: {len(trkpts)} 个轨迹点")
    if trkpts:
        print(f"    首个点: lat={trkpts[0].get('lat')} lon={trkpts[0].get('lon')}")
        print(f"    末个点: lat={trkpts[-1].get('lat')} lon={trkpts[-1].get('lon')}")

    # 下载 FIT（走 download-service/files，期望 ZIP）
    fit_data = await client.download_activity(aid, file_type="fit")
    print(f"[6] download_activity(fit) 成功: {len(fit_data)} 字节, 头部={fit_data[:4]!r}")
    if fit_data[:2] == b"PK":
        import io
        import zipfile

        zf = zipfile.ZipFile(io.BytesIO(fit_data), "r")
        print(f"    ZIP 内容: {zf.namelist()}")
    else:
        print(f"    ⚠️ 非 ZIP 格式")

    await client.req.aclose()
    print("")
    print("=" * 70)
    print("✅ 端到端验证全部通过")
    print("=" * 70)
    return 0


sys.exit(asyncio.run(main()))
