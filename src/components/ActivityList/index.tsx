import React, { lazy, useState, Suspense } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import activities from '@/static/activities.json';
import evaluateMileageChance from './evaluateMileageChance'; // 确保路径正确
import styles from './style.module.css';
import {
  ACTIVITY_TOTAL,
  TYPES_MAPPING,
  SHOW_ELEVATION_GAIN,
  MAX_SINGLE_DAY,
} from '@/utils/const';
import { formatPace } from '@/utils/utils';
import { totalStat } from '@assets/index';
import { loadSvgComponent } from '@/utils/svgUtils';
// Define interfaces for our data structures
interface Activity {
  start_date_local: string;
  distance: number;
  moving_time: string;
  type: string;
  location_country?: string;
  elevation_gain?: number;
  average_heartrate?: number;
}

interface ActivitySummary {
  totalDistance: number;
  totalTime: number;
  totalElevationGain: number;
  count: number;
  dailyDistances: number[];
  maxDistance: number;
  maxSpeed: number;
  location: string;
  totalHeartRate: number; // Add heart rate statistics
  heartRateCount: number;
}

interface DisplaySummary {
  totalDistance: number;
  averageSpeed: number;
  totalTime: number;
  count: number;
  maxDistance: number;
  maxSpeed: number;
  location: string;
  totalElevationGain?: number;
  averageHeartRate?: number; // Add heart rate display
}

interface ChartData {
  day: number;
  distance: string;
}

interface ActivityCardProps {
  period: string;
  summary: DisplaySummary;
  dailyDistances: number[];
  interval: string;
  activityType: string;
}

interface ActivityGroups {
  [key: string]: ActivitySummary;
}

type IntervalType = 'year' | 'month' | 'week' | 'day';

const ActivityCard: React.FC<ActivityCardProps> = ({
  period,
  summary,
  dailyDistances,
  interval,
  activityType,
}) => {
  const generateLabels = (): number[] => {
    if (interval === 'month') {
      const [year, month] = period.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate(); // Get the number of days in the month
      return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    } else if (interval === 'week') {
      return Array.from({ length: 7 }, (_, i) => i + 1);
    } else if (interval === 'year') {
      return Array.from({ length: 12 }, (_, i) => i + 1); // Generate months 1 to 12
    }
    return [];
  };

  const data: ChartData[] = generateLabels().map((day) => ({
    day,
    distance: (dailyDistances[day - 1] || 0).toFixed(2), // Keep two decimal places
  }));

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  const formatPace = (speed: number): string => {
    if (speed === 0) return '0:00 min/km';
    const pace = 60 / speed; // min/km
    const totalSeconds = Math.round(pace * 60); // Total seconds per km
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} min/km`;
  };

  const isFastType = (activityType: string): boolean => {
    switch (activityType) {
      case 'virtualride':
      case 'ride':
      case 'roadtrip':
        return true;
      default:
        return false;
    }
  };

  function getDayOfYear(period: string) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 获取当前月份，0-based
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const daysSinceStart = Math.floor(
      (currentDate - startOfYear) / (1000 * 60 * 60 * 24)
    );
    const currentWeek = Math.ceil(
      (daysSinceStart + startOfYear.getDay() + 1) / 7
    );
    const currentWeekDay = ((currentDate.getDay() + 6) % 7) + 1;
    const currentDay = currentDate.getDate();

    // 处理"YYYY"、"YYYY-MM"或"YYYY-WXX"格式的输入
    const year = parseInt(period.split('-')[0], 10); // 提取年份部分
    const isLeapYear = (year: number) =>
      (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

    if (year > currentYear) {
      console.error('Invalid period:', year); // 调试日志
      throw new Error('Period should not be greater than the current year.');
    }

    if (period.includes('-')) {
      if (period.includes('W')) {
        // 处理"YYYY-WXX"格式
        const weekNumber = parseInt(period.split('-W')[1], 10);

        if (year === currentYear && weekNumber === currentWeek) {
          return currentWeekDay;
        } else {
          return 7; // 返回该月的天数
        }
      } else {
        // 处理"YYYY-MM"格式
        const month = parseInt(period.split('-')[1], 10);

        if (year === currentYear && month === currentMonth) {
          return currentDay; // 返回当前日期在当年当月中的第几天
        } else {
          const daysInMonth = new Date(year, month, 0).getDate(); // 获取该月的天数
          return daysInMonth; // 返回该月的天数
        }
      }
    } else {
      // 处理"YYYY"格式
      if (year === currentYear) {
        const startOfYear = new Date(currentYear, 0, 1);
        const diff = currentDate - startOfYear;
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; // 返回当前日期是今年的第几天
      } else {
        return isLeapYear(year) ? 366 : 365; // 返回该年份的天数
      }
    }
  }

  // Calculate Y-axis maximum value and ticks
  const yAxisMax = Math.ceil(
    Math.max(...data.map((d) => parseFloat(d.distance))) + 10
  ); // Round up and add buffer
  const yAxisTicks = Array.from(
    { length: Math.ceil(yAxisMax / 5) + 1 },
    (_, i) => i * 5
  ); // Generate arithmetic sequence

  return (
    <div className={styles.activityCard}>
      <h2 className={styles.activityName}>{period}</h2>
      <div className={styles.activityDetails}>
        <p>
          <strong>{ACTIVITY_TOTAL.TOTAL_DISTANCE_TITLE}:</strong>{' '}
          {summary.totalDistance.toFixed(2)} km
        </p>
        {SHOW_ELEVATION_GAIN && summary.totalElevationGain !== undefined && (
          <p>
            <strong>{ACTIVITY_TOTAL.TOTAL_ELEVATION_GAIN_TITLE}:</strong>{' '}
            {summary.totalElevationGain.toFixed(0)} m
          </p>
        )}
        <p>
          <strong>{ACTIVITY_TOTAL.AVERAGE_SPEED_TITLE}:</strong>{' '}
          {activityType === 'ride'
            ? `${summary.averageSpeed.toFixed(2)} km/h`
            : formatPace(summary.averageSpeed)}
        </p>
        <p>
          <strong>{ACTIVITY_TOTAL.TOTAL_TIME_TITLE}:</strong>{' '}
          {formatTime(summary.totalTime)}
        </p>
        {summary.averageHeartRate !== undefined && (
          <p>
            <strong>{ACTIVITY_TOTAL.AVERAGE_HEART_RATE_TITLE}:</strong>{' '}
            {summary.averageHeartRate.toFixed(0)} bpm
          </p>
        )}
        {interval !== 'day' && (
          <>
            <p>
              <strong>{ACTIVITY_TOTAL.ACTIVITY_COUNT_TITLE}:</strong>{' '}
              {summary.count}
            </p>
            <p>
              <strong>{ACTIVITY_TOTAL.MAX_DISTANCE_TITLE}:</strong>{' '}
              {summary.maxDistance.toFixed(2)} km
            </p>
            <p>
              <strong>{ACTIVITY_TOTAL.MAX_SPEED_TITLE}:</strong>{' '}
              {isFastType(activityType)
                ? `${summary.maxSpeed.toFixed(2)} km/h`
                : formatPace(summary.maxSpeed)}
            </p>
            <p>
              <strong>{ACTIVITY_TOTAL.DAILY_AVERAGE}:</strong>{' '}
              {(summary.totalDistance / getDayOfYear(period)).toFixed(2)} km
            </p>
          </>
        )}
        {interval === 'day' && (
          <p>
            <strong>{ACTIVITY_TOTAL.LOCATION_TITLE}:</strong>{' '}
            {summary.location || ''}
          </p>
        )}
        {['month', 'week', 'year'].includes(interval) && (
          <div
            className={styles.chart}
            style={{ height: '250px', width: '100%' }}
          >
            <ResponsiveContainer>
              <BarChart
                data={data}
                margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: 'rgb(204, 204, 204)' }} />
                <YAxis
                  label={{
                    value: 'km',
                    angle: -90,
                    position: 'insideLeft',
                    fill: 'rgb(204, 204, 204)',
                  }}
                  domain={[0, yAxisMax]}
                  ticks={yAxisTicks}
                  tick={{ fill: 'rgb(204, 204, 204)' }}
                />
                <Tooltip
                  formatter={(value) => `${value} km`}
                  contentStyle={{
                    backgroundColor: 'rgb(36, 36, 36)',
                    border: '1px solid #444',
                    color: 'rgb(204, 204, 204)',
                  }}
                  labelStyle={{ color: '#00AFAA' }}
                />
                <Bar dataKey="distance" fill="#00AFAA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

const ActivityList: React.FC = () => {
  const [interval, setInterval] = useState<IntervalType>('month');
  const [activityType, setActivityType] = useState<string>('ride');
  const navigate = useNavigate();
  const playTypes = new Set(
    (activities as Activity[]).map((activity) => activity.type.toLowerCase())
  );
  const showTypes = [...playTypes].filter((type) => type in TYPES_MAPPING);

  const toggleInterval = (newInterval: IntervalType): void => {
    setInterval(newInterval);
  };

  const filterActivities = (activity: Activity): boolean => {
    return activity.type.toLowerCase() === activityType;
  };

  const convertTimeToSeconds = (time: string): number => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const groupActivities = (interval: IntervalType): ActivityGroups => {
    return (activities as Activity[])
      .filter(filterActivities)
      .reduce((acc: ActivityGroups, activity) => {
        const date = new Date(activity.start_date_local);
        let key: string;
        let index: number;
        switch (interval) {
          case 'year':
            key = date.getFullYear().toString();
            index = date.getMonth(); // Return current month (0-11)
            break;
          case 'month':
            key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // Zero padding
            index = date.getDate() - 1; // Return current day (0-30)
            break;
          case 'week':
            const currentDate = new Date(date.valueOf());
            currentDate.setDate(
              currentDate.getDate() + 4 - (currentDate.getDay() || 7)
            ); // Set to nearest Thursday (ISO weeks defined by Thursday)
            const yearStart = new Date(currentDate.getFullYear(), 0, 1);
            const weekNum = Math.ceil(
              ((currentDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
            );
            key = `${currentDate.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
            index = (date.getDay() + 6) % 7; // Return current day (0-6, Monday-Sunday)
            break;
          case 'day':
            key = date.toLocaleDateString('zh').replaceAll('/', '-'); // Format date as YYYY-MM-DD
            index = 0; // Return 0
            break;
          default:
            key = date.getFullYear().toString();
            index = 0; // Default return 0
        }

        if (!acc[key])
          acc[key] = {
            totalDistance: 0,
            totalTime: 0,
            totalElevationGain: 0,
            count: 0,
            dailyDistances: [],
            maxDistance: 0,
            maxSpeed: 0,
            location: '',
            totalHeartRate: 0,
            heartRateCount: 0,
          };

        const distanceKm = activity.distance / 1000; // Convert to kilometers
        const timeInSeconds = convertTimeToSeconds(activity.moving_time);
        const speedKmh =
          timeInSeconds > 0 ? distanceKm / (timeInSeconds / 3600) : 0;

        acc[key].totalDistance += distanceKm;
        acc[key].totalTime += timeInSeconds;
        acc[key].count += 1;
        if (SHOW_ELEVATION_GAIN && activity.elevation_gain) {
          acc[key].totalElevationGain += activity.elevation_gain;
        }
        // Heart rate statistics
        if (activity.average_heartrate) {
          acc[key].totalHeartRate += activity.average_heartrate;
          acc[key].heartRateCount += 1;
        }

        // Accumulate daily distances
        acc[key].dailyDistances[index] =
          (acc[key].dailyDistances[index] || 0) + distanceKm;

        if (distanceKm > acc[key].maxDistance)
          acc[key].maxDistance = distanceKm;
        if (speedKmh > acc[key].maxSpeed) acc[key].maxSpeed = speedKmh;

        if (interval === 'day')
          acc[key].location = activity.location_country || '';

        return acc;
      }, {});
  };

  const activitiesByInterval = groupActivities(interval);

  // const reservedDistance = 0; // 根据需要确定保留距离
  // const maxSingleDay = 100; // 假设最大单日骑行距离

  const { content } = evaluateMileageChance(
    activities as Activity[],
    undefined,
    MAX_SINGLE_DAY[activityType],
    activityType
  );
  return (
    <div className={styles.activityList}>
      <div className={styles.filterContainer}>
        <button
          className="cursor-pointer rounded-2xl border border-transparent bg-[#006CB8] px-5 py-2.5 text-lg text-white"
          onClick={() => navigate('/')}
        >
          {ACTIVITY_TOTAL.HOME_BUTTON}
        </button>
        <select
          onChange={(e) => setActivityType(e.target.value)}
          value={activityType}
        >
          {showTypes.map((type) => (
            <option value={type}>{TYPES_MAPPING[type]}</option>
          ))}
        </select>
        <select
          onChange={(e) => toggleInterval(e.target.value as IntervalType)}
          value={interval}
        >
          <option value="year">{ACTIVITY_TOTAL.YEARLY_TITLE}</option>
          <option value="month">{ACTIVITY_TOTAL.MONTHLY_TITLE}</option>
          <option value="week">{ACTIVITY_TOTAL.WEEKLY_TITLE}</option>
          <option value="day">{ACTIVITY_TOTAL.DAILY_TITLE}</option>
        </select>
      </div>
      {content}

      <div className={styles.summaryContainer}>
        {Object.entries(activitiesByInterval)
          .sort(([a], [b]) => {
            if (interval === 'day') {
              return new Date(b).getTime() - new Date(a).getTime(); // Sort by date
            } else if (interval === 'week') {
              const [yearA, weekA] = a.split('-W').map(Number);
              const [yearB, weekB] = b.split('-W').map(Number);
              return yearB - yearA || weekB - weekA; // Sort by year and week number
            } else {
              const [yearA, monthA = 0] = a.split('-').map(Number);
              const [yearB, monthB = 0] = b.split('-').map(Number);
              return yearB - yearA || monthB - monthA; // Sort by year and month
            }
          })
          .map(([period, summary]) => (
            <ActivityCard
              key={period}
              period={period}
              summary={{
                totalDistance: summary.totalDistance,
                averageSpeed: summary.totalTime
                  ? summary.totalDistance / (summary.totalTime / 3600)
                  : 0,
                totalTime: summary.totalTime,
                count: summary.count,
                maxDistance: summary.maxDistance,
                maxSpeed: summary.maxSpeed,
                location: summary.location,
                totalElevationGain: SHOW_ELEVATION_GAIN
                  ? summary.totalElevationGain
                  : undefined,
                averageHeartRate:
                  summary.heartRateCount > 0
                    ? summary.totalHeartRate / summary.heartRateCount
                    : undefined,
              }}
              dailyDistances={summary.dailyDistances}
              interval={interval}
              activityType={activityType}
            />
          ))}
      </div>
    </div>
  );
};

export default ActivityList;
