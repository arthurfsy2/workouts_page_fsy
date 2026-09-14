## 修改

> 以下为主观的审美设置

1. 设置为浅色主题 + 圆角风格 + 加粗字体
2. 年份选择改为竖向
3. 部分字段新增 `emoji`，表格表头引入中英文映射
4. 所有SVG图片的字体颜色、背景颜色统一设置为浅色+圆角
5. 汇总页面原有轨迹、日历svg改为tab切换

## 样式修改说明

参考了以下仓库，Thanks！

- [danielyu316](https://github.com/danielyu316/running_page) | [网站](https://danielyu316.github.io/running_page/)
- [liuxindtc (Blaine)](https://github.com/liuxindtc) | [网站](https://liuxin.run/)

## 新功能（相对于yihong的版本）

1. 新增每日一言

   > 中文：[Hitokoto - 一言](https://hitokoto.cn/)
   >

   > 英文：[lukePeavey/quotable: Random Quotes API](https://github.com/lukePeavey/quotable?tab=readme-ov-file#get-random-quotes)）
   >
2. 新增“DEFAULT_LOCATION”（`src\utils\const.ts`）：当某个活动的坐标数据为空时，定义到的城市。默认为深圳的经纬度
3. 新增汇总表功能
4. 新增年份统计/地点统计切换
5. 地点统计-运动次数统计区域：新增“百公里骑行”的汇总
6. 年份统计-每年汇总：新增新打卡地区、最早/最晚开始时间
7. 新增**体重 / 体脂率**列与体重趋势图（可选功能）：支持好轻体脂秤直连、远端 JSON、
   本地 JSON 三种数据源；**未配置数据源时会整体隐藏，fork 本仓库的人无需任何改动**。
   接入方式见 [README-CN.md](README-CN.md) 的「体重 / 体脂率」一节
8. 新增**数据对账与去重**体系：入库守卫自动合并多设备/多平台的重复记录；
   对账脚本清理佳明官方库已删除的本地残留。见 [README-CN.md](README-CN.md) 的
   「数据对账与去重」一节

## 新功能说明

第3-4参考了以下项目，Thanks！：

- [danielyu316](https://github.com/danielyu316/running_page) | [网站](https://danielyu316.github.io/running_page/)
- [mxz94 (mx)](https://github.com/mxz94) | [网站](https://run.malanxi.top/)
