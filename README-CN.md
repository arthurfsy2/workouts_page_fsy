## note1: use v2.0 need change vercel setting from Gatsby to Vite

## note2: 2023.09.26 garmin need secret_string(and in Actions) get `python run_page/garmin_sync.py ${secret_string}` if cn `python run_page/garmin_sync.py ${secret_string} --is-cn`

## note3: 2024.08.19: Added `Elevation Gain` field

- For old data: To include `Elevation Gain` for past activities, perform a full reimport

# [打造个人户外运动主页](http://workouts.ben29.xyz)

![screenshot](https://user-images.githubusercontent.com/6956444/163125711-24d0ad99-490d-4c04-b89f-5b7fe776eb38.png)

简体中文 | [English](README.md)

本项目基于 [running_page](https://github.com/yihong0618/running_page/blob/master/README-CN.md) , 添加了支持多种运动类型。部署可参考原项目操作步骤

## 新增特性

1. 支持多种运动类型，如骑行、徒步、游泳
1. 支持 APP 数据获取
   - **[咕咚](#codoon咕咚)** (因咕咚限制单个设备原因，无法自动化)
   - **[行者](#行者)**
1. 支持 [自驾(Google 路书)](#自驾google路书) , 把自驾路线也展示在地图上
1. 支持**体重 / 体脂率**（可选，见 [体重 / 体脂率](#体重--体脂率可选)）：
   把体脂秤的数据匹配到活动上，并在汇总页画体重趋势图；**没有配置数据源时会自动隐藏，
   fork 本仓库的人不需要做任何改动**

## 一些个性化选项

### 自定义运动颜色

- 修改骑行颜色: `src/utils/const.js` 里的 `RIDE_COLOR`

### 新增运动类型

- 修改 `scripts/config.py`, `TYPE_DICT` 增加类型映射关系, `MAPPING_TYPE` 里增加运动类型
- 修改 `src/utils/const.js`, 增加类型标题，并加入到 `RUN_TITLES`
- 修改 `src/utils/util.js` 里的 `colorFromType`, 增加 case 指定颜色; `titleForRun` 增加 case 指定类型标题
- 参考这个 [commit](https://github.com/ben-29/workouts_page/commit/f3a35884d626009d33e05adc76bbc8372498f317)
- 或 [留言](https://github.com/ben-29/workouts_page/issues/20)

---

### Codoon（咕咚）

<details>
<summary>获取您的咕咚数据</summary>

```python
python3(python) run_page/codoon_sync.py ${your mobile or email} ${your password}
```

示例：

```python
python3(python) run_page/codoon_sync.py 13333xxxx xxxx
```

> 注：我增加了 Codoon 可以导出 gpx 功能, 执行如下命令，导出的 gpx 会加入到 GPX_OUT 中，方便上传到其它软件

```python
python3(python) run_page/codoon_sync.py ${your mobile or email} ${your password} --with-gpx
```

示例：

```python
python3(python) run_page/codoon_sync.py 13333xxxx xxxx --with-gpx
```

> 注：因为登录 token 有过期时间限制，我增加了 refresh_token&user_id 登陆的方式， refresh_token 及 user_id 在您登陆过程中会在控制台打印出来

![image](https://user-images.githubusercontent.com/6956444/105690972-9efaab00-5f37-11eb-905c-65a198ad2300.png)

示例：

```python
python3(python) run_page/codoon_sync.py 54bxxxxxxx fefxxxxx-xxxx-xxxx --from-auth-token
```

</details>

### 行者

<details>
<summary>获取您的行者数据</summary>

```python
python3(python) scripts/xingzhe_sync.py ${your mobile or email} ${your password}
```

示例：

```python
python3(python) scripts/xingzhe_sync.py 13333xxxx xxxx
```

> 注：我增加了 行者 可以导出 gpx 功能, 执行如下命令，导出的 gpx 会加入到 GPX_OUT 中，方便上传到其它软件

```python
python3(python) scripts/xingzhe_sync.py ${your mobile or email} ${your password} --with-gpx
```

示例：

```python
python3(python) scripts/xingzhe_sync.py 13333xxxx xxxx --with-gpx
```

> 注：因为登录 token 有过期时间限制，我增加了 refresh_token&user_id 登陆的方式， refresh_token 及 user_id 在您登陆过程中会在控制台打印出来

![image](https://user-images.githubusercontent.com/6956444/106879771-87c97380-6716-11eb-9c28-fbf70e15e1c3.png)

示例：

```python
python3(python) scripts/xingzhe_sync.py w0xxx 185000 --from-auth-token
```

</details>

### 自驾(Google 路书)

<details>
<summary>导入谷歌地图的KML路书</summary>

1. 使用 [谷歌地图](https://www.google.com/maps/d/) ，创建地图(路线放到同一个图层)
2. 把图层导出为 KML 文件
3. 把 kml 文件重命名为 `import.kml`, 放到 `scripts`目录
4. 修改`scripts/kml2polyline.py`, 填入路线相关信息

```
# TODO modify here
# 路线名称
track.name = "2020-10 西藏 Road Trip"
# 开始/结束时间 年月日时分
track.start_time = datetime(2020, 9, 29, 10, 0)
track.end_time = datetime(2020, 10, 10, 18, 0)
# 总路程
distance = 4000  # KM
# 总天数
days = 12
# 平均每天自驾时长
hours_per_day = 6
```

5. 控制台执行以下脚本

```python
python3(python) scripts\kml2polyline.py
```

</details>

### 体重 / 体脂率（可选）

<details>
<summary>把体脂秤的体重数据匹配到活动上，并画体重趋势图</summary>

这是一个**完全可选**的功能：没有配置数据源时，表格里不会出现「体重」「体脂率」两列，
汇总页也不会出现体重趋势图 —— fork 本仓库但自己没有体脂秤的人不需要做任何改动。

取到的数据会按活动日期就近匹配（默认前后 3 天内最近的一条）。非当天的匹配会在数字后面
标一个 `*`，鼠标悬停可以看到实际称重日期，例如「体重 86.79 kg（称重于 2026-08-23，与本次活动相差 1 天）」。
历史记录里体脂率为 `0` 的按「没测出来」处理，不显示。

#### 数据从哪来

`run_page/weight_sources/` 里每个文件对应一种数据源，目前支持三种：

| `source` | 说明 | 需要配置 |
| --- | --- | --- |
| `yunmai` | 好轻体脂秤，用账号密码直连 | Secret：`YUNMAI_ACCOUNT` / `YUNMAI_PASSWORD` |
| `url` | 从一个远端 JSON 地址取数 | 变量：`WEIGHT_SOURCE_URL`（建议用 jsdelivr） |
| `file` | 从一个本地 JSON 文件取数 | 变量：`WEIGHT_SOURCE_FILE` |

新增一种数据源只需要在 `run_page/weight_sources/` 加一个文件，并在 `__init__.py` 里登记一行；
匹配活动、写数据库、产出前端 JSON 全部由 `run_page/weight_sync.py` 统一处理，
**编排层和前端都不需要改动**。

#### 数据格式

任何数据源最终都要产出一个 JSON 对象数组：

```json
[
  { "date": "2026-09-14", "weight": 85.01, "fat": 23.4 },
  { "date": "2026-09-13", "weight": 84.8, "fat": 23.2 }
]
```

- `weight`（kg）与日期字段必填，`fat`（体脂率 %）可选。
- 日期字段支持 `createTime`、`date`、`dateNum`（如 `20260914`），会自动识别。
- **其余字段一律忽略**，所以原始导出里那些额外字段不需要清理。

#### 好轻用户怎么接

1. 在仓库 `Settings → Secrets and variables → Actions` 添加两个 **Secret**：
   `YUNMAI_ACCOUNT`（手机号）、`YUNMAI_PASSWORD`。
2. 添加一个 **Variable**：`WEIGHT_SOURCE` = `yunmai`。
   （Variable **不会被 fork 继承**，所以别人 fork 你的仓库时这里是空的，功能自动隐藏。）
3. 手动跑一次 `Run Data Sync` workflow 验证，之后它会每天北京时间 09:00 / 19:30
   自动取数并把体重匹配到活动上。

> **关于客户端常量**：好轻的接口需要在请求里带上 App 内置的 RSA 公钥与签名 secret。
> 这两个值在 `run_page/weight_sources/yunmai.py` 里有内置默认值，**开箱可用**；
> 如果你希望公开仓库里不留下可供他人直接复制的痕迹，可以把它们放进
> `YUNMAI_RSA_PUBLIC_KEY`（多行 PEM 可写成一行、用 `\n` 转义）与 `YUNMAI_API_SECRET`
> 两个 Secret，脚本会自动优先使用 Secret 里的值。

#### 用 URL 而不是账号密码

不想放账号密码的话，可以让别的程序（或另一个仓库的定时任务）先把数据导出成 JSON，
你这边只配一个直链：

```yaml
# config.yaml
sync:
  weight:
    source: url
    source_url: 'https://cdn.jsdelivr.net/gh/<你的账号>/<你的仓库>@<分支>/<文件>.json'
```

> 建议用 jsdelivr 之类的 CDN，**不要用 `raw.githubusercontent.com`**：
> 实测部分网络下 raw 会返回空响应，导致取数静默失败。

#### 取数与匹配的时机

`Run Data Sync`（`run_data_sync.yml`）在每天北京时间 09:00 / 19:30 运行，
**每次运行时现拉体脂秤数据，然后立刻匹配到活动上**——取数和匹配在同一时刻完成，
当天称的体重当天就能匹配上（前提是匹配发生时已经称过）。

曾经把取数拆成独立的 `weight_fetch.yml`（每天 06:00 先取数提交快照，主管线再读
快照匹配），但这样匹配永远用的是「上一次取数时刻」的体重：今天称的体重最早要
明天才被匹配上，活动日期越新错位越明显，所以已合并进主管线。

`run_page/data.db` 是 SQLite 二进制文件，主管线自带 `concurrency` 组串行执行，
避免并发提交冲突。

#### 本地调试

```bash
# 用本地 JSON 跑全流程
python run_page/weight_sync.py --file /path/to/weight.json
# 只取数，产出前端 JSON，不动数据库
python run_page/weight_sync.py --fetch-only
# 用已提交的 weights.json 只做匹配
python run_page/weight_sync.py --local
# 彻底关闭并清空
python run_page/weight_sync.py --disable
```

#### 免责声明

好轻直连适配器使用的是好轻 App 自身的接口，仅用于**导出你自己账号下的数据**做个人备份，
与好轻官方无关，不提供任何代取服务，也不建议用于商业用途。请自行评估并承担使用风险；
建议使用独立的密码，并保持低频调用（随主管线每天两次）。

</details>

## 数据对账与去重

<details>
<summary>同一次活动被记了多条 / 佳明上删了记录但页面还在</summary>

#### 背景

本项目的 `run_id` 是**活动开始时间的毫秒时间戳**（不是平台活动 ID）。所以同一次骑行如果
被码表和手机各记一次（开始时间差几秒），或者从两个平台各导入一次，就会在数据库里各存一行。
历史上因此积累过大量重复，现已清理，并在两个方向加了防线：

1. **入库守卫**（`run_page/generator/db.py` 的 `find_duplicate_activity`，所有 sync 脚本
   共用）：新活动入库前按「同类型 + 距离差 <500m + 开始时间差 <10 分钟」模糊查重，
   命中就更新已有记录而不是新建，日志里会打印 `duplicate detected: ... merging`
2. **对账脚本**（`run_page/reconcile_garmin.py`）：清理「佳明官方库里已删除、本地 db 还在」
   的记录（典型场景：分段活动合并后删掉了佳明上的分段）

#### 对账脚本用法

```bash
# 试运行:只列出「佳明官方库已不存在、本地仍有」的可疑记录,不删任何东西
uv run python run_page/reconcile_garmin.py

# 人工过目确认无误后,真删并重新生成 activities.json
uv run python run_page/reconcile_garmin.py --apply
```

佳明 token 读取 `~/.garminconnect_fsy`（garth 的 client dumps，CN 域名，过期自动刷新）。
文件不存在时，用 `run_page/get_garmin_secret.py` 登录后把 `garth.client.dumps()` 的输出
存为该文件即可。

#### 安全边界（对其他数据源的影响）

- 只比对 `source='Garmin Connect'` 的记录；咕咚 / Keep / GPX 等来源（`source=''`）
  **不查也不删**，即使它们不在佳明官方库里
- 匹配规则与入库守卫一致（同日 ±10 分钟、距离差 <500m），匹配不上才列为失效，
  宁漏勿删；`--apply` 前请务必人工过目试运行输出

#### 分段合并的标准流程

在佳明 App 里合并分段、删除原分段 → 跑一次对账脚本（先 dry-run 看清单，确认后
`--apply`）→ 数据库与前端数据自动恢复一致。

</details>

# 致谢

- @[yihong0618](https://github.com/yihong0618) 特别棒的项目 [running_page](https://github.com/yihong0618/running_page) 非常感谢
