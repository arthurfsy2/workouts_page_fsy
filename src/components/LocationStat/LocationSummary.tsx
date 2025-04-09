import Stat from '@/components/Stat';
import useActivities from '@/hooks/useActivities';
import { IS_CHINESE } from '@/utils/const';
// only support China for now
const LocationSummary = () => {
  const { years, countries, provinces, cities } = useActivities();
  return (
    <div className="cursor-pointer">
      <section
        className={`my-0 mb-8 mr-2 flex flex-wrap rounded-xl bg-[#F5F5F5] px-2 py-4 text-[#579EFB] lg:mr-8`}
      >
        {years ? (
          <Stat
            className="w-full pb-5"
            value={`${years.length}`}
            description={`${IS_CHINESE ? ' 年里我走过' : years.length > 1 ? 'years, I have traveled to' : 'year, I have traveled to'}`}
          />
        ) : null}
        {countries ? (
          <Stat
            className="w-1/3 pb-2"
            citySize={4}
            value={`${countries.length}`}
            description={`${IS_CHINESE ? '个国家' : countries.length > 1 ? 'countries' : 'country'}`}
          />
        ) : null}
        {provinces ? (
          <Stat
            className="w-1/3 pb-2"
            citySize={4}
            value={provinces.length}
            description={`${IS_CHINESE ? '个省份' : provinces.length > 1 ? 'provinces' : 'province'}`}
          />
        ) : null}
        {cities ? (
          <Stat
            className="w-1/3 pb-2"
            citySize={4}
            value={Object.keys(cities).length}
            description={`${IS_CHINESE ? ' 个城市' : Object.keys(cities).length > 1 ? 'cities' : 'city'}`}
          />
        ) : null}
      </section>
      {/* <hr color="red" /> */}
    </div>
  );
};

export default LocationSummary;
