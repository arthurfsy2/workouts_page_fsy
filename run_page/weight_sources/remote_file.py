"""远端 URL / 本地文件数据源。

这是最通用、也是「无凭证」的一条路:任何能产出符合契约的 JSON 数组的
服务都可以直接用,不需要在本仓库里写任何代码。契约见 ``build_series``:

    [{"date": "2026-09-14", "weight": 85.01, "fat": 23.4}, ...]

``date``(或 ``createTime`` / ``dateNum``)与 ``weight`` 必填,``fat`` 可选,
其余字段一律忽略 —— 所以好轻那种 33 个字段的原始 dump 可以原样喂进来。
"""

import json
import urllib.request

from .base import SourceNotConfigured, WeightSource, build_series


def fetch_records(url="", file_path=""):
    """按「本地文件优先」的顺序把 JSON 读进来。"""
    if file_path:
        with open(file_path, encoding="utf-8") as f:
            return json.load(f)
    request = urllib.request.Request(
        url, headers={"User-Agent": "workouts_page-weight-sync"}
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


class RemoteFileSource(WeightSource):
    """从一个 URL 或本地 JSON 文件读取体重数据。"""

    name = "url/file"

    def __init__(self, url="", file_path="", date_field=None):
        self.url = (url or "").strip()
        self.file_path = (file_path or "").strip()
        self.date_field = date_field
        if not self.url and not self.file_path:
            raise SourceNotConfigured("未提供 URL 或本地文件路径")

    def describe(self) -> str:
        return f"url/file -> {self.file_path or self.url}"

    def fetch(self):
        records = fetch_records(self.url, self.file_path)
        return build_series(records, date_field=self.date_field, label="url/file")
