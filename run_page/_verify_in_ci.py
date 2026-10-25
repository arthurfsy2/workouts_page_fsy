"""CI 一次性验证任务:在真实 GitHub Secret 环境下验证新库桥接是否可用.

用 workflow_dispatch 手动触发,把结果打到日志里.
不修改任何持久化状态,只读 + 打印诊断信息.
"""

import asyncio
import base64
import json
import os
import sys

sys.path.insert(0, "run_page")

SECRET = os.environ["GARMIN_SECRET"]
IS_CN = os.environ.get("GARMIN_IS_CN", "1") == "1"


def diag_secret(secret):
    """诊断 secret 的实际格式与有效期(不回显令牌内容)."""
    print("--- secret 诊断 ---")
    print(f"  长度: {len(secret)}")
    try:
        raw = base64.urlsafe_b64decode(secret + "=" * (-len(secret) % 4))
        parsed = json.loads(raw)
    except Exception as e:
        print(
            f"  不是 garth base64 格式: {type(e).__name__} -> 可能是 garminconnect 原生 JSON"
        )
        try:
            d = json.loads(secret)
            print(f"  JSON 字段: {list(d.keys())}")
            p = d.get("di_token", "").split(".")[1]
            payload = json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)))
            print(
                f"  di_token exp: {payload.get('exp')}  client_id: {payload.get('client_id')}"
            )
        except Exception as e2:
            print(f"  JSON 解析也失败: {e2}")
        return

    if isinstance(parsed, list) and len(parsed) == 2:
        o1, o2 = parsed
        print("  格式: garth 旧格式 (base64 JSON list)")
        print(f"  OAuth1 oauth_token: {o1.get('oauth_token','')[:20]}...")
        print(f"  OAuth1 domain: {o1.get('domain')}")
        print(f"  OAuth2 expires_at: {o2.get('expires_at')}")
        print(
            f"  OAuth2 refresh_token_expires_at: {o2.get('refresh_token_expires_at')}"
        )
    else:
        print(
            f"  格式: JSON dict, 字段 {list(parsed.keys()) if isinstance(parsed, dict) else type(parsed)}"
        )


async def main():
    print("=" * 70)
    print("CI 环境：新库桥接验证")
    print("=" * 70)
    diag_secret(SECRET)

    from garmin_auth import bridge_garth_secret, is_garth_secret

    print(f"\n  is_garth_secret: {is_garth_secret(SECRET)}")
    bridged = bridge_garth_secret(SECRET)
    print(f"  桥接后长度: {len(bridged)}")

    from garmin_sync import Garmin

    print("\n--- 载入客户端 ---")
    try:
        client = Garmin(SECRET, "CN" if IS_CN else "COM", is_only_running=False)
        print("  ✅ 认证成功")
    except Exception as e:
        print(f"  ❌ 认证失败: {type(e).__name__}: {str(e)[:300]}")
        return 1

    print("\n--- 拉取活动 ---")
    try:
        acts = await client.get_activities(0, 3)
        print(f"  ✅ 返回 {len(acts)} 条")
        for a in acts[:3]:
            print(f"     - {a.get('startTimeLocal')}  {a.get('activityName')}")
    except Exception as e:
        print(f"  ❌ 失败: {type(e).__name__}: {str(e)[:250]}")
        return 2

    print("\n--- 下载 GPX ---")
    try:
        aid = acts[0]["activityId"]
        data = await client.download_activity(aid, file_type="gpx")
        print(f"  ✅ {len(data)} 字节，头部 {data[:40]!r}")
    except Exception as e:
        print(f"  ❌ 失败: {type(e).__name__}: {str(e)[:200]}")
        return 3

    await client.req.aclose()
    print("\n" + "=" * 70)
    print("✅ CI 环境验证全部通过")
    print("=" * 70)
    return 0


sys.exit(asyncio.run(main()))
