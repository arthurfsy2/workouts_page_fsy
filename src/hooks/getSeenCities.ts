import { locationForRun, typeForRun } from '@/utils/utils';
import activities from '@/static/activities.json';

const getSeenCities = () => {
  const seenCities: Record<string, string[]> = {}; // 用于存储各年份对应的城市
  const years: Set<string> = new Set();

  activities.forEach((run) => {
    const location = locationForRun(run);
    const { city } = location;
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

  // 计算所有年份城市的并集并添加到seenCities中
  const totalCities = new Set<string>(); // 明确指定为 string 类型
  Object.values(seenCities).forEach((cities) => {
    cities.forEach((city) => totalCities.add(city));
  });
  
  // 将 totalCities 的值赋给 seenCities['Total']，并明确其类型
  seenCities['Total'] = [...totalCities] as string[]; // 确保类型为 string[]

  return {seenCities};
};

export default getSeenCities;