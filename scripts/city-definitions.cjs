const CITY_DEFINITIONS = [
  {
    adcode: "330100",
    name: "杭州市",
    shortName: "杭州",
    province: "浙江省",
    center: "120.155070,30.274084",
    minRestaurants: 3000,
    coordinateBounds: {
      minLongitude: 118.3,
      maxLongitude: 120.8,
      minLatitude: 29.1,
      maxLatitude: 30.7,
    },
    districts: [
      "上城区",
      "拱墅区",
      "西湖区",
      "滨江区",
      "萧山区",
      "余杭区",
      "临平区",
      "钱塘区",
      "富阳区",
      "临安区",
      "桐庐县",
      "淳安县",
      "建德市",
    ],
  },
  {
    adcode: "331000",
    name: "台州市",
    shortName: "台州",
    province: "浙江省",
    center: "121.420757,28.656386",
    minRestaurants: 500,
    maxRestaurants: 1000,
    coordinateBounds: {
      minLongitude: 120.2,
      maxLongitude: 122.2,
      minLatitude: 27.8,
      maxLatitude: 29.4,
    },
    districts: [
      "椒江区",
      "黄岩区",
      "路桥区",
      "温岭市",
      "临海市",
      "玉环市",
      "天台县",
      "仙居县",
      "三门县",
    ],
  },
];

const RESTAURANT_KEYWORDS = [
  "餐厅",
  "美食",
  "中餐",
  "本地菜",
  "地方菜",
  "私房菜",
  "农家菜",
  "海鲜",
  "小海鲜",
  "鱼鲜",
  "火锅",
  "牛肉火锅",
  "烧烤",
  "烤肉",
  "烤鱼",
  "小吃",
  "快餐",
  "面馆",
  "米粉",
  "馄饨",
  "饺子",
  "麻辣烫",
  "日料",
  "寿司",
  "韩国料理",
  "西餐",
  "牛排",
  "披萨",
  "咖啡",
  "奶茶",
  "甜品",
  "烘焙",
  "自助餐",
];

function getCityDefinition(adcodeOrName) {
  return CITY_DEFINITIONS.find((city) =>
    city.adcode === adcodeOrName ||
    city.name === adcodeOrName ||
    city.shortName === adcodeOrName
  );
}

module.exports = {
  CITY_DEFINITIONS,
  RESTAURANT_KEYWORDS,
  getCityDefinition,
};
