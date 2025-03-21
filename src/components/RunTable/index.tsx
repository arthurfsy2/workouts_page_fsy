import React, { useState } from 'react';
import {
  sortDateFunc,
  sortDateFuncReverse,
  convertMovingTime2Sec,
  Activity,
  RunIds,
  formatPace,
} from '@/utils/utils';
import RunRow from './RunRow';
import styles from './style.module.css';

interface IRunTableProperties {
  runs: Activity[];
  locateActivity: (_runIds: RunIds) => void;
  setActivity: (_runs: Activity[]) => void;
  runIndex: number;
  setRunIndex: (_index: number) => void;
}

type SortFunc = (_a: Activity, _b: Activity) => number;

const RunTable = ({
  runs,
  locateActivity,
  setActivity,
  runIndex,
  setRunIndex,
}: IRunTableProperties) => {
  let run_speed = 0;
  let max_run = '';
  let ride_speed = 0;
  let max_ride = '';
  runs.forEach((item) => {
    if (item.type == 'Run') {
      if (item.average_speed > run_speed) {
        run_speed = item.average_speed;
        max_run = item;
      }
    }
    if (item.type == 'Ride') {
      if (item.average_speed > ride_speed) {
        ride_speed = item.average_speed;
        max_ride = item;
      }
    }
  });
  const rdistance = (max_run.distance / 1000.0).toFixed(2);
  const rpaceParts = max_run.average_speed
    ? formatPace(max_run.average_speed)
    : null;

  const rrdistance = (max_ride.distance / 1000.0).toFixed(2);
  const kmh =
    (
      (max_ride.distance * 3600.0) /
      convertMovingTime2Sec(max_ride.moving_time) /
      1000.0
    ).toFixed(2) + 'km/h';

  const [sortFuncInfo, setSortFuncInfo] = useState('');
  // TODO refactor?
  const sortTypeFunc: SortFunc = (a, b) =>
    sortFuncInfo === 'Type'
      ? a.type > b.type
        ? 1
        : -1
      : b.type < a.type
        ? -1
        : 1;
  const sortKMFunc: SortFunc = (a, b) =>
    sortFuncInfo === 'KM' ? a.distance - b.distance : b.distance - a.distance;
  const sortElevationGainFunc: SortFunc = (a, b) =>
    sortFuncInfo === 'Elevation Gain'
      ? (a.elevation_gain ?? 0) - (b.elevation_gain ?? 0)
      : (b.elevation_gain ?? 0) - (a.elevation_gain ?? 0);
  const sortPaceFunc: SortFunc = (a, b) =>
    sortFuncInfo === 'Pace'
      ? a.average_speed - b.average_speed
      : b.average_speed - a.average_speed;
  const sortBPMFunc: SortFunc = (a, b) => {
    return sortFuncInfo === 'BPM'
      ? (a.average_heartrate ?? 0) - (b.average_heartrate ?? 0)
      : (b.average_heartrate ?? 0) - (a.average_heartrate ?? 0);
  };
  const sortRunTimeFunc: SortFunc = (a, b) => {
    const aTotalSeconds = convertMovingTime2Sec(a.moving_time);
    const bTotalSeconds = convertMovingTime2Sec(b.moving_time);
    return sortFuncInfo === 'Time'
      ? aTotalSeconds - bTotalSeconds
      : bTotalSeconds - aTotalSeconds;
  };
  const sortDateFuncClick =
    sortFuncInfo === 'Date' ? sortDateFunc : sortDateFuncReverse;
  const sortFuncMap = new Map([
    ['类型', sortTypeFunc],
    ['距离', sortKMFunc],
    ['总爬升', sortElevationGainFunc],
    ['配速', sortPaceFunc],
    ['BPM', sortBPMFunc],
    ['时长', sortRunTimeFunc],
    ['日期', sortDateFuncClick],
  ]);

  const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
    const funcName = (e.target as HTMLElement).innerHTML;
    const f = sortFuncMap.get(funcName);

    // 如果当前点击的字段是同一个，再次点击就切换排序方向
    const newSortFuncInfo =
      sortFuncInfo === funcName ? `${funcName}_reverse` : funcName;

    setRunIndex(-1);
    setSortFuncInfo(newSortFuncInfo);

    // 这里需要根据 newSortFuncInfo 确定排序方向
    const sortedRuns = runs.sort((a, b) => {
      if (newSortFuncInfo.endsWith('_reverse')) {
        return f(b, a); // 反转排序
      }
      return f(a, b); // 正常排序
    });

    setActivity(sortedRuns);
  };

  return (
    <div className={`${styles.tableContainer} rounded-lg bg-gray-100 p-4`}>
      {/* <h2 className="text-lg font-bold mb-2">本年最佳记录：</h2> */}
      <div className="mb-2">
        {max_ride ? (
          <p className="text-md font-semibold text-[#00AFAA]">
            <span className="text-lg font-bold">最佳骑行：</span>
            {max_ride.start_date_local} | {kmh} | {rrdistance}km
          </p>
        ) : (
          <p className="text-md text-gray-500">今年没骑车！</p>
        )}
        {max_run ? (
          <p className="text-md font-semibold text-[#ED55DB]">
            <span className="text-lg font-bold">最佳跑步：</span>
            {max_run.start_date_local} | {rpaceParts} | {rdistance}km
          </p>
        ) : (
          <p className="text-md text-gray-500">今年没跑步！</p>
        )}
      </div>
      <table className={styles.runTable} cellSpacing="0" cellPadding="0">
        <thead>
          <tr>
            <th />
            {Array.from(sortFuncMap.keys()).map((k) => (
              <th key={k} onClick={handleClick}>
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {runs.map((run, elementIndex) => (
            <RunRow
              key={run.run_id}
              elementIndex={elementIndex}
              locateActivity={locateActivity}
              run={run}
              runIndex={runIndex}
              setRunIndex={setRunIndex}
              maxRecord={
                max_run.run_id == run.run_id || max_ride.run_id == run.run_id
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RunTable;
