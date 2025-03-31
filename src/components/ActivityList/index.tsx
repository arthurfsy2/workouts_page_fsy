import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import activities from '@/static/activities.json';
import styles from './style.module.css';

const ActivityCard = ({
  period,
  summary,
  dailyDistances,
  interval,
  activityType,
}) => {
  const generateLabels = () => {
    if (interval === 'month') {
      const [year, month] = period.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate(); // 获取该月的天数
      return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    } else if (interval === 'week') {
      return Array.from({ length: 7 }, (_, i) => i + 1);
    } else if (interval === 'year') {
      return Array.from({ length: 12 }, (_, i) => i + 1); // 生成1到12的月份
    }
    return [];
  };

  const data = generateLabels().map((day) => ({
    day,
    距离: (dailyDistances[day - 1] || 0).toFixed(1), // 保留两位小数
  }));

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s.toFixed(0)}s`;
  };

  const formatPace = (speed) => {
    if (speed === 0) return '0:00';
    const pace = 60 / speed; // min/km
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} min/km`;
  };

  // 计算 Y 轴的最大值和刻度
  const yAxisMax = Math.ceil(
    Math.max(...data.map((d) => parseFloat(d.距离))) + 10
  ); // 取整并增加缓冲
  const yAxisTicks = Array.from(
    { length: Math.ceil(yAxisMax / 5) + 1 },
    (_, i) => i * 5
  ); // 生成等差数列

  return (
    <div className={styles.activityCard}>
      <h2 className={styles.activityName}>{period}</h2>
      <div className={styles.activityDetails}>
        <p>
          <strong>总距离:</strong> {summary.totalDistance.toFixed(1)} km
        </p>
        <p>
          <strong>平均速度:</strong>{' '}
          {activityType === 'ride'
            ? `${summary.averageSpeed.toFixed(1)} km/h`
            : formatPace(summary.averageSpeed)}
        </p>
        <p>
          <strong>总时间:</strong> {formatTime(summary.totalTime)}
        </p>
        {interval !== 'day' && (
          <>
            <p>
              <strong>活动次数:</strong> {summary.count}
            </p>
            <p>
              <strong>最远距离:</strong> {summary.maxDistance.toFixed(1)} km
            </p>
            <p>
              <strong>最快速度:</strong>{' '}
              {activityType === 'ride'
                ? `${summary.maxSpeed.toFixed(1)} km/h`
                : formatPace(summary.maxSpeed)}
            </p>
          </>
        )}
        {interval === 'day' && (
          <p>
            <strong>地址:</strong> {summary.location || '未知'}
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
                margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis
                  label={{ value: 'km', angle: -90, position: 'insideLeft' }}
                  domain={[0, yAxisMax]}
                  ticks={yAxisTicks} // 设置 Y 轴的刻度
                />
                <Tooltip
                  formatter={(value) => `${value} km`} // 在 Tooltip 中添加 "km" 后缀
                />
                <Bar dataKey="距离" fill="#00AFAA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

const ActivityList = () => {
  const [interval, setInterval] = useState('month');
  const [activityType, setActivityType] = useState('ride');

  const toggleInterval = (newInterval) => {
    setInterval(newInterval);
  };

  const filterActivities = (activity) => {
    return activity.type.toLowerCase() === activityType;
  };

  const convertTimeToSeconds = (time) => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const cleanLocation = (location) => {
    return location
      .replace(/\b\d{5,}\b/g, '') // 移除邮编
      .replace(/,?\s*(?:\w+省|中国)/g, '') // 移除省份和中国
      .replace(/,+/g, ',') // 替换多个逗号为一个
      .replace(/^,|,$/g, '') // 移除开头和结尾的逗号
      .trim();
  };

  const groupActivities = (interval) => {
    return activities.filter(filterActivities).reduce((acc, activity) => {
      const date = new Date(activity.start_date);
      let key;
      let index;
      switch (interval) {
        case 'year':
          key = date.getFullYear();
          index = date.getMonth(); // 返回当前月份（0-11）
          break;
        case 'month':
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // 补零
          index = date.getDate() - 1; // 返回当前天数（0-30）
          break;
        case 'week':
          const startOfYear = new Date(date.getFullYear(), 0, 1);
          const weekNumber = Math.ceil(
            ((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7
          );
          key = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`; // 补零
          index = date.getDay(); // 返回本周的第几天（0-6）
          break;
        case 'day':
          key = date.toISOString().split('T')[0];
          index = 0; // 返回0
          break;
        default:
          key = date.getFullYear();
          index = 0; // 默认返回0
      }

      if (!acc[key])
        acc[key] = {
          totalDistance: 0,
          totalTime: 0,
          count: 0,
          dailyDistances: [],
          maxDistance: 0,
          maxSpeed: 0,
          location: '',
        };
      const distanceKm = activity.distance / 1000; // 转换为公里
      const speedKmh =
        distanceKm / (convertTimeToSeconds(activity.moving_time) / 3600);

      acc[key].totalDistance += distanceKm;
      acc[key].totalTime += convertTimeToSeconds(activity.moving_time);
      acc[key].count += 1;

      // 累加每天的距离
      acc[key].dailyDistances[index] =
        (acc[key].dailyDistances[index] || 0) + distanceKm;

      if (distanceKm > acc[key].maxDistance) acc[key].maxDistance = distanceKm;
      if (speedKmh > acc[key].maxSpeed) acc[key].maxSpeed = speedKmh;

      if (interval === 'day')
        acc[key].location = cleanLocation(activity.location_country || '未知');

      return acc;
    }, {});
  };

  const activitiesByInterval = groupActivities(interval);
  const buttonStyle = {
    backgroundColor: '#006CB8', // 背景色
    color: 'white', // 文字颜色
    border: '1px', // 去除边框
    borderRadius: '15px', // 圆角
    padding: '10px 20px', // 内边距
    fontSize: '18px', // 字体大小
    cursor: 'pointer', // 鼠标指针样式
    // marginBottom: '20px', // 底部外边距
  };
  return (
    <div className={styles.activityList}>
      <div className={styles.filterContainer}>
        <button>
          <a href="/" style={buttonStyle}>
            返回首页
          </a>
        </button>
        <select
          onChange={(e) => setActivityType(e.target.value)}
          value={activityType}
        >
          <option value="run">跑步</option>
          <option value="ride">骑行</option>
          <option value="hike">徒步</option>
        </select>
        <select
          onChange={(e) => toggleInterval(e.target.value)}
          value={interval}
        >
          <option value="year">按年</option>
          <option value="month">按月</option>
          <option value="week">按周</option>
          <option value="day">按天</option>
        </select>
      </div>
      <div className={styles.summaryContainer}>
        {Object.entries(activitiesByInterval)
          .sort(([a], [b]) => {
            if (interval === 'day') {
              return new Date(b) - new Date(a); // 按日期排序
            } else if (interval === 'week') {
              const [yearA, weekA] = a.split('-W').map(Number);
              const [yearB, weekB] = b.split('-W').map(Number);
              return yearB - yearA || weekB - weekA; // 按年份和周数排序
            } else {
              const [yearA, monthA] = a.split('-').map(Number);
              const [yearB, monthB] = b.split('-').map(Number);
              return yearB - yearA || monthB - monthA; // 按年份和月份排序
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
