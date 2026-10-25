"""生成佳明 secret —— 账密登录一次,产出可复用的 secret 串.

迁移说明
--------
旧实现基于 garth(已于 2026-03-28 被作者弃用).现改用 python-garminconnect,
它用 curl_cffi 伪装 TLS 指纹 + 五级降级策略链,能绕过 Garmin 的 Cloudflare 反爬.

产出的 secret 串有两种格式,sync 端都能吃:
  - garminconnect 原生格式:{"di_token","di_refresh_token","di_client_id"} 的 JSON
  - 存量 garth 格式:base64(JSON list) —— garmin_auth.bridge_garth_secret() 会自动桥接

注意:本库需 Python >= 3.12.

用法:
  python run_page/get_garmin_secret.py <email> <password> [--is-cn]
"""

import argparse
import sys

from garminconnect import Garmin


def make_secret(email, password, is_cn=False):
    """账密登录并返回可复用的 secret 串."""
    client = Garmin(email=email, password=password, is_cn=is_cn)
    client.login()
    # 令牌序列化在内层 client 上
    return client.client.dumps()


def main():
    parser = argparse.ArgumentParser(description="生成佳明 secret")
    parser.add_argument("email", nargs="?", help="佳明账号邮箱")
    parser.add_argument("password", nargs="?", help="佳明账号密码")
    parser.add_argument(
        "--is-cn",
        dest="is_cn",
        action="store_true",
        help="中国区账号",
    )
    options = parser.parse_args()
    if not options.email or not options.password:
        print("缺少 email/password 参数")
        sys.exit(1)
    secret = make_secret(options.email, options.password, options.is_cn)
    print(secret)


if __name__ == "__main__":
    main()
