import weights from '@/static/weights.json';
import { SHOW_WEIGHT } from '@/utils/const';

export interface WeightPoint {
  date: string; // YYYY-MM-DD，北京时间称重当天
  weight: number; // kg
  fat?: number | null; // 体脂率 %，早年记录可能缺失
}

/**
 * 体脂秤的每日体重序列。
 *
 * 数据来自 `src/static/weights.json`，由 `run_page/weight_sync.py` 生成。
 * 这里刻意使用普通 import 而非运行时请求：构建产物自带数据，
 * 不依赖任何第三方域名，也不需要在部署平台配置任何凭证。
 */
export const WEIGHTS = weights as WeightPoint[];

/**
 * 是否存在可用的体重数据。
 *
 * fork 本仓库但自己没有体脂秤账号时，`weights.json` 会是空数组 `[]`，
 * 这里即为 `false` —— 表格里的体重列与体重趋势图都完全不渲染，
 * 对方不需要改任何代码或配置。
 */
export const HAS_WEIGHT_DATA = SHOW_WEIGHT && WEIGHTS.length > 0;

/** 两个 `YYYY-MM-DD` 相差的天数（b - a）。 */
export const daysBetween = (a: string, b: string): number =>
  Math.round(
    (new Date(`${b}T00:00:00`).getTime() -
      new Date(`${a}T00:00:00`).getTime()) /
      86400000
  );
