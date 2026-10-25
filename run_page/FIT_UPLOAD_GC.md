# 上传第三方 FIT 到 Garmin Connect：训练效果（TE）触发条件

> 2026-10-25 实测记录。场景：迈金 C706 的 10.23 骑行 FIT（顽鹿导出）补齐公里分段后上传 GC，
> 页面没有训练效果；改成 Garmin 设备身份后，GC 自动计算并显示了 TE / 负荷。
>
> 2026-10-25 补充：拿 `cyberjunky/python-garminconnect` 0.3.20 的源码 / issues / 你的账号 DTO
> 交叉验证过一轮，**下文已按验证结果修正**（有两处初判是错的，见「证据核对」）。

## 结论

**Garmin Connect 只在 `file_id` 能对应到账号里已注册的 Garmin 设备时，才跑 Firstbeat 训练效果。
第三方厂商（Magene / Onelap 等）的 FIT 没有匹配设备，TE 为空。**

实测的因果链是：GC 上传后会用 `file_id.serial_number` 去设备注册表匹配，
匹配成功就把活动归到那台设备（活动 DTO 的 `metadataDTO.deviceMetaDataDTO` 会填上
`deviceId` / `deviceTypePk` / `deviceVersionPk`），于是走设备分析链路、算 TE。

> 不是「文件里写了 Garmin 就会算」——GC 不信任文件自称的身份，它拿去和自己的注册设备表比对。
> 所以序列号必须是账号里真实存在的一台设备的。

补充：服务端还有一个独立的 `trainingEffectLabelSrvrCalc` 字段（`activities.py:477`），
说明除设备计算外还有一条服务端计算通道；但你这账号所有活动的该字段都是 `null`，
触发条件未知，不能作为替代方案。

## 实测对照

| | 原始顽鹿/迈金 FIT | 改成 Garmin 身份后 |
|---|---|---|
| `file_id.manufacturer` | 107（MAGENE） | 1（GARMIN） |
| `file_id.product` | 50 | 3990（Forerunner 255 Music） |
| `file_id.product_name` | `C706_43138` | 删除 |
| `file_id.serial_number` | 2505190202 | 3431168141（手表的序列号） |
| `device_info` | 2 条设备信息 | 全部丢弃，只留 1 条 Garmin 风格（source_type=5） |
| GC 活动里的 `deviceMetaDataDTO` | `{deviceId: null, deviceTypePk: 0, deviceVersionPk: 0}` | `{deviceId: "3431168141", deviceTypePk: 45475, deviceVersionPk: 863796}`（与原生手表活动一致） |
| GC 训练效果 | 无（null） | **有：3.2 有氧 / 0.8 无氧，负荷 96.1** |
| GC 爬升 | 采用文件值 238 m | 同样采用文件值 238 m（两者 `elevationCorrected` 都是 false） |

> 注：`product=3990` 对应的是 **Forerunner 255 Music**（设备注册表 `partNumber: 006-B3990-00`,
> `deviceTypePk: 45475`, `applicationKey: forerunner255musicAsia`），不是 Edge 码表。
> 之前填的 3990 是照着账号里那条手表记录抄的，不是照码表抄的。

## 需要修改的字段（按 fit_tool 结构）

1. **FileIdMessage**
   - `manufacturer = 1`（Garmin）
   - `product` = 自己账号里**真实设备**的 product ID（本账号手表 = 3990）
   - `serial_number` = 那台设备真实的序列号（本账号手表 = 3431168141）
   - `product_name = None`（删掉 Magene 的型号串 `C706_43138`）
   - `time_created += 2h`（**避开判重**，见下）
2. **DeviceInfoMessage**
   - 丢掉原文件里的全部 device_info（码表 + 传感器）
   - 重新插入一条：`device_index=0, device_type=255, manufacturer=1,
     product=<同上>, serial_number=<同上>, software_version=29.05, source_type=5`
   - `source_type=5`（local）是 FIT 规范语义，库的 `FitEncoder.write_device_info()` 不写这个字段，
     无库内证据；但实测这套组合能被 GC 接受并识别成设备活动
3. **SessionMessage**
   - `total_training_effect` / `total_anaerobic_training_effect` **写了也没用**：
     GC 只认自己算的结果（实测写入 3.5/0.6，页面显示 3.2/0.8）。
     库也没有任何写入 TE 的方法，`typed.py` 里这些字段只建模为只读输出。

> 未做单字段隔离实验：以上是一整套改动的实测结果，没有逐字段验证哪一项是决定性的。
> 但可以确定 **serial_number 是核心**：GC 拿它匹配注册设备，product 只是配套；
> 如果只改 manufacturer/product 而留一个账号里不存在的 serial，预期不会触发。

## 判重规则（重要）

Garmin 的 Duplicate Activity 判定**不看文件名**，看 `file_id` 的
`serial_number` + `time_created`。想重传同一次骑行必须错开 `time_created`，
否则返回 409 + `{"code": 202, "content": "Duplicate Activity."}`，`internalId` 指向旧活动。

> 证据强度：库只验证了 409 响应体解析（`tests/test_garmin_unit.py:2357`），
> 没有文档化判重键。旁证：`demo.py` 的 409 提示语是「Try modifying the activity timestamps」。
> 本条的字段级结论来自实测。

## 爬升：活动级开关，与设备身份无关（此前判断有误）

初判说「伪装成 Garmin 设备后 `elevationCorrected` 变 false」，这是**相关而非因果**：
爬升来源是活动级开关，任何活动都能切。

- 现象：`metadataDTO.elevationCorrected` 为 `true` 时，页面爬升用 Garmin 的 DEM/survey 数据重算
  （10.23 案例：文件 238 m → 页面 1293 m）；为 `false` 时直接用文件里的 `total_ascent`。
- 切换接口（库未封装，见 issue #275 评论）：

  ```python
  url = f"/activity-service/activity/toggleElevationCorrection/{activityId}"
  garmin.client.post("connectapi", url, data={"elevationCorrected": "true"})
  ```

  `true` = 用 Garmin 的重算值，`false` = 用文件自带值。
- 反例佐证：账号里 9/24 的迈金活动（643550316）本来就是 `elevationCorrected: false`，
  说明厂商并不是决定因素。
- 结论：当时完全可以先传迈金原版、再调这个接口把爬升切回文件值，不必为了爬升去改身份。

## TE 不能原地修改

- `PUT activity-service/activity/{id}` 带 `trainingEffect` → 200 但值不变（白名单外字段被忽略）
- 带完整 DTO → 400
- 库的 `update_activity()` docstring 列出的可改字段只有 `activityName` / `description` /
  `activityTypeDTO` / `eventTypeDTO` / `metadataDTO` / `accessControlRuleDTO`，**没有 TE**
- **只能删掉旧活动再上传新文件**，`activityId` 会变；距离/分段/轨迹/名称不受影响

## 上传通道：别用 import_activity（未验证有坑）

库里有两条上传路径，行为不同：

| | `upload_activity()` | `import_activity()` |
|---|---|---|
| endpoint | `POST /upload-service/upload`，字段 `file` | `POST /upload-service/upload/{fmt}`，字段 `file` |
| headers | 默认 | GCM-iOS（`NK: NT`、`origin`、`UA: GCM-iOS-5.7.2.1`） |
| 语义 | 普通上传 | 明确标记为 **import rather than device-synced**，且不会转发给 Strava |

本文的 A/B 实验**两次都走 `upload_activity()` 那条路**，唯一变量是 FIT 身份，所以结论成立。
但 `import_activity()` 的 docstring 明确说它按「导入」而非「设备同步」处理，
很可能正好绕开设备分析链路——所以**不要**用 `import_activity()` 做 TE 伪装，
除非你实测确认它也能触发。

## 本地复现的最小流程（python-garminconnect 0.3.20）

garth 已从本项目移除，改用 `garminconnect`；`run_page/garmin_auth.py` 负责把存量 garth token
桥接成 DI token。上传/删除/查询活动都有现成方法：

```python
from run_page.garmin_auth import load_client
from pathlib import Path

g = load_client(Path.home().joinpath(".garminconnect_fsy").read_text(), is_cn=True)

g.upload_activity(dst)                 # 上传（不要用 import_activity）
# 轮询 activitylist-service/activities/search/activities 拿新 activityId
g.connectapi(f"/activity-service/activity/{aid}")          # 查 metadataDTO / summaryDTO
g.update_activity(aid, {"activityName": "前海到盐田"})      # 改名
g.delete_activity(old_aid)                                  # 删旧活动
# 爬升切换（未封装）
g.client.post("connectapi",
              f"/activity-service/activity/toggleElevationCorrection/{aid}",
              data={"elevationCorrected": "false"})
```

## 上传后本地数据约定

- `FIT_OUT/<activityId>.fit`：与 `garmin_sync` 下载命名一致（下载回来就是伪装的这份，含 TE 字段）
- `imported.json`：登记 `<activityId>.fit`
- `run_page/data.db` / `src/static/activities.json` 的 `run_id` 是**开始时间毫秒戳**，
  与 activityId 无关，不需要改；重新导入时 `update_or_create_activity` 会按 run_id 命中同一行
- 上传拿不到新 activityId 的返回值，需轮询
  `activitylist-service/activities/search/activities`（约数秒后出现）

## FIT 改写脚本骨架

> 前置：先跑 `process_fit(raw, fix_gcj02=True)` 补齐公里分段 / session event，再对它的输出做下面的身份改写，
> 否则传上去的版本没有分段气泡。两步不要顺序颠倒。

```python
from fit_tool.fit_file import FitFile
from fit_tool.fit_file_builder import FitFileBuilder
from fit_tool.profile.messages.file_id_message import FileIdMessage
from fit_tool.profile.messages.device_info_message import DeviceInfoMessage
from fit_tool.definition_message import DefinitionMessage

# 换成本账号真实设备的值
GARMIN_MFR = 1
DEVICE_PRODUCT = 3990          # Forerunner 255 Music
DEVICE_SERIAL = 3431168141     # 该手表的序列号
DEVICE_SOFTWARE = 29.05
TIME_SHIFT_MS = 2 * 3600 * 1000

fit = FitFile.from_file(src)
out = []
for record in fit.records:
    msg = record.message
    if isinstance(msg, DefinitionMessage):
        continue
    if isinstance(msg, FileIdMessage):
        for f in msg.fields:
            f.growable = True
        msg.manufacturer = GARMIN_MFR
        msg.product = DEVICE_PRODUCT
        msg.serial_number = DEVICE_SERIAL
        msg.product_name = None
        msg.time_created += TIME_SHIFT_MS
        msg.definition_message = None
    if isinstance(msg, DeviceInfoMessage):
        continue  # 丢掉第三方设备信息
    out.append((record.header.local_id, msg))

dev = DeviceInfoMessage()
dev.device_index = 0
dev.device_type = 255
dev.manufacturer = GARMIN_MFR
dev.product = DEVICE_PRODUCT
dev.serial_number = DEVICE_SERIAL
dev.software_version = DEVICE_SOFTWARE
dev.source_type = 5
out.insert(2, (None, dev))  # 放在 file_id / software 之后（实测上传成功的位置）

builder = FitFileBuilder(auto_define=True)
for local_id, msg in out:
    if local_id is not None:
        msg.local_id = local_id
        if msg.definition_message is not None:
            msg.definition_message.local_id = local_id
    builder.add(msg)
open(dst, "wb").write(builder.build().to_bytes())
```

注意：fit_tool 解析时对非 UTF-8 字符串会抛 `UnicodeDecodeError`，
需要 monkeypatch `Field.read_strings_from_bytes` 用 `errors="replace"`。
也可以直接用 `.venv` 里的 `garmin_fit_sdk` 读（它不炸），只是写入仍要 fit_tool。

## 证据核对（python-garminconnect 0.3.20）

| 判断 | 库内证据 | 结论 |
|---|---|---|
| Garmin 区分「设备同步」与「导入」两条通道 | `activities.py:256` docstring：imported activities are treated as imports rather than **device-synced activities**；issue #322 / commit `e68e52d` | 证实 |
| TE 是 GC 产出、不是文件字段 | `typed.py:432-441` 只建模为只读输出；全库无写 TE 的方法 | 证实 |
| 设备身份决定分析链路 | 无直接代码，但账号 DTO：伪装的 655028952 `deviceMetaDataDTO` 与原生手表活动完全一致，迈金活动为全 0/null | 强证据（实测 + DTO） |
| `elevationCorrected` 由设备身份决定 | —— | **被证伪**：是活动级开关，见上 |
| `product=3990` 是 Edge | 设备注册表 `partNumber: 006-B3990-00` = Forerunner 255 Music | **被证伪**：是手表 |
| 判重键 = serial_number + time_created | 仅有 409 响应体解析测试（`test_garmin_unit.py:2357`） | 无证据，仍为实测结论 |

## 风险

- Garmin 未公开行为，官方改版可能失效
- 伪造设备身份属于绕过平台校验，账号层面存在被判定异常上传的可能
- 只用于个人历史数据修补，不建议批量/公开使用
