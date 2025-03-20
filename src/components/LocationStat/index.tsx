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
  onClickTypeInYear
}: ILocationStatProps) => (
  <div className="w-full pb-16 lg:w-full lg:pr-16">
    <section className={`bg-white shadow-md rounded-lg p-6 text-gray-800 text-lg font-semibold leading-relaxed hover:shadow-lg transition-shadow duration-300`}
      style={{ 
        backgroundColor: 'rgb(245, 245, 245)', // 设置背景颜色
        color:  'rgb(0, 175, 170)'
    }}>
      <p >
        {CHINESE_LOCATION_INFO_MESSAGE_FIRST}
        .
        <br />
        {CHINESE_LOCATION_INFO_MESSAGE_SECOND}
        .
        <br />
        <br />
        <QuoteOfTheDay  /> {/* 在这里插入每日一言组件 */}
      </p>
      
    </section>
    <hr color="red" />
    <LocationSummary />
    <CitiesStat onClick={changeCity} />
    <PeriodStat onClick={changeType} />
    <YearStat year="Total" onClick={changeYear} onClickTypeInYear={onClickTypeInYear}/>
  </div>
);

export default LocationStat;
