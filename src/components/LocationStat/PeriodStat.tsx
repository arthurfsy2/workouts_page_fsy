import Stat from '@/components/Stat';
import useActivities from '@/hooks/useActivities';
import { IS_CHINESE } from '@/utils/const';
import { titleForType } from '@/utils/utils';

const PeriodStat = ({ onClick }: { onClick: (_period: string) => void }) => {
  const { runPeriod } = useActivities();
  const periodArr = Object.entries(runPeriod);
  periodArr.sort((a, b) => b[1] - a[1]);
  return (
    <div className="cursor-pointer">
      <section
        className={`my-0 mb-8 mr-8 rounded-xl bg-[#F5F5F5] px-2 py-4 text-[#579EFB]`}
      >
        {periodArr.map(([type, times]) => (
          <Stat
            key={type}
            value={`${IS_CHINESE && titleForType(type)}`}
            description={`${times} ${type + (times > 1 ? 's' : '')}`}
            citySize={3}
            onClick={() => onClick(type)}
          />
        ))}
      </section>
      {/* <hr color="red" /> */}
    </div>
  );
};

export default PeriodStat;
