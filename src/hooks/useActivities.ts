import { locationForRun, typeForRun } from '@/utils/utils';
import activities from '@/static/activities.json';

const useActivities = () => {
  const cities: Record<string, number> = {};
  const runPeriod: Record<string, number> = {};
  const provinces: Set<string> = new Set();
  const countries: Set<string> = new Set();
  let years: Set<string> = new Set();
  let thisYear = '';

  // 更新seenCities的结构
  const seenCities: Record<string, string[]> = {}; // 用于存储各年份对应的城市

  activities.forEach((run) => {
    const location = locationForRun(run);

    const periodName = typeForRun(run);
    if (periodName) {
      runPeriod[periodName] = runPeriod[periodName]
        ? runPeriod[periodName] + 1
        : 1;
    }

    const { city, province, country } = location;

    // drop only one char city
    if (city.length > 1) {
      cities[city] = cities[city] ? cities[city] + run.distance : run.distance;
    }

    if (province) provinces.add(province);
    if (country) countries.add(country);
    const year = run.start_date_local.slice(0, 4);

    // 更新seenCities，记录每年对应的城市
    if (city && city.length > 1) {
      // 只在当前年份未出现过的情况下添加城市
      if (!seenCities[year]) {
        seenCities[year] = [];
      }

      // 检查城市是否已存在于其他年份的seenCities中
      let isCityExistingInOtherYear = Object.keys(seenCities).some((y) =>
        seenCities[y].includes(city)
      );

      if (!seenCities[year].includes(city) && !isCityExistingInOtherYear) {
        seenCities[year].push(city);
      }
    }

    years.add(year);
  });

  let yearsArray = [...years].sort().reverse();
  if (years) [thisYear] = yearsArray; // set current year as first one of years array
  return {
    activities,
    years: yearsArray,
    countries: [...countries],
    provinces: [...provinces],
    cities,
    seenCities, // 各年份的过滤后的城市汇总
    runPeriod,
    thisYear,
  };
};

export default useActivities;
