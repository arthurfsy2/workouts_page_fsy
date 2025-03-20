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
      <section className={`mr-8 my-0 mb-8 py-4 px-2 rounded-xl text-[#579EFB] bg-[#F5F5F5]`}>
        {periodArr.map(([type, times]) => (
          <Stat
            key={type}
            value={`${IS_CHINESE && titleForType(type)} ${times} `}
            description={type + (times>1 ? "s" : "") }
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
