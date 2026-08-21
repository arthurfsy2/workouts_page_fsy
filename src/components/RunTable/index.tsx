import React, { useState } from 'react';
import {
  sortDateFunc,
  sortDateFuncReverse,
  convertMovingTime2Sec,
  Activity,
  RunIds,
  formatPace,
} from '@/utils/utils';
import {
  RUN_COLOR,
  RIDE_COLOR,
  IS_CHINESE,
  RUNTABLE_TITLE,
  SHOW_ELEVATION_GAIN,
} from '@/utils/const';
import RunRow from './RunRow';
import styles from './style.module.css';
import { Calendar, Bike, Footprints, Ruler, Heart, Clock, MapPin } from 'lucide-react';

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
    ).toFixed(1) + 'km/h';

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
    [RUNTABLE_TITLE.TYPE_TITLE, sortTypeFunc],
    ['KM', sortKMFunc],
    [RUNTABLE_TITLE.ELEVATION_GAIN_TITLE, sortElevationGainFunc],
    [RUNTABLE_TITLE.PACE_TITLE, sortPaceFunc],
    ['BPM', sortBPMFunc],
    [RUNTABLE_TITLE.DURATION_TITLE, sortRunTimeFunc],
    [RUNTABLE_TITLE.DATE_TITLE, sortDateFuncClick],
  ]);

  if (!SHOW_ELEVATION_GAIN) {
    sortFuncMap.delete('Elevation Gain');
  }

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
    <div>
      {(max_run || max_ride) && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {max_ride && (
            <div className="rounded-xl bg-card-warm p-4 shadow-warm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Bike className="h-4 w-4" />
                {IS_CHINESE ? '最佳配速（骑行）' : 'Best Pace (Cycling)'}
              </div>
              <div className="space-y-2 text-sm" style={{ color: RIDE_COLOR }}>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 opacity-60" />
                  <span>{max_ride.start_date_local}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-3.5 w-3.5 opacity-60" />
                  <span>{kmh}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 opacity-60" />
                  <span>{rrdistance} km</span>
                </div>
              </div>
            </div>
          )}
          {max_run && (
            <div className="rounded-xl bg-card-warm p-4 shadow-warm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Footprints className="h-4 w-4" />
                {IS_CHINESE ? '最佳配速（跑步）' : 'Best Pace (Running)'}
              </div>
              <div className="space-y-2 text-sm" style={{ color: RUN_COLOR }}>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 opacity-60" />
                  <span>{max_run.start_date_local}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-3.5 w-3.5 opacity-60" />
                  <span>{rpaceParts}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 opacity-60" />
                  <span>{rdistance} km</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <div
        className={`${styles.tableContainer} max-h-[500px] overflow-y-auto`}
      >
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
    </div>
  );
};

export default RunTable;
