"""CI 环境诊断：打印 secret 的结构与有效期元信息（不含令牌内容）。

用于确认 GitHub Secret 与本地 run.sh 那份是否一致。
"""

import base64
import json
import os
import time

secret = os.environ["GARMIN_SECRET"]
print("=== secret 诊断 ===")
print(f"  长度: {len(secret)}")

# 尝试 garth 格式
try:
    raw = base64.urlsafe_b64decode(secret + "=" * (-len(secret) % 4))
    parsed = json.loads(raw)
except Exception:
    parsed = None

if isinstance(parsed, list) and len(parsed) == 2:
    o1, o2 = parsed
    now = int(time.time())
    print("  格式: garth (base64 JSON list)")
    print(f"  OAuth1 oauth_token: {o1.get('oauth_token','')[:20]}...")
    print(f"  OAuth1 domain: {o1.get('domain')}")
    print(f"  OAuth2 expires_at: {o2.get('expires_at')} (now={now})")
    print(f"    access_token 剩余: {o2.get('expires_at', 0) - now} 秒")
    print(f"  OAuth2 refresh_token_expires_at: {o2.get('refresh_token_expires_at')}")
    print(f"    refresh_token 剩余: {o2.get('refresh_token_expires_at', 0) - now} 秒")
else:
    print("  格式: 非 garth（可能是 garminconnect 原生 JSON）")
    try:
        d = json.loads(secret)
        print(f"  字段: {list(d.keys())}")
    except Exception as e:
        print(f"  解析失败: {e}")

# 用新库尝试 various refresh 路径
print()
print("=== 尝试用新库载入并 refresh ===")
try:
    from garminconnect import Garmin

    client = Garmin(is_cn=True)
    # 先按 garth 格式桥接
    from garmin_auth import bridge_garth_secret

    bridged = bridge_garth_secret(secret)
    client.client.loads(bridged)
    print("  loads() 成功")
    print(f"  di_client_id: {client.client.di_client_id}")

    try:
        client.client._refresh_di_token()
        print("  _refresh_di_token() 成功 ✅")
    except Exception as e:
        print(f"  _refresh_di_token() 失败: {type(e).__name__}: {str(e)[:200]}")

    # 试 OAuth1 -> CAS exchange
    if isinstance(parsed, list):
        import requests
        from urllib.parse import parse_qs, quote

        o1 = parsed[0]
        UA = {"User-Agent": "com.garmin.android.apps.connectmobile"}
        base = "https://connectapi.garmin.cn/oauth-service/oauth/"
        url = (
            f"{base}preauthorized?ticket={quote(o1['oauth_token'])}"
            "&login-url=https://sso.garmin.cn/sso/embed&accepts-mfa-tokens=true"
        )
        r = requests.get(url, headers=UA, timeout=30)
        print(f"\n  OAuth1 preauthorized -> {r.status_code}")
        if r.status_code == 200:
            p = {k: v[0] for k, v in parse_qs(r.text).items()}
            print(f"    字段: {list(p.keys())}")
            from requests_oauthlib import OAuth1Session

            sess = OAuth1Session(
                resource_owner_key=p.get("oauth_token"),
                resource_owner_secret=p.get("oauth_token_secret"),
            )
            r2 = sess.post(
                f"{base}exchange/user/2.0",
                headers={**UA, "Content-Type": "application/x-www-form-urlencoded"},
                data={},
                timeout=30,
            )
            print(f"    exchange/user/2.0 -> {r2.status_code}")
            if r2.status_code == 200:
                tok = r2.json()
                print(f"    ✅ 拿到新 OAuth2, expires_in={tok.get('expires_in')}")
                c2 = Garmin(is_cn=True)
                c2.client.loads(json.dumps({
                    "di_token": tok["access_token"],
                    "di_refresh_token": tok.get("refresh_token"),
                    "di_client_id": "GARMIN_CONNECT_MOBILE_ANDROID_DI",
                }))
                acts = c2.get_activities(0, 2)
                print(f"    ✅ 桥接后 API 成功，返回 {len(acts)} 条")
                for a in acts[:2]:
                    print(f"       - {a.get('startTimeLocal')} {a.get('activityName')}")
            else:
                print(f"    body: {r2.text[:200]}")
        else:
            print(f"    body: {r.text[:200]}")
except Exception as e:
    print(f"  诊断异常: {type(e).__name__}: {str(e)[:250]}")
