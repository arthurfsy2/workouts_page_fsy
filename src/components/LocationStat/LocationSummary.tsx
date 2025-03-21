import Stat from '@/components/Stat';
import useActivities from '@/hooks/useActivities';

// only support China for now
const LocationSummary = () => {
  const { years, countries, provinces, cities } = useActivities();
  return (
    <div className="cursor-pointer">
      <section
        className={`my-0 mb-8 mr-8 rounded-xl bg-[#F5F5F5] px-2 py-4 text-[#579EFB]`}
      >
        {years ? (
          <Stat value={`${years.length}`} description=" 年里我走过" />
        ) : null}
        {countries ? (
          <Stat value={`${countries.length}`} description=" 个国家" />
        ) : null}
        {provinces ? (
          <Stat value={provinces.length} description=" 个省份" />
        ) : null}
        {cities ? (
          <Stat value={Object.keys(cities).length} description=" 个城市" />
        ) : null}
      </section>
      {/* <hr color="red" /> */}
    </div>
  );
};

export default LocationSummary;
