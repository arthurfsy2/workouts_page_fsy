"""体重数据源的抽象层。

设计目标:把「怎么拿到数据」和「拿到数据之后怎么用」彻底解耦。

- 每个数据源只需实现 ``WeightSource.fetch()``,返回归一化后的每日序列
  ``{YYYY-MM-DD: {date, weight, fat, measured_at}}``;
- 匹配活动、写库、产出前端 JSON 由 ``run_page/weight_sync.py`` 统一负责;
- 新增一个数据源 = 在本目录加一个文件 + 在 ``__init__.py`` 注册一行,
  编排层与前端都不需要改动。

本仓库允许被 fork,而 fork 的人不一定有体脂秤账号,所以每个数据源都要能
表达「我不可用」——编排层据此走安全跳过分支,前端整体隐藏体重列与趋势图。
"""

from abc import ABC, abstractmethod

# 识别日期时按顺序尝试的字段名。
# 刻意不包含 timeStamp:它是 UTC 时间戳,与本项目的「本地称重日」口径不一致,
# 强行换算反而容易把日期算错一天,让数据源自己转换成 ISO 日期更安全。
DATE_FIELD_CANDIDATES = ("createTime", "date", "dateNum", "measuredAt", "measured_at")


class SourceNotConfigured(Exception):
    """数据源缺少必要配置(例如账号密码)。

    这属于「正常情况」而不是错误:编排层会据此安全跳过并清空体重数据,
    让 fork 者在不配置任何东西时得到干净的空状态。
    """


class WeightSource(ABC):
    """所有体重数据源的基类。"""

    #: 用于日志的简短名称
    name = "unknown"

    @abstractmethod
    def fetch(self) -> dict:
        """返回 ``{YYYY-MM-DD: {...}}`` 形式的每日体重序列。"""

    def describe(self) -> str:
        """给日志用的一行描述,不要包含任何凭证。"""
        return self.name


def _as_float(value):
    """把数值或数值字符串统一成 float,无法转换时返回 None。"""
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip())
        except ValueError:
            return None
    return None


def _normalize_date(raw, field):
    """把某个字段的值规整成 ``YYYY-MM-DD``,失败返回空串。

    支持两种形态:
    - ``2026-09-14 10:10:57`` / ``2026-09-14``(取前 10 位);
    - ``20260914``(8 位纯数字,如好轻的 ``dateNum``)。
    """
    if raw is None:
        return ""
    text = str(raw).strip()
    if not text:
        return ""
    digits = text.replace("-", "").replace("/", "")
    if field == "dateNum" or (len(digits) == 8 and digits.isdigit()):
        if len(digits) == 8 and digits.isdigit():
            return f"{digits[:4]}-{digits[4:6]}-{digits[6:]}"
    return text[:10] if len(text) >= 10 else ""


def pick_date_field(records, date_field=None):
    """决定用哪个字段当作称重日期。

    显式传入的 ``date_field`` 优先;否则按 ``DATE_FIELD_CANDIDATES``
    在第一批记录里探测,探不到就回退到 ``createTime``。
    """
    if date_field:
        return date_field
    for candidate in DATE_FIELD_CANDIDATES:
        for record in records[:20]:
            if isinstance(record, dict) and record.get(candidate) not in (None, ""):
                return candidate
    return DATE_FIELD_CANDIDATES[0]


def build_series(records, date_field=None, label=""):
    """把原始记录整理成 ``{YYYY-MM-DD: {...}}``,同一天多条取最晚的一条。

    日期一律取**数据源自己给出的本地日期**(好轻是 ``createTime``,北京时间),
    而不是 UTC 时间戳 —— 实测约 22% 的好轻记录两者不在同一天,用 UTC 会把
    称重日算错。

    体脂率为 0(或负数)视为「没测出来」而不是真的 0%,统一记成 None。
    """
    if not isinstance(records, list):
        raise ValueError("体重数据源返回的不是数组")

    field = pick_date_field(records, date_field)
    series = {}
    skipped = 0
    for record in records:
        if not isinstance(record, dict):
            skipped += 1
            continue
        measured_at = str(record.get(field) or "")
        date = _normalize_date(record.get(field), field)
        weight = _as_float(record.get("weight"))
        if len(date) != 10 or weight is None or weight <= 0:
            skipped += 1
            continue
        fat = _as_float(record.get("fat"))
        if fat is None or fat <= 0:
            fat = None
        current = series.get(date)
        if current is not None and current["measured_at"] >= measured_at:
            continue
        series[date] = {
            "date": date,
            "weight": round(weight, 2),
            "fat": round(fat, 2) if fat is not None else None,
            "measured_at": measured_at,
        }
    if skipped:
        print(f"  跳过 {skipped} 条日期或体重无效的记录")
    if label:
        print(f"  归一化后 {len(series)} 天(字段 {field})")
    return dict(sorted(series.items()))
