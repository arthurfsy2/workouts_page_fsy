import { lazy, Suspense } from 'react';
import Stat from '@/components/Stat';
import WorkoutStat from '@/components/WorkoutStat';
import useActivities from '@/hooks/useActivities';
import getSeenCities from '@/hooks/getSeenCities';
import { formatPace, colorFromType } from '@/utils/utils';
import useHover from '@/hooks/useHover';
import { yearStats } from '@assets/index';
import { loadSvgComponent } from '@/utils/svgUtils';
import { SHOW_ELEVATION_GAIN } from '@/utils/const';
import { titleForType } from '@/utils/utils';
import { RUNTABLE_TITLE, BUTTON_TITLES } from '@/utils/const';
import activities from '@/static/activities.json';
const { seenCities } = getSeenCities();
import { intComma } from '@/utils/utils';
const YearStat = ({
  year,
  onClick,
  onClickTypeInYear,
}: {
  year: string;
  onClick: (_year: string) => void;
  onClickTypeInYear: (_year: string, _type: string) => void;
}) => {
  let { activities: runs, years } = useActivities();
  // for hover
  const [hovered, eventHandlers] = useHover();
  // lazy Component
  const YearSVG = lazy(() => loadSvgComponent(yearStats, `./year_${year}.svg`));

  const yearData = seenCities[year] || []; // 获取对应年份的数据
  const reduceLength = 5; // 控制打卡城市展示个数

  let citiesList;

  // 检查城市数量，如果不超过reduceLength个就直接添加
  if (yearData.length <= reduceLength) {
    citiesList = yearData
      .map((city) => city.replace(/(市|自治州|特别行政区)/g, ''))
      .join('/');
  } else {
    citiesList = yearData
      .map((city) => city.replace(/(市|自治州|特别行政区)/g, ''))
      .reduce((acc, city, index) => {
        if (index < reduceLength) {
          return acc ? `${acc}/${city}` : city;
        } else if (index === reduceLength) {
          return `${acc}...`;
        }
        return acc;
      }, '');
  }

  const findEarliestAndLatest = (activities, year) => {
    const yearStr = String(year);
    let earliestTime = null;
    let latestTime = null;
    let earliestActivity = null;
    let latestActivity = null;

    activities.forEach((activity) => {
      const startDate = new Date(activity.start_date_local);

      // 判断年份，只有在 Total 时才比较所有活动
      const isYearMatched =
        yearStr === 'Total' || startDate.getFullYear().toString() === yearStr;

      if (isYearMatched) {
        // 获取时分秒字符串内容
        const timeString = activity.start_date_local.split(' ')[1];
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        const timeInSeconds = hours * 3600 + minutes * 60 + seconds;

        // 初始化 earliestTime 和 latestTime
        if (earliestTime === null || timeInSeconds < earliestTime) {
          earliestTime = timeInSeconds;
          earliestActivity = activity.start_date_local;
        }

        if (latestTime === null || timeInSeconds > latestTime) {
          latestTime = timeInSeconds;
          latestActivity = activity.start_date_local;
        }
      }
    });

    return {
      earliest: earliestActivity,
      latest: latestActivity,
    };
  };

  // 调用示例
  const result = findEarliestAndLatest(activities, year);
  const earliestActivity = result.earliest;
  const latestActivity = result.latest;

  if (years.includes(year)) {
    runs = runs.filter((run) => run.start_date_local.slice(0, 4) === year);
  }
  let sumDistance = 0;
  let streak = 0;
  let sumElevationGain = 0;
  let heartRate = 0;
  let heartRateNullCount = 0;
  const workoutsCounts = {};

  runs.forEach((run) => {
    sumDistance += run.distance || 0;
    sumElevationGain += run.elevation_gain || 0;
    if (run.average_speed) {
      if (workoutsCounts[run.type]) {
        var [oriCount, oriSecondsAvail, oriMetersAvail] =
          workoutsCounts[run.type];
        workoutsCounts[run.type] = [
          oriCount + 1,
          oriSecondsAvail + (run.distance || 0) / run.average_speed,
          oriMetersAvail + (run.distance || 0),
        ];
      } else {
        workoutsCounts[run.type] = [
          1,
          (run.distance || 0) / run.average_speed,
          run.distance,
        ];
      }
    }
    if (run.average_heartrate) {
      heartRate += run.average_heartrate;
    } else {
      heartRateNullCount++;
    }
    if (run.streak) {
      streak = Math.max(streak, run.streak);
    }
  });
  const hasHeartRate = !(heartRate === 0);
  const avgHeartRate = (heartRate / (runs.length - heartRateNullCount)).toFixed(
    0
  );

  const workoutsArr = Object.entries(workoutsCounts);
  workoutsArr.sort((a, b) => {
    return b[1][0] - a[1][0];
  });

  return (
    <div
      className={`my-0 mb-8 mr-2 rounded-xl bg-[#F5F5F5] px-2 py-4 text-[#579EFB]  lg:mr-8`}
      onClick={() => onClick(year)}
      {...eventHandlers}
    >
      <section>
        <Stat
          value={year === 'Total' ? BUTTON_TITLES.SWITCH_TOTAL_BUTTON : year}
          description={
            year === 'Total' ? '✅' : `${RUNTABLE_TITLE.JOURNEY_TITLE}`
          }
          className="flex w-full items-center pb-1"
        />
        {sumDistance > 0 && (
          <WorkoutStat
            key="total"
            value={runs.length}
            description={BUTTON_TITLES.SWITCH_TOTAL_BUTTON}
            distance={(sumDistance / 1000.0).toFixed(0)}
          />
        )}
        {workoutsArr.map(([type, count]) => (
          <WorkoutStat
            key={type}
            value={count[0]}
            description={` ${titleForType(type)}`}
            // pace={formatPace(count[2] / count[1])}
            distance={(count[2] / 1000.0).toFixed(0)}
            // color={colorFromType(type)}
            onClick={(e: Event) => {
              onClickTypeInYear(year, type);
              e.stopPropagation();
            }}
          />
        ))}
        {SHOW_ELEVATION_GAIN && sumElevationGain > 0 && (
          <Stat
            value={`${intComma(sumElevationGain.toFixed(0))} `}
            description={`M ${RUNTABLE_TITLE.ELEVATION_GAIN_TITLE} `}
            className="flex w-full items-center justify-between pb-1"
          />
        )}
        <Stat
          value={`${streak}`}
          description={`${RUNTABLE_TITLE.STREAK_TITLE}`}
          className="flex w-full items-center justify-between pb-1"
        />
        {hasHeartRate && (
          <Stat
            value={avgHeartRate}
            description={`${RUNTABLE_TITLE.AVG_BPM_TITLE}`}
          />
        )}
        {year !== 'Total' && yearData.length > 0 && (
          <Stat
            value={`${citiesList}`}
            citySize={2}
            // 根据 yearData.length 设置不同的描述
            description={`${yearData.length} ${RUNTABLE_TITLE.NEW_CHECK_IN_LOCATION}`}
            className="flex w-full items-center justify-between pb-1"
          />
        )}

        <Stat
          value={`${earliestActivity}`}
          citySize={1}
          description={`${RUNTABLE_TITLE.EARLIEST_START_TIME_TITLE}`}
          className="flex w-full items-center justify-between pb-1"
        />
        <Stat
          value={`${latestActivity}`}
          citySize={1}
          description={`${RUNTABLE_TITLE.LATEST_START_TIME_TITLE}`}
          className="flex w-full items-center justify-between pb-1"
        />
      </section>
      {year !== 'Total' && hovered && (
        <Suspense fallback="loading...">
          <YearSVG className="my-4 h-full w-full border-0 p-0" />
        </Suspense>
      )}
      {/* <hr color="red" /> */}
    </div>
  );
};

export default YearStat;
