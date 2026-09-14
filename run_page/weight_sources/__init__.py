"""体重数据源注册表。

新增一个数据源只需要两步:
    1. 在本目录新建 ``xxx.py``,实现 ``WeightSource`` 子类;
    2. 在下面的 ``_SOURCES`` 里登记一行(延迟导入,避免不必要的依赖被加载)。
"""

from .base import (  # noqa: F401  (对外导出,方便调用方直接从包里拿)
    SourceNotConfigured,
    WeightSource,
    build_series,
    pick_date_field,
)

#: 数据源代号 -> 模块名:类名
_SOURCES = {
    "yunmai": ("yunmai", "YunmaiSource"),
    "url": ("remote_file", "RemoteFileSource"),
    "file": ("remote_file", "RemoteFileSource"),
}


def available_sources():
    """返回所有已登记的数据源代号。"""
    return sorted(_SOURCES)


def get_source(name, **kwargs):
    """按代号实例化数据源。

    ``name`` 为空时抛 ``SourceNotConfigured`` —— 编排层据此走「安全跳过」
    分支,这样 fork 本仓库但没有体脂秤账号的人不需要做任何配置。
    """
    key = (name or "").strip().lower()
    if not key:
        raise SourceNotConfigured("未指定数据源")
    if key not in _SOURCES:
        raise SourceNotConfigured(
            f"未知的数据源 '{key}',可选: {', '.join(available_sources())}"
        )

    module_name, class_name = _SOURCES[key]
    module = __import__(f"{__name__}.{module_name}", fromlist=[class_name])
    return getattr(module, class_name)(**kwargs)
