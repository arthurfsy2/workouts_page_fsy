import ActivityList from '@/components/ActivityList';
import WeightChart from '@/components/WeightChart';
import { HAS_WEIGHT_DATA } from '@/utils/weight';

const HomePage = () => {
  return (
    <div>
      {/* 没有体重数据源时(例如 fork 后对方没有体脂秤)整块不渲染 */}
      {HAS_WEIGHT_DATA && <WeightChart />}
      <ActivityList />
    </div>
  );
};

export default HomePage;
