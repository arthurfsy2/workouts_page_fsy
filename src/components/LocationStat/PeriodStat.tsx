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
            value={`${titleForType(type)}`}
            description={`${times} ${IS_CHINESE ? '次' : 'times'}`}
            // citySize={4}
            className="w-full pb-2"
            onClick={() => onClick(type)}
          />
        ))}
      </section>
      {/* <hr color="red" /> */}
    </div>
  );
};

export default PeriodStat;
