"""Garmin 认证适配层 —— 用 python-garminconnect 接管,兼容存量 garth secret.

背景
----
garth 0.5.17 依赖的 SSO embed 流程目前仍可用,但该库已被作者弃用,无维护无补丁;
python-garminconnect(cyberjunky 维护)用 curl_cffi 伪装 TLS 指纹 + 五级降级策略链,
抗风险明显更高.

两库令牌格式不同,无法直接互换:

  garth 0.5.17     : base64(urlsafe) 编码的 JSON list,len=2
                     [0] = OAuth1 (oauth_token / oauth_token_secret / mfa_token / domain)
                     [1] = OAuth2 (access_token / refresh_token / expires_at ...)
  garminconnect    : 明文 JSON dict
                     {"di_token", "di_refresh_token", "di_client_id"}

但两者的 access_token 同源——都由 https://diauth.garmin.cn 签发(DI 体系),
因此存量 garth secret 可以桥接转换,无需重新生成凭据,无需改动 GitHub Secret.

本模块提供:
  1. bridge_garth_secret()  —— 把 garth secret 转成 garminconnect 的 di_* 格式
  2. load_client()          —— 载入客户端,令牌过期时自动 refresh
  3. bearer_header()        —— 构造 connectapi 请求头(DI 令牌必须带 Bearer 前缀)
"""

import base64
import json
import logging
import time

from garminconnect import Garmin

logger = logging.getLogger(__name__)

# DI 专用 client_id。从 garth 的 access_token JWT payload 中解析得到，
# 与 garminconnect 登录时自行使用的值一致。
DI_CLIENT_ID_FALLBACK = "GARMIN_CONNECT_MOBILE_ANDROID_DI"

# refresh 失败时的重试参数（与项目既有 429 指数退避风格一致）
RETRY_MAX_ATTEMPTS = 5
RETRY_BASE_DELAY = 10


def _b64url_decode(text):
    """解码可能缺 padding 的 base64url."""
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _jwt_payload(token):
    """解出 JWT payload,失败返回空 dict."""
    try:
        parts = token.split(".")
        if len(parts) < 2:
            return {}
        return json.loads(_b64url_decode(parts[1]))
    except Exception:
        return {}


def _jwt_exp(token):
    """取 JWT 的 exp(秒级时间戳),取不到返回 None."""
    exp = _jwt_payload(token).get("exp")
    try:
        return int(exp)
    except (TypeError, ValueError):
        return None


def is_garth_secret(secret_string):
    """判断给定 secret 是否为 garth 格式(base64 的 JSON list)."""
    if not secret_string:
        return False
    try:
        parsed = json.loads(_b64url_decode(secret_string))
    except Exception:
        return False
    return isinstance(parsed, list) and len(parsed) == 2


def bridge_garth_secret(secret_string):
    """把 garth 格式 secret 转换成 garminconnect 的 di_* JSON 串.

    无法桥接时原样返回(假设已是 garminconnect 格式).
    """
    if not is_garth_secret(secret_string):
        return secret_string

    parsed = json.loads(_b64url_decode(secret_string))
    oauth1, oauth2 = parsed[0], parsed[1]

    access_token = oauth2.get("access_token")
    refresh_token = oauth2.get("refresh_token")
    if not access_token or not refresh_token:
        raise ValueError("garth secret 缺少 access_token / refresh_token")

    payload = _jwt_payload(access_token)
    client_id = payload.get("client_id") or DI_CLIENT_ID_FALLBACK

    bridged = {
        "di_token": access_token,
        "di_refresh_token": refresh_token,
        "di_client_id": client_id,
    }
    logger.info(
        "已把 garth secret 桥接为 DI 令牌格式 (client_id=%s, domain=%s)",
        client_id,
        oauth1.get("domain", "?"),
    )
    return json.dumps(bridged)


def _token_expired(client, skew=60):
    """DI 令牌是否已过期(本地判断,skew 为容差秒数)."""
    exp = _jwt_exp(client.di_token or "")
    if exp is None:
        return False
    return exp <= int(time.time()) + skew


def refresh_with_retry(
    client, max_attempts=RETRY_MAX_ATTEMPTS, base_delay=RETRY_BASE_DELAY
):
    """刷新 DI 令牌,遇 429 走指数退避.

    与项目既有的 garth 429 退避策略保持同一风格.
    """
    import requests

    for attempt in range(max_attempts):
        try:
            client._refresh_di_token()
            return
        except requests.exceptions.HTTPError as e:
            status = getattr(getattr(e, "response", None), "status_code", None)
            if status == 429:
                delay = base_delay * (2**attempt)
                print(
                    f"Garmin DI token refresh rate limited (429). "
                    f"Retrying in {delay}s (attempt {attempt + 1}/{max_attempts})..."
                )
                time.sleep(delay)
                continue
            raise
        except Exception as e:
            # 有些错误直接带 429 字样
            if "429" in str(e):
                delay = base_delay * (2**attempt)
                print(
                    f"Garmin DI token refresh rate limited (429). "
                    f"Retrying in {delay}s (attempt {attempt + 1}/{max_attempts})..."
                )
                time.sleep(delay)
                continue
            raise
    raise RuntimeError(
        "Garmin DI token refresh failed after all retries. "
        "请重新生成 secret：uv run python run_page/get_garmin_secret.py <email> <password>"
    )


def load_client(secret_string, is_cn=False):
    """载入已认证的 garminconnect 客户端.

    secret_string 既接受存量 garth 格式(自动桥接),也接受 garminconnect 格式.
    令牌过期时自动 refresh.
    """
    bridged = bridge_garth_secret(secret_string)
    client = Garmin(is_cn=is_cn)
    client.client.loads(bridged)

    if _token_expired(client.client):
        logger.info("DI 令牌已过期，执行 refresh")
        refresh_with_retry(client.client)
    else:
        exp = _jwt_exp(client.client.di_token or "")
        if exp:
            logger.info("DI 令牌有效，剩余 %d 秒", exp - int(time.time()))

    return client


def bearer_header(client, origin):
    """构造 connectapi 请求头.

    DI 令牌必须带 "Bearer " 前缀,否则服务端返回 403.
    """
    return {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "origin": origin,
        "nk": "NT",
        "Authorization": f"Bearer {client.client.di_token}",
    }
