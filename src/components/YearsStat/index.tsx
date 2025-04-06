import YearStat from '@/components/YearStat';
import useActivities from '@/hooks/useActivities';
import { INFO_MESSAGE } from '@/utils/const';
// import styles from './style.module.css'; // 引入样式模块
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
  // make sure the year click on front
  let yearsArrayUpdate = years.slice();
  yearsArrayUpdate.push('Total');
  yearsArrayUpdate = yearsArrayUpdate.filter((x) => x !== year);
  yearsArrayUpdate.unshift(year);

  // for short solution need to refactor
  return (
    <div>
      <section>
        <p className="my-0 mb-8 mr-2 rounded-xl bg-[#F5F5F5] px-2 py-4 text-base font-extrabold text-[#00AFAA] lg:mr-8">
          {INFO_MESSAGE(years.length, year)}
          <br />
          <br />
          <QuoteOfTheDay /> {/* 在这里插入每日一言组件 */}
        </p>
      </section>
      {/* <hr color="red" /> */}
      {yearsArrayUpdate.map((year) => (
        <YearStat
          key={year}
          year={year}
          onClick={onClick}
          onClickTypeInYear={onClickTypeInYear}
        />
      ))}
      {
        // eslint-disable-next-line no-prototype-builtins
        yearsArrayUpdate.hasOwnProperty('Total') ? (
          <YearStat
            key="Total"
            year="Total"
            onClick={onClick}
            onClickTypeInYear={onClickTypeInYear}
          />
        ) : (
          <div />
        )
      }
    </div>
  );
};

export default YearsStat;
