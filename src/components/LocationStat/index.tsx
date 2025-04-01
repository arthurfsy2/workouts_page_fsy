import YearStat from '@/components/YearStat';
import {
  CHINESE_LOCATION_INFO_MESSAGE_FIRST,
  CHINESE_LOCATION_INFO_MESSAGE_SECOND,
} from '@/utils/const';
import CitiesStat from './CitiesStat';
import LocationSummary from './LocationSummary';
import PeriodStat from './PeriodStat';
import QuoteOfTheDay from '@/utils/QuoteOfTheDay';
interface ILocationStatProps {
  changeYear: (_year: string) => void;
  changeCity: (_city: string) => void;
  changeType: (_type: string) => void;
  onClickTypeInYear: (_year: string, _type: string) => void;
}
import styles from './style.module.css';

const LocationStat = ({
  changeYear,
  changeCity,
  changeType,
  onClickTypeInYear,
}: ILocationStatProps) => (
  <div className="">
    <section>
      <p
        className={`my-0 mb-8 mr-8 rounded-xl bg-[#F5F5F5] px-2 py-4 text-xl font-extrabold text-[#00AFAA]`}
      >
        {CHINESE_LOCATION_INFO_MESSAGE_FIRST}
        <br />
        <br />
        {CHINESE_LOCATION_INFO_MESSAGE_SECOND}
        <br />
        <br />
        <QuoteOfTheDay /> {/* 在这里插入每日一言组件 */}
      </p>
    </section>
    {/* <hr color="red" /> */}
    <LocationSummary />
    <CitiesStat onClick={changeCity} />
    <PeriodStat onClick={changeType} />
    <YearStat
      year="Total"
      onClick={changeYear}
      onClickTypeInYear={onClickTypeInYear}
    />
  </div>
);

export default LocationStat;
