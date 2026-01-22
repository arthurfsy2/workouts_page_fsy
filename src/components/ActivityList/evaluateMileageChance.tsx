import { TYPES_MAPPING, IS_CHINESE } from '@/utils/const';

interface Activity {
  start_date_local: string;
  distance: number;
  type: string;
}

interface EvaluationResult {
  content: JSX.Element; // 更新为JSX.Element以便直接渲染
}

const calculateDaysPassed = (year: number, currentDate: Date): number => {
  const startOfYear = new Date(year, 0, 1);
  const diff = currentDate.getTime() - startOfYear.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const totalDaysInYear = (year: number): number => {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
};

const sumDistances = (distances: number[]): number => {
  return distances.reduce((total, distance) => total + distance, 0);
};

const roundToKm = (value: number): number => {
  return Math.round(value * 100) / 100;
};

const roundToPercentage = (value: number): number => {
  return Math.round(value * 100) / 100;
};

const getChallengeLevel = (percentage: number): string => {
  if (percentage > 0 && percentage <= 20)
    return IS_CHINESE ? '有点困难！' : 'A bit difficult!';
  if (percentage > 20 && percentage <= 50)
    return IS_CHINESE ? '巨大挑战！' : 'Huge challenge!';
  return IS_CHINESE ? '要拼命了！' : 'You need to give it your all!';
};

const readYearsList = (
  activities: Activity[],
  activityType: string
):
  | { latestYearInRecord: number; secondLatestYearInRecord?: number }
  | undefined => {
  const yearsSet = new Set<string>();

  activities.forEach((item) => {
    // 添加类型检查，确保 item.type 存在
    if (item.type && item.type.toLowerCase() === activityType.toLowerCase()) {
      const year = item.start_date_local.split('-')[0]; // 获取年份
      yearsSet.add(year); // 添加到集合
    }
  });

  // console.log('activityType:', activityType, 'yearsSet:', yearsSet);
  const yearLists = Array.from(yearsSet).sort(); // 转换为数组并排序

  if (yearLists.length === 1) {
    const latestYearInRecord = parseInt(yearLists[0], 10); // 只有一个年份
    return { latestYearInRecord, secondLatestYearInRecord: latestYearInRecord }; // 返回对象
  }

  if (yearLists.length > 1) {
    const latestYearInRecord = parseInt(yearLists[yearLists.length - 1], 10);
    const secondLatestYearInRecord = parseInt(
      yearLists[yearLists.length - 2],
      10
    );

    return { latestYearInRecord, secondLatestYearInRecord }; // 返回对象
  }

  return undefined; // 处理没有年份的情况
};

const minDaysWithMaxEffort = (
  maxKmPerDay: number,
  currentYearTotalDistance: number,
  currentYearAvg: number,
  lastYearTotalDistance: number,
  remainingDays: number
): [number, number] => {
  // 检查是否完全不可能完成挑战
  const maxPossibleDistance =
    currentYearTotalDistance + maxKmPerDay * remainingDays;

  if (maxPossibleDistance < lastYearTotalDistance) {
    // 即使剩余的每一天都以最大努力骑行，也无法达到去年的总距离
    // 返回剩余天数作为需要的天数，尽管实际上无法实现
    return [remainingDays + 1, maxPossibleDistance]; // 使用remainingDays + 1表示无法实现
  }

  // 计算最少需要多少天骑最大距离才能完成挑战
  // 设x为需要骑最大距离的天数，则:
  // currentYearTotalDistance + maxKmPerDay * x + currentYearAvg * (remainingDays - x) >= lastYearTotalDistance
  // 解这个不等式得到: x >= (lastYearTotalDistance - currentYearTotalDistance - currentYearAvg * remainingDays) / (maxKmPerDay - currentYearAvg)
  const numerator =
    lastYearTotalDistance -
    currentYearTotalDistance -
    currentYearAvg * remainingDays;
  const denominator = maxKmPerDay - currentYearAvg;

  if (denominator <= 0) {
    // 如果每日平均值大于等于最大单日距离，说明无法通过增加单日距离来提高总距离
    return [remainingDays + 1, maxPossibleDistance]; // 也无法实现
  }

  const requiredDays = numerator / denominator;
  const daysNeeded = Math.ceil(requiredDays);

  // 确保结果在合理范围内
  if (daysNeeded <= 0) {
    return [0, currentYearTotalDistance + currentYearAvg * remainingDays];
  } else if (daysNeeded > remainingDays) {
    // 实际上无法在剩余天数内完成，返回一个超出的值表示无法实现
    return [daysNeeded, maxPossibleDistance];
  } else {
    const finalDistance =
      currentYearTotalDistance +
      maxKmPerDay * daysNeeded +
      currentYearAvg * (remainingDays - daysNeeded);
    return [daysNeeded, finalDistance];
  }
};

const evaluateMileageChance = (
  activities: Activity[],
  reservedDistance: number = 0,
  maxSingleDay: number = 100,
  activityType = 'Ride'
): EvaluationResult => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentYearDistances: number[] = [];
  const lastYearDistances: number[] = [];
  let text = ''; // 使用 let 以便后续可以修改
  let remarks = ''; // 使用 let 以便后续可以修改
  const { latestYearInRecord, secondLatestYearInRecord } = readYearsList(
    activities,
    activityType
  );

  if (currentYear > latestYearInRecord) {
    return { content: <div> </div> };
  }

  // 计算每个活动的距离
  activities.forEach((activity) => {
    const startDate = new Date(activity.start_date_local); // 使用 start_date_local
    const distance = activity.distance;
    const year = startDate.getFullYear();

    if (
      year === latestYearInRecord &&
      activity.type.toLowerCase() === activityType.toLowerCase()
    ) {
      currentYearDistances.push(distance);
    } else if (
      year === secondLatestYearInRecord &&
      activity.type.toLowerCase() === activityType.toLowerCase()
    ) {
      lastYearDistances.push(distance);
    }
  });

  // 计算总距离
  const currentYearTotalDistance = roundToKm(
    sumDistances(currentYearDistances) / 1000
  );
  const lastYearTotalDistance = roundToKm(
    sumDistances(lastYearDistances) / 1000
  );

  const daysPassed = calculateDaysPassed(currentYear, currentDate);
  const remainingDays = totalDaysInYear(currentYear) - daysPassed;

  if (currentYearTotalDistance > lastYearTotalDistance) {
    text = `${currentYear}年当前公里数（${currentYearTotalDistance} km）已超越${secondLatestYearInRecord}年（${lastYearTotalDistance} km）!`;
  }

  const currentYearAvg = roundToKm(currentYearTotalDistance / daysPassed);
  const lastYearAvg = roundToKm(
    lastYearTotalDistance / totalDaysInYear(secondLatestYearInRecord)
  );
  const projectedDistance = roundToKm(
    currentYearAvg * totalDaysInYear(currentYear) + reservedDistance
  );
  const shortfall = lastYearTotalDistance - projectedDistance;

  if (projectedDistance >= lastYearTotalDistance) {
    if (currentYearAvg < lastYearAvg) {
      text = IS_CHINESE
        ? `问题不大！虽然${currentYear}年当前日均公里数（${currentYearAvg} km）＜ ${secondLatestYearInRecord}年日均（${lastYearAvg} km），但按日均预计总里程（${projectedDistance} km）＞${secondLatestYearInRecord}年（${lastYearTotalDistance} km），完成挑战概率很大！`
        : `No problem! Although the current average daily distance in ${currentYear} is less than the average in ${secondLatestYearInRecord} (current average: ${currentYearAvg} km < ${lastYearAvg} km), the projected total distance based on the average daily distance (${projectedDistance} km) is greater than that of ${secondLatestYearInRecord} (${lastYearTotalDistance} km), so the chance of completing the challenge is quite high!`;
    } else if (currentYearAvg > lastYearAvg) {
      text = IS_CHINESE
        ? `继续保持！${currentYear}年当前日均公里数（${currentYearAvg} km）＞ ${secondLatestYearInRecord}年日均（${lastYearAvg} km），且按日均预计总里程（${projectedDistance} km）＞${secondLatestYearInRecord}年（${lastYearTotalDistance} km）`
        : `Keep it up!! The current average daily distance in ${currentYear} is greater than the average in ${secondLatestYearInRecord} (current average: ${currentYearAvg} km > ${lastYearAvg} km), and the projected total distance based on the average daily distance (${projectedDistance} km) is greater than that of ${secondLatestYearInRecord} (${lastYearTotalDistance} km)`;
    } else {
      text = IS_CHINESE
        ? `${currentYear}年当前日均公里数（${currentYearAvg} km）＝ ${secondLatestYearInRecord}年日均（${lastYearAvg} km），且按日均预计总里程（${projectedDistance} km）＞${secondLatestYearInRecord}年（${lastYearTotalDistance} km），完成挑战概率很大！`
        : `OK! The current average daily distance in ${currentYear} equals the average in ${secondLatestYearInRecord} (current average: ${currentYearAvg} km = ${lastYearAvg} km), and the projected total distance based on the average daily distance (${projectedDistance} km) is greater than that of ${secondLatestYearInRecord} (${lastYearTotalDistance} km), so the chance of completing the challenge is quite high!`;
    }
  } else {
    const [x, maxPossibleKm] = minDaysWithMaxEffort(
      maxSingleDay,
      currentYearTotalDistance,
      currentYearAvg,
      lastYearTotalDistance,
      remainingDays
    );

    if (x > remainingDays) {
      text = IS_CHINESE
        ? `罢了！今年还剩 ${remainingDays} 天，即使每天都极限骑行 ${maxSingleDay} 公里，也无法超越${secondLatestYearInRecord}年（${lastYearTotalDistance} km）的总里程！`
        : `Forget it! Even if you ride the maximum distance of ${maxSingleDay} km every day for the remaining ${remainingDays} days, it will not be possible to surpass the total distance of ${secondLatestYearInRecord} (${lastYearTotalDistance} km)!`;
      remarks = IS_CHINESE
        ? `预计今年极限总里程（ ${maxPossibleKm} km）`
        : `Projected maximum total distance for this year: ${maxPossibleKm} km.`;
    } else {
      const maxDaysPercentage = roundToPercentage((x / remainingDays) * 100);
      const hardLevel = getChallengeLevel(maxDaysPercentage);

      text = IS_CHINESE
        ? `${hardLevel}
${currentYear}年当前日均公里数（${currentYearAvg} km）＜ ${secondLatestYearInRecord}年（${lastYearAvg} km），且按日均预计总里程（${projectedDistance} km）＜ ${secondLatestYearInRecord}年（${lastYearTotalDistance} km）`
        : `${hardLevel}
The current average daily distance in ${currentYear} (${currentYearAvg} km) < ${secondLatestYearInRecord} (${lastYearAvg} km), and the projected total distance based on the average daily distance (${projectedDistance} km) < ${secondLatestYearInRecord} (${lastYearTotalDistance} km).`;

      remarks = IS_CHINESE
        ? `PS: 如果在今年剩下的 ${remainingDays} 天里，至少有 ${x} 天 ( ${maxDaysPercentage}% ) 极限${TYPES_MAPPING[activityType.toLowerCase()]} ${maxSingleDay} 公里，可以超越${secondLatestYearInRecord}年`
        : `PS: If in the remaining ${remainingDays} days of this year, at least ${x} days (${maxDaysPercentage}%) of maximum ${TYPES_MAPPING[activityType.toLowerCase()]} ${maxSingleDay} km can be achieved, it's possible to surpass ${secondLatestYearInRecord}.`;
    }
  }

  // 构建返回的内容结构
  if (text && remarks) {
    return {
      content: (
        <div>
          <div className="rounded-xl bg-[#F5F5F5] px-8 py-2 text-center text-[#006CB8]">
            {text}
            <br />
            <div className="rounded-xl bg-[#F5F5F5] px-8 py-2 text-center text-[#00AFAA]">
              {remarks}
            </div>
          </div>
        </div>
      ),
    };
  } else if (text) {
    return {
      content: (
        <div className="rounded-xl bg-[#F5F5F5] px-8 py-2 text-center text-[#006CB8]">
          {text}
        </div>
      ),
    };
  } else {
    return { content: <div> </div> }; // 当text和remarks均为空
  }
};

export default evaluateMileageChance; // 导出函数
