// const
const MAPBOX_TOKEN =
  // For security reasons, please avoid using the default public token provided by Mapbox as much as possible.
  // Instead, manually add a new token and apply URL restrictions.
  // (please refer to https://github.com/yihong0618/running_page/issues/643#issuecomment-2042668580)
  'pk.eyJ1IjoiYmVuLTI5IiwiYSI6ImNrZ3Q4Ym9mMDBqMGYyeXFvODV2dWl6YzQifQ.gSKoWF-fMjhzU67TuDezJQ';
const MUNICIPALITY_CITIES_ARR = [
  '北京市',
  '上海市',
  '天津市',
  '重庆市',
  '香港特别行政区',
  '澳门特别行政区',
];
const MAP_LAYER_LIST = [
  'road-label',
  'waterway-label',
  'natural-line-label',
  'natural-point-label',
  'water-line-label',
  'water-point-label',
  'poi-label',
  'airport-label',
  'settlement-subdivision-label',
  'settlement-label',
  'state-label',
  'country-label',
];

const USE_GOOGLE_ANALYTICS = false;
const GOOGLE_ANALYTICS_TRACKING_ID = '';

// styling: set to `true` if you want dash-line route
const USE_DASH_LINE = false;
// styling: route line opacity: [0, 1]
const LINE_OPACITY = 0.6;
// styling: map height
const MAP_HEIGHT = 450;
//set to `false` if you want to hide the road label characters
const ROAD_LABEL_DISPLAY = true;
// update for now 2024/11/17 the privacy mode is true
//set to `true` if you want to display only the routes without showing the map.
const PRIVACY_MODE = false;
// update for now 2024/11/17 the lights on default is false
//set to `false` if you want to make light off as default, only effect when `PRIVACY_MODE` = false
const LIGHTS_ON = true;
//set to `true` if you want to show the 'Elevation Gain' column
const SHOW_ELEVATION_GAIN = true;
// richer title for the activity types (like garmin style)
const RICH_TITLE = true;

// IF you outside China please make sure IS_CHINESE = false
const IS_CHINESE = true;
const USE_ANIMATION_FOR_GRID = false;
const CHINESE_INFO_MESSAGE = (yearLength: number, year: string): string =>
  `锻炼 ${yearLength} 年了 ` +
  (year === 'Total' ? '' : `，右图为 ${year} 年的活动轨迹`);

const ENGLISH_INFO_MESSAGE = (yearLength: number, year: string): string =>
  `Exercising for ${yearLength} years` +
  (year === 'Total'
    ? ''
    : `, the right picture shows the activity trajectory in ${year}`);

const LOCATION_INFO_MESSAGE_FIRST =
  '我一开始是一个极度讨厌运动的人，后来喜欢上跑步机，接着是路跑，到最近的骑行';
const LOCATION_INFO_MESSAGE_SECOND =
  '运动这件事，想想就很痛苦，但是完成了的成就感就是会带来多巴胺！';

const INFO_MESSAGE = IS_CHINESE ? CHINESE_INFO_MESSAGE : ENGLISH_INFO_MESSAGE;
const FULL_MARATHON_RUN_TITLE = IS_CHINESE
  ? '全程马拉松 🏃‍♂️'
  : 'Full Marathon 🏃‍♂️';
const HALF_MARATHON_RUN_TITLE = IS_CHINESE
  ? '半程马拉松 🏃‍♀️'
  : 'Half Marathon 🏃‍♀️';
const ONE_HUNDRED_KM_CYCLING_TITLE = IS_CHINESE
  ? '百公里骑行 🚴‍♂️'
  : '100 KM Ride 🚴‍♂️';
const RUN_TITLE = IS_CHINESE ? '跑步 🏃' : 'Run 🏃';
const TREADMILL_TITLE = IS_CHINESE ? '跑步机 🏃' : 'Treadmill Run🏃';
const TRAIL_RUN_TITLE = IS_CHINESE ? '越野跑 🏞️' : 'Trail Run 🏞️';
const SWIM_TITLE = IS_CHINESE ? '游泳 🏊‍♂️' : 'Swim 🏊‍♂️';

const RIDE_TITLE = IS_CHINESE ? '骑行 🚴‍♂️' : 'Ride 🚴‍♂️';
const INDOOR_RIDE_TITLE = IS_CHINESE ? '室内骑行 🚴‍♀️' : 'Indoor Ride 🚴‍♀️';
const VIRTUAL_RIDE_TITLE = IS_CHINESE ? '虚拟骑行 🎮' : 'Virtual Ride 🎮';
const HIKE_TITLE = IS_CHINESE ? '徒步 🥾' : 'Hike 🥾';
const ROWING_TITLE = IS_CHINESE ? '划船 🚣‍♂️' : 'Rowing 🚣‍♂️';
const KAYAKING_TITLE = IS_CHINESE ? '皮划艇 🛶' : 'Kayaking 🛶';
const SNOWBOARD_TITLE = IS_CHINESE ? '单板滑雪 🏂' : 'Snowboard 🏂';
const SKI_TITLE = IS_CHINESE ? '双板滑雪 🎿' : 'Ski 🎿';
const ROAD_TRIP_TITLE = IS_CHINESE ? '自驾 🚗' : 'Road Trip 🚗';
const FLIGHT_TITLE = IS_CHINESE ? '飞行 ✈️' : 'Flight ✈️';

//以下为汇总表翻译
const HOME_BUTTON = IS_CHINESE ? '返回首页' : 'Home';

const ACTIVITY_COUNT_TITLE = IS_CHINESE ? '活动次数' : 'Activity Count';
const MAX_DISTANCE_TITLE = IS_CHINESE ? '最远距离' : 'Max Distance';
const MAX_SPEED_TITLE = IS_CHINESE ? '最快速度' : 'Max Speed';
const TOTAL_TIME_TITLE = IS_CHINESE ? '总时间' : 'Total Time';
const AVERAGE_SPEED_TITLE = IS_CHINESE ? '平均速度' : 'Average Speed';
const TOTAL_DISTANCE_TITLE = IS_CHINESE ? '总距离' : 'Total Distance';
const TOTAL_ELEVATION_GAIN_TITLE = IS_CHINESE
  ? '总海拔爬升'
  : 'Total Elevation Gain';
const YEARLY_TITLE = IS_CHINESE ? '按年' : 'Yearly';
const MONTHLY_TITLE = IS_CHINESE ? '按月' : 'Monthly';
const WEEKLY_TITLE = IS_CHINESE ? '按周' : 'Weekly';
const DAILY_TITLE = IS_CHINESE ? '按天' : 'Daily';
const LOCATION_TITLE = IS_CHINESE ? '位置' : 'Location';
const DAILY_AVERAGE = IS_CHINESE ? '日均' : 'Daily Average';

//以下定义首页按钮翻译

const SWITCH_LOCATION_BUTTON = IS_CHINESE ? '👉 地点统计' : '👉 Loc. Stat.';
const SWITCH_YEAR_BUTTON = IS_CHINESE ? '👉 年份统计' : '👉 Year Stat.';
const SUMMARY_BUTTON = IS_CHINESE ? '📊 汇总分析' : '📊 Summary';
const SWITCH_TOTAL_BUTTON = IS_CHINESE ? ' 汇总' : ' Total';
const SWITCH_GRID_BUTTON = IS_CHINESE ? '查看轨迹 🗺️' : 'Grid View 🗺️';
const SWITCH_GITHUB_BUTTON = IS_CHINESE ? '查看日历 🗓️' : 'Calendar View 🗓️';
const SWITCH_MOL_BUTTON = IS_CHINESE ? '历年汇总 ⏳' : 'Month of Life ⏳';

const BUTTON_TITLES = {
  SWITCH_LOCATION_BUTTON,
  SWITCH_YEAR_BUTTON,
  SUMMARY_BUTTON,
  SWITCH_TOTAL_BUTTON,
  SWITCH_GRID_BUTTON,
  SWITCH_GITHUB_BUTTON,
  SWITCH_MOL_BUTTON,
};

const RUN_TITLES = {
  FULL_MARATHON_RUN_TITLE,
  HALF_MARATHON_RUN_TITLE,
  ONE_HUNDRED_KM_CYCLING_TITLE,
  RUN_TITLE,
  TRAIL_RUN_TITLE,
  TREADMILL_TITLE,

  RIDE_TITLE,
  INDOOR_RIDE_TITLE,
  VIRTUAL_RIDE_TITLE,
  HIKE_TITLE,
  ROWING_TITLE,
  KAYAKING_TITLE,
  SWIM_TITLE,
  ROAD_TRIP_TITLE,
  FLIGHT_TITLE,
  SNOWBOARD_TITLE,
  SKI_TITLE,
};

const TYPES_MAPPING = {
  run: RUN_TITLES.RUN_TITLE,
  'trail run': RUN_TITLES.TRAIL_RUN_TITLE,
  swim: RUN_TITLES.SWIM_TITLE,
  ride: RUN_TITLES.RIDE_TITLE,
  virtualride: RUN_TITLES.VIRTUAL_RIDE_TITLE,
  hike: RUN_TITLES.HIKE_TITLE,
  rowing: RUN_TITLES.ROWING_TITLE,
  kayaking: RUN_TITLES.KAYAKING_TITLE,
  snowboard: RUN_TITLES.SNOWBOARD_TITLE,
  ski: RUN_TITLES.SKI_TITLE,
  roadtrip: RUN_TITLES.ROAD_TRIP_TITLE,
};

const ACTIVITY_TOTAL = {
  ACTIVITY_COUNT_TITLE,
  MAX_DISTANCE_TITLE,
  MAX_SPEED_TITLE,
  TOTAL_TIME_TITLE,
  AVERAGE_SPEED_TITLE,
  TOTAL_DISTANCE_TITLE,
  TOTAL_ELEVATION_GAIN_TITLE,
  YEARLY_TITLE,
  MONTHLY_TITLE,
  WEEKLY_TITLE,
  DAILY_TITLE,
  LOCATION_TITLE,
  HOME_BUTTON,
  DAILY_AVERAGE,
};

const ACTIVITY_TYPES = {
  RUN_TITLE,

  RIDE_TITLE,
  HIKE_TITLE,
};

// 以下为runtable表头翻译
const TYPE_TITLE = IS_CHINESE ? '类型 🗂️' : 'Type 🗂️';
const ELEVATION_GAIN_TITLE = IS_CHINESE ? '爬升 📈' : 'Elevation Gain 📈';
const PACE_TITLE = IS_CHINESE ? '配速(时速) 🏃' : 'Pace (Speed) 🏃';
const DURATION_TITLE = IS_CHINESE ? '时长 ⏳' : 'Duration ⏳';
const DATE_TITLE = IS_CHINESE ? '日期 📅' : 'Date 📅';
const AVG_BPM_TITLE = IS_CHINESE ? '平均心率💓' : 'Avg Heart Rate 💓';
const STREAK_TITLE = IS_CHINESE ? '天连续运动 🔁' : 'days Streak 🔁';
const JOURNEY_TITLE = IS_CHINESE ? '旅程 🛣️' : 'Journey 🛣️';
const EARLIEST_START_TIME_TITLE = IS_CHINESE
  ? '最早开始时间 🌅'
  : 'Earliest start time 🌅';
const LATEST_START_TIME_TITLE = IS_CHINESE
  ? '最晚开始时间 🌙'
  : 'Latest start time 🌙';
const NEW_CHECK_IN_LOCATION = IS_CHINESE
  ? '新打卡地点 📍'
  : 'New check-in location 📍';

const RUNTABLE_TITLE = {
  TYPE_TITLE,

  ELEVATION_GAIN_TITLE,
  PACE_TITLE,
  DURATION_TITLE,
  DATE_TITLE,
  AVG_BPM_TITLE,
  STREAK_TITLE,
  JOURNEY_TITLE,
  EARLIEST_START_TIME_TITLE,
  LATEST_START_TIME_TITLE,
  NEW_CHECK_IN_LOCATION,
};

//当某个活动的坐标数据为空时，定义到的城市
const DEFAULT_LOCATION = { longitude: 113.9353, latitude: 22.5431, zoom: 9 };

export {
  USE_GOOGLE_ANALYTICS,
  GOOGLE_ANALYTICS_TRACKING_ID,
  LOCATION_INFO_MESSAGE_FIRST,
  LOCATION_INFO_MESSAGE_SECOND,
  MAPBOX_TOKEN,
  MUNICIPALITY_CITIES_ARR,
  MAP_LAYER_LIST,
  IS_CHINESE,
  ROAD_LABEL_DISPLAY,
  INFO_MESSAGE,
  RUN_TITLES,
  USE_ANIMATION_FOR_GRID,
  USE_DASH_LINE,
  LINE_OPACITY,
  MAP_HEIGHT,
  PRIVACY_MODE,
  LIGHTS_ON,
  SHOW_ELEVATION_GAIN,
  RICH_TITLE,
  DEFAULT_LOCATION,
  SWITCH_LOCATION_BUTTON,
  SWITCH_TOTAL_BUTTON,
  SWITCH_YEAR_BUTTON,
  SUMMARY_BUTTON,
  ACTIVITY_TOTAL,
  ACTIVITY_TYPES,
  RUNTABLE_TITLE,
  BUTTON_TITLES,
  TYPES_MAPPING,
};

// eslint-disable-next-line no-unused-vars
const nike = 'rgb(224,237,94)';
const yellow = 'rgb(224,237,94)';
const mgi_green = 'rgb(0,175,170)';
const mgi_blue = 'rgb(0,108,184)';
const mgi_blue2 = 'rgb(87,158,251)';
const mgi_blue3 = 'rgb(67,91,163)';
const pink = 'rgb(237,85,219)';
const cyan = 'rgb(112,243,255)';
const IKB = 'rgb(0,47,167)';
const dark_vanilla = 'rgb(228,212,220)';
const gold = 'rgb(242,190,69)';
const purple = 'rgb(114,69,152)';
const veryPeri = 'rgb(105,106,173)'; //长春花蓝
const red = 'rgb(255,0,0)'; //大红色
const mgi_black = 'rgb(27,43,56)';
const mgi_purple = 'rgb(114, 69, 152)';

// If your map has an offset please change this line
// issues #92 and #198
export const NEED_FIX_MAP = false;
export const MAIN_COLOR = mgi_blue;
export const RUN_COLOR = mgi_purple;
export const RIDE_COLOR = mgi_green;
export const VIRTUAL_RIDE_COLOR = veryPeri;
export const HIKE_COLOR = mgi_blue2;
export const SWIM_COLOR = gold;
export const ROWING_COLOR = cyan;
export const ROAD_TRIP_COLOR = purple;
export const FLIGHT_COLOR = dark_vanilla;
export const PROVINCE_FILL_COLOR = mgi_blue;
export const COUNTRY_FILL_COLOR = dark_vanilla;
export const KAYAKING_COLOR = red;
export const SNOWBOARD_COLOR = veryPeri;
export const TRAIL_RUN_COLOR = IKB;
export const TREADMILL_RUN_COLOR = mgi_blue3;

// map tiles vendor, maptiler or mapbox or stadiamaps
// if you want to use maptiler, set the access token in MAP_TILE_ACCESS_TOKEN
export const MAP_TILE_VENDOR = 'mapbox';

// map tiles style name, see MAP_TILE_STYLES for more details
export const MAP_TILE_STYLE = 'light-v11';

// access token. you can apply a new one, it's free.
// maptiler: Gt5R0jT8tuIYxW6sNrAg | sign up at https://cloud.maptiler.com/auth/widget
// stadiamaps: 8a769c5a-9125-4936-bdcf-a6b90cb5d0a4 |sign up at https://client.stadiamaps.com/signup/
export const MAP_TILE_ACCESS_TOKEN = '8a769c5a-9125-4936-bdcf-a6b90cb5d0a4';
//"akuvQTIUaPG5sbtkpwvc";

export const MAP_TILE_STYLES = {
  maptiler: {
    dataviz: 'https://api.maptiler.com/maps/dataviz/style.json?key=',
    basic: 'https://api.maptiler.com/maps/basic-v2/style.json?key=',
    streets: 'https://api.maptiler.com/maps/streets-v2/style.json?key=',
    outdoor: 'https://api.maptiler.com/maps/outdoor-v2/style.json?key=',
    bright: 'https://api.maptiler.com/maps/bright-v2/style.json?key=',
    topo: 'https://api.maptiler.com/maps/topo-v2/style.json?key=',
    winter: 'https://api.maptiler.com/maps/winter-v2/style.json?key=',
    hybrid: 'https://api.maptiler.com/maps/hybrid/style.json?key=',
  },
  stadiamaps: {
    alidade_smooth:
      'https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=',
    alidade_satellite:
      'https://tiles.stadiamaps.com/styles/alidade_satellite.json?api_key=',
  },
  mapbox: {
    'light-v11': 'mapbox://styles/mapbox/light-v11',
    'dark-v10': 'mapbox://styles/mapbox/dark-v10',
    'dark-v11': 'mapbox://styles/mapbox/dark-v11',
    'navigation-night': 'mapbox://styles/mapbox/navigation-night-v1',
    'navigation-day': 'mapbox://styles/mapbox/navigation-day-v1',
  },
  default: 'mapbox://styles/mapbox/light-v10',
};
