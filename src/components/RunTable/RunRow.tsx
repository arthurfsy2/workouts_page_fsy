import {
  formatPace,
  colorFromType,
  formatRunTime,
  Activity,
  RunIds,
  titleForRun,
} from '@/utils/utils';
import { SHOW_ELEVATION_GAIN, IS_CHINESE, RUNTABLE_TITLE } from '@/utils/const';
import { HAS_WEIGHT_DATA, daysBetween } from '@/utils/weight';
import styles from './style.module.css';

interface IRunRowProperties {
  elementIndex: number;
  locateActivity: (_runIds: RunIds) => void;
  run: Activity;
  runIndex: number;
  setRunIndex: (_ndex: number) => void;
}

const RunRow = ({
  elementIndex,
  locateActivity,
  run,
  runIndex,
  setRunIndex,
}: IRunRowProperties) => {
  const distance = (run.distance / 1000.0).toFixed(2);
  const elevation_gain = run.elevation_gain?.toFixed(0);
  const paceParts = run.average_speed ? formatPace(run.average_speed) : null;
  const heartRate = run.average_heartrate;
  const type = run.type;
  const runTime = formatRunTime(run.moving_time);

  // 体重 / 体脂率(可选数据源,见 run_page/weight_sync.py)
  const activityDate = run.start_date_local?.slice(0, 10) ?? '';
  const weight = run.weight ?? null;
  const fat = run.fat ?? null;
  // 活动当天没有称重时,后端会就近取 ±N 天内最近的一条;
  // 这种非同日匹配必须打星标并在 tooltip 里写明实际称重日期,否则会被误读成当天数据。
  const weightOffset =
    weight !== null && run.weight_date
      ? daysBetween(activityDate, run.weight_date)
      : 0;
  const weightMark = weightOffset !== 0 ? '*' : '';
  const buildWeightTitle = (label: string, value: string): string => {
    const base = `${label} ${value}`;
    if (weightOffset === 0 || !run.weight_date) {
      return base;
    }
    return IS_CHINESE
      ? `${base}（称重于 ${run.weight_date}，与本次活动相差 ${Math.abs(weightOffset)} 天）`
      : `${base} (measured on ${run.weight_date}, ${Math.abs(weightOffset)} day(s) apart)`;
  };

  const handleClick = () => {
    if (runIndex === elementIndex) {
      setRunIndex(-1);
      locateActivity([]);
      return;
    }
    setRunIndex(elementIndex);
    locateActivity([run.run_id]);
  };

  return (
    <tr
      className={`${styles.runRow} ${runIndex === elementIndex ? styles.selected : ''}`}
      key={run.start_date_local}
      onClick={handleClick}
      style={{ color: colorFromType(type) }}
    >
      <td>
        {elementIndex + 1}. {titleForRun(run)}
      </td>
      <td>{type}</td>
      <td>{distance}</td>
      {SHOW_ELEVATION_GAIN && <td>{elevation_gain ?? 0.0}</td>}
      <td>{paceParts}</td>
      <td>{heartRate && heartRate.toFixed(0)}</td>
      <td>{runTime}</td>
      <td className={styles.runDate}>{run.start_date_local}</td>
      {HAS_WEIGHT_DATA && (
        <td
          title={
            weight === null
              ? undefined
              : buildWeightTitle(
                  RUNTABLE_TITLE.WEIGHT_TITLE,
                  `${weight.toFixed(2)} kg`
                )
          }
        >
          {weight === null ? '' : `${weight.toFixed(1)}${weightMark}`}
        </td>
      )}
      {HAS_WEIGHT_DATA && (
        <td
          title={
            fat === null
              ? undefined
              : buildWeightTitle(
                  RUNTABLE_TITLE.BODY_FAT_TITLE,
                  `${fat.toFixed(1)} %`
                )
          }
        >
          {fat === null ? '' : `${fat.toFixed(1)}${weightMark}`}
        </td>
      )}
    </tr>
  );
};

export default RunRow;
