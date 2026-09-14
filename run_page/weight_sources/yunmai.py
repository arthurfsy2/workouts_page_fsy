"""好轻(yunmai)体脂秤数据源。

用账号密码直连,不需要中间仓库或第三方 CDN。

本文件是从 ``yunmai_weight_extract2json/fetcher.py`` **精简移植**而来,
只保留「账号密码 -> 体重数据」这一条最短路径的 5 个方法:

    1. ``_encrypt_account_password``  账号 base64 + 密码 RSA(PKCS#1 v1.5)
    2. ``_md5``                        接口签名用
    3. ``_login``                      换取 refreshToken / userId
    4. ``_get_access_token``           换取 accessToken
    5. ``_get_weight_data``            拉取 chart-list

**刻意没有移植**的功能(本站用不到,且会扩大凭证与日志暴露面):
佳明上传(``upload_to_garmin``)、周报(``get_weekly_data``)、HTML 报表、
打包 zip、以及 ``SaveRefreshToken`` 的本地 token 落盘缓存 —— 本站每次运行
都重新登录,不在磁盘上留下任何可复用的凭证。

关于日志:本仓库是公开的,而公开仓库的 Actions 日志也是公开的,所以这里
**不打印任何请求体、签名、token 或带 token 的 URL**,只打印聚合后的条数。
"""

import base64
import hashlib
import time
import urllib.parse

import requests
from Crypto.Cipher import PKCS1_v1_5
from Crypto.PublicKey import RSA

from .base import WeightSource, build_series

# ---------------------------------------------------------------------------
# 逆向自好轻 App 的客户端常量。
#
# 这两个常量本身是从 APK 里提取出来的,严格说不是「密钥」而是「门槛」:
# 放在代码里意味着任何人 grep 一下就能复用(这也是官方最容易注意到的一条路径),
# 所以这里支持用环境变量覆盖 —— 把它们放进 GitHub Secret,公开仓库里就不留痕迹。
# 不配置时回退到内置值,保证开箱可用。
# ---------------------------------------------------------------------------
DEFAULT_RSA_PUBLIC_KEY = (
    "-----BEGIN PUBLIC KEY-----\n"
    "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJKcIu+iATe0QPGIVDzMYsMA6kH9FcY9\n"
    "Or0I4WJJfEgw/N2e0Us/9JVV1CwdV6W2XIl4KqTeH3ydw6tagagPkSsCAwEAAQ==\n"
    "-----END PUBLIC KEY-----"
)
DEFAULT_API_SECRET = "AUMtyBDV3vklBr6wtA2putAMwtmVcD5b"

# 与官方 Android 客户端一致的伪装 UA(接口会校验)
APP_USER_AGENT = (
    "google/android(10,29) channel(huawei) app(4.25,42500010)"
    "screen(w,h=1080,1794)/scale"
)

LOGIN_URL = "https://account.iyunmai.com/api/android//user/login.d"
TOKEN_URL = "https://account.iyunmai.com/api/android///auth/token.d"
DATA_URL = "https://data.iyunmai.com/api/ios/scale/chart-list.json"


class YunmaiError(Exception):
    """好轻接口调用失败(网络问题、账号密码错误、接口变更等)。"""


def _normalize_pem(value):
    """允许在 Secret 里用 ``\\n`` 转义写多行 PEM。"""
    if not value:
        return ""
    if "\n" not in value and "\\n" in value:
        return value.replace("\\n", "\n")
    return value


class YunmaiSource(WeightSource):
    """好轻体脂秤数据源。"""

    name = "yunmai"

    def __init__(
        self,
        account="",
        password="",
        rsa_public_key="",
        api_secret="",
        start_date=None,
    ):
        self.account = (account or "").strip()
        self.password = (password or "").strip()
        self.rsa_public_key = _normalize_pem(rsa_public_key) or DEFAULT_RSA_PUBLIC_KEY
        self.api_secret = (api_secret or "").strip() or DEFAULT_API_SECRET
        self.start_date = start_date
        # 复用内置常量时不额外提示;用了 Secret 覆盖就安静地什么都不说。
        self._custom_key = bool(_normalize_pem(rsa_public_key))

    def describe(self):
        return "yunmai(直连) key=%s" % ("secret" if self._custom_key else "builtin")

    # -- 1. 账号密码加密 ---------------------------------------------------
    def _encrypt_account_password(self):
        account_b64 = base64.b64encode(self.account.encode()).decode()
        account_uri = urllib.parse.quote(account_b64)

        rsakey = RSA.importKey(self.rsa_public_key)
        cipher = PKCS1_v1_5.new(rsakey)
        cipher_text = base64.b64encode(cipher.encrypt(self.password.encode("utf-8")))
        password_rsa = cipher_text.decode("utf-8").replace("\n", "")
        password_uri = urllib.parse.quote(password_rsa)

        return account_b64, account_uri, password_rsa, password_uri

    # -- 2. 签名 -----------------------------------------------------------
    @staticmethod
    def _md5(text):
        return hashlib.md5(text.encode("utf-8")).hexdigest()

    def _sign_code(self):
        return str(int(time.time()))[:8] + "00"

    # -- 3. 登录 -----------------------------------------------------------
    def _login(self):
        account_b64, account_uri, password_rsa, password_uri = (
            self._encrypt_account_password()
        )

        code = self._sign_code()
        device_uuid = "abcd"
        user_id = "199999999"

        login_sign = (
            f"code={code}&deviceUUID={device_uuid}&loginType=1"
            f"&password={password_rsa}\n"
            f"&signVersion=3&userId={user_id}&userName={account_b64}\n"
            f"&versionCode=7&secret={self.api_secret}"
        )
        payload = (
            f"password={password_uri}%0A&code={code}&loginType=1"
            f"&userName={account_uri}%0A"
            f"&deviceUUID={device_uuid}&versionCode=7&userId={user_id}"
            f"&signVersion=3&sign={self._md5(login_sign)}"
        )

        try:
            response = requests.post(
                LOGIN_URL,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": APP_USER_AGENT,
                },
                data=payload,
                timeout=30,
            )
            result = response.json()
            code_value = result["result"]["code"]
        except YunmaiError:
            raise
        except Exception as error:
            raise YunmaiError(f"登录请求失败: {error}") from error

        if code_value != 0:
            message = result.get("result", {}).get("msg", "unknown")
            raise YunmaiError(f"登录被拒绝: {message}")

        try:
            userinfo = result["data"]["userinfo"]
            return userinfo["refreshToken"], userinfo["userId"]
        except (KeyError, TypeError) as error:
            raise YunmaiError("登录响应结构异常,接口可能已变更") from error

    # -- 4. 换 accessToken -------------------------------------------------
    def _get_access_token(self, refresh_token):
        code = self._sign_code()
        token_sign = (
            f"code={code}&refreshToken={refresh_token}&signVersion=3"
            f"&versionCode=2&secret={self.api_secret}"
        )
        payload = (
            f"code={code}&refreshToken={refresh_token}"
            f"&sign={self._md5(token_sign)}&signVersion=3&versionCode=2"
        )

        try:
            response = requests.post(
                TOKEN_URL,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": APP_USER_AGENT,
                },
                data=payload,
                timeout=30,
            )
            result = response.json()
            code_value = result["result"]["code"]
        except Exception as error:
            raise YunmaiError(f"accessToken 请求失败: {error}") from error

        if code_value != 0:
            message = result.get("result", {}).get("msg", "unknown")
            raise YunmaiError(f"accessToken 获取失败: {message}")

        try:
            return result["data"]["accessToken"]
        except (KeyError, TypeError) as error:
            raise YunmaiError("accessToken 响应结构异常,接口可能已变更") from error

    # -- 5. 取体重数据 -----------------------------------------------------
    def _get_weight_data(self, access_token, user_id):
        # 默认拉取 9999 天(约 27 年)以内的全部记录,与官方 App 的行为一致
        start_time = str(int(time.time()) - 9999 * 24 * 60 * 60)
        if self.start_date:
            start_time = str(
                int(time.mktime(time.strptime(self.start_date, "%Y-%m-%d")))
            )

        params = {
            "code": str(int(time.time())),
            "signVersion": "3",
            "startTime": start_time,
            "userId": user_id,
            "versionCode": "2",
        }
        try:
            response = requests.get(
                DATA_URL,
                params=params,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": APP_USER_AGENT,
                    # 注意:accessToken 走 header 而不是拼进 URL,
                    # 免得它被错误日志或异常信息带出去。
                    "accessToken": access_token,
                },
                timeout=60,
            )
            result = response.json()
        except Exception as error:
            raise YunmaiError(f"体重数据请求失败: {error}") from error

        if result.get("result", {}).get("code") not in (0, None):
            message = result.get("result", {}).get("msg", "unknown")
            raise YunmaiError(f"体重数据被拒绝: {message}")

        try:
            rows = result["data"]["rows"]
        except (KeyError, TypeError) as error:
            raise YunmaiError("体重数据响应结构异常,接口可能已变更") from error

        if rows is None:
            raise YunmaiError("体重数据为空")
        return rows

    # -- 对外入口 ----------------------------------------------------------
    def fetch(self):
        if not self.account or not self.password:
            raise RuntimeError(
                "已选择 yunmai 数据源,但缺少账号或密码"
                "(需配置 YUNMAI_ACCOUNT / YUNMAI_PASSWORD)"
            )
        print("  好轻:登录并拉取体重数据")
        refresh_token, user_id = self._login()
        access_token = self._get_access_token(refresh_token)
        rows = self._get_weight_data(access_token, user_id)
        print(f"  好轻:拿到 {len(rows)} 条原始记录")
        return build_series(rows, label="yunmai")
