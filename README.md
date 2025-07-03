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

## 新功能说明

第3-4参考了以下项目，Thanks！：

- [danielyu316](https://github.com/danielyu316/running_page) | [网站](https://danielyu316.github.io/running_page/)
- [mxz94 (mx)](https://github.com/mxz94) | [网站](https://run.malanxi.top/)
