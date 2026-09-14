import { type FC } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  MAIN_COLOR,
  RUNTABLE_TITLE,
  WEIGHT_CHART_CHANGE,
  WEIGHT_CHART_LATEST,
  WEIGHT_CHART_SPAN,
  WEIGHT_CHART_TITLE,
} from '@/utils/const';
import { WEIGHTS } from '@/utils/weight';
import styles from './style.module.css';

const WEIGHT_LINE_COLOR = MAIN_COLOR;
const BODY_FAT_LINE_COLOR = '#00AFAA';
const AXIS_TICK = { fill: '#999', fontSize: 11 };

interface ChartPoint {
  date: string;
  weight: number;
  fat: number | null;
}

/**
 * 体重 / 体脂率趋势图。
 *
 * 数据来自 `src/static/weights.json`，挂在汇总页。没有体重数据源时
 * 调用方依据 `HAS_WEIGHT_DATA` 不渲染本组件，所以这里不必做空数据兜底。
 */
const WeightChart: FC = () => {
  const data: ChartPoint[] = WEIGHTS.map((point) => ({
    date: point.date,
    weight: point.weight,
    fat: point.fat ?? null,
  }));

  const first = data.at(0);
  const last = data.at(-1);
  const change = first && last ? last.weight - first.weight : 0;
  const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(1)} kg`;
  const latestFat = [...data]
    .reverse()
    .find((point) => point.fat !== null)?.fat;

  // 两个 Y 轴都传显式数值区间：用 'dataMin - 2' 这类字符串表达式时
  // recharts 会生成 99994 这样的异常刻度。
  const weightValues = data.map((point) => point.weight);
  const fatValues = data
    .map((point) => point.fat)
    .filter((value): value is number => value !== null);
  const weightDomain: [number, number] = [
    Math.floor(Math.min(...weightValues) - 2),
    Math.ceil(Math.max(...weightValues) + 2),
  ];
  const fatDomain: [number, number] = [
    Math.floor(Math.min(...fatValues) - 2),
    Math.ceil(Math.max(...fatValues) + 2),
  ];

  // 横轴每年只留一个刻度，避免 1600+ 个日期糊成一片
  const yearTicks: string[] = [];
  let lastYear = '';
  data.forEach((point) => {
    const year = point.date.slice(0, 4);
    if (year !== lastYear) {
      yearTicks.push(point.date);
      lastYear = year;
    }
  });

  return (
    <div className={styles.weightSection}>
      <div className={styles.weightCard}>
        <div className={styles.weightHeader}>
          <h2 className={styles.weightTitle}>📉 {WEIGHT_CHART_TITLE}</h2>
          <div className={styles.weightMeta}>
            {last && (
              <span>
                {WEIGHT_CHART_LATEST} {last.weight.toFixed(1)} kg
                {latestFat != null &&
                  ` · ${RUNTABLE_TITLE.BODY_FAT_TITLE} ${latestFat.toFixed(1)} %`}
              </span>
            )}
            <span>
              {WEIGHT_CHART_CHANGE} {changeText}
            </span>
            {first && last && (
              <span>
                {WEIGHT_CHART_SPAN} {first.date} ~ {last.date}
              </span>
            )}
          </div>
        </div>
        <div className={styles.weightPlot}>
          <ResponsiveContainer>
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={AXIS_TICK}
                ticks={yearTicks}
                tickFormatter={(value: string) => value.slice(0, 4)}
              />
              <YAxis yAxisId="weight" tick={AXIS_TICK} domain={weightDomain} />
              <YAxis
                yAxisId="fat"
                orientation="right"
                tick={AXIS_TICK}
                domain={fatDomain}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(36, 36, 36)',
                  border: '1px solid #444',
                  color: 'rgb(204, 204, 204)',
                }}
                labelStyle={{ color: '#00AFAA' }}
              />
              <Legend />
              <Line
                yAxisId="weight"
                type="monotone"
                dataKey="weight"
                name={RUNTABLE_TITLE.WEIGHT_TITLE}
                unit=" kg"
                stroke={WEIGHT_LINE_COLOR}
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="fat"
                type="monotone"
                dataKey="fat"
                name={RUNTABLE_TITLE.BODY_FAT_TITLE}
                unit=" %"
                stroke={BODY_FAT_LINE_COLOR}
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WeightChart;
