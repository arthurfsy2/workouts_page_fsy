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
const MAP_HEIGHT = 500;
//set to `false` if you want to hide the road label characters
const ROAD_LABEL_DISPLAY = true;
// update for now 2024/11/17 the privacy mode is true
//set to `true` if you want to display only the routes without showing the map.
const PRIVACY_MODE = false;
// update for now 2024/11/17 the lights on default is false
//set to `false` if you want to make light off as default, only effect when `PRIVACY_MODE` = false
const LIGHTS_ON =true;
// richer title for the activity types (like garmin style)
const RICH_TITLE = true;

// IF you outside China please make sure IS_CHINESE = false
const IS_CHINESE = true;
const USE_ANIMATION_FOR_GRID = false;
const CHINESE_INFO_MESSAGE = (yearLength: number, year: string): string =>
  `运动 ${yearLength} 年 ` + ( year === 'Total' ? '' : `，右图为 ${year} 年的轨迹`);

const ENGLISH_INFO_MESSAGE = (yearLength: number, year: string): string =>
  `Logged ${yearLength} Years of Journey` +  ( year === 'Total' ? '' : `, the map show routes in ${year}`);

// not support English for now
const CHINESE_LOCATION_INFO_MESSAGE_FIRST =
  '我去过了一些地方，希望随着时间推移，地图点亮的地方越来越多';
const CHINESE_LOCATION_INFO_MESSAGE_SECOND = '不要停下来，不要停下探索的脚步';

const INFO_MESSAGE = IS_CHINESE ? CHINESE_INFO_MESSAGE : ENGLISH_INFO_MESSAGE;
const FULL_MARATHON_RUN_TITLE = IS_CHINESE ? '全程马拉松 🏃‍♂️' : 'Full Marathon 🏃‍♂️';
const HALF_MARATHON_RUN_TITLE = IS_CHINESE ? '半程马拉松 🏃‍♀️' : 'Half Marathon 🏃‍♀️';
const RUN_TITLE = IS_CHINESE ? '跑步 🏃' : 'Run 🏃';
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

const RUN_TITLES = {
  FULL_MARATHON_RUN_TITLE,
  HALF_MARATHON_RUN_TITLE,
  RUN_TITLE,
  TRAIL_RUN_TITLE,

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

export {
  USE_GOOGLE_ANALYTICS,
  GOOGLE_ANALYTICS_TRACKING_ID,
  CHINESE_LOCATION_INFO_MESSAGE_FIRST,
  CHINESE_LOCATION_INFO_MESSAGE_SECOND,
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
  RICH_TITLE,
};

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
const veryPeri = 'rgb(105,106,173)';//长春花蓝
const red = 'rgb(255,0,0)';//大红色
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
export const SNOWBOARD_COLOR = dark_vanilla;
export const TRAIL_RUN_COLOR = IKB;
