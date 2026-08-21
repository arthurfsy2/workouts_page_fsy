import YearStat from '@/components/YearStat';
import useActivities from '@/hooks/useActivities';
import { INFO_MESSAGE } from '@/utils/const';
import QuoteOfTheDay from '@/utils/QuoteOfTheDay';

const YearsStat = ({
  year,
  onClick,
  onClickTypeInYear,
}: {
  year: string;
  onClick: (_year: string) => void;
  onClickTypeInYear: (_year: string, _type: string) => void;
}) => {
  const { years } = useActivities();

  return (
    <div>
      <section>
        <p className="my-0 mb-6 mr-2 rounded-xl bg-muted px-4 py-5 text-base font-extrabold text-primary lg:mr-8 shadow-warm">
          {INFO_MESSAGE(years.length, year)}
          <br />
          <br />
          <QuoteOfTheDay />
        </p>
      </section>

      {/* 当前年份面板 — 由地图的年份切换按钮控制 */}
      <YearStat
        key={year}
        year={year}
        onClick={onClick}
        onClickTypeInYear={onClickTypeInYear}
      />
    </div>
  );
};

export default YearsStat;
