export const CATEGORY_TABS = [
  { value: "recommend", label: "推荐", categories: [] },
  { value: "dessert", label: "奶茶咖啡", categories: ["dessert"] },
  { value: "snack", label: "快餐小吃", categories: ["snack", "noodle"] },
  { value: "hotpot", label: "火锅", categories: ["hotpot"] },
  { value: "bbq", label: "烧烤烤肉", categories: ["bbq"] },
  { value: "local", label: "地方菜系", categories: ["local"] },
  { value: "asian", label: "异域料理", categories: ["asian", "western"] },
  { value: "buffet", label: "自助餐", categories: ["buffet"] },
  { value: "seafood", label: "鱼鲜海鲜", categories: ["seafood"] },
];

export const FOOD_GROUPS = [
  {
    value: "popular",
    label: "热门",
    options: [
      { value: "snack", label: "中式快餐" },
      { value: "local", label: "地方菜系" },
      { value: "noodle", label: "米粉面馆" },
      { value: "seafood", label: "鱼鲜海鲜" },
    ],
  },
  {
    value: "hotpot",
    label: "火锅",
    options: [
      { value: "hotpot", label: "全部火锅" },
      { value: "hotpot-spicy", label: "川渝火锅" },
      { value: "hotpot-beef", label: "牛羊肉火锅" },
      { value: "hotpot-chaoshan", label: "潮汕牛肉火锅" },
    ],
  },
  {
    value: "bbq",
    label: "烧烤烤肉",
    options: [
      { value: "bbq", label: "全部烧烤烤肉" },
      { value: "bbq-skewer", label: "烤串" },
      { value: "bbq-meat", label: "烤肉" },
      { value: "bbq-fish", label: "烤鱼" },
    ],
  },
  {
    value: "local",
    label: "地方菜系",
    options: [
      { value: "local", label: "全部地方菜系" },
      { value: "local-zhejiang", label: "浙江菜" },
      { value: "local-sichuan", label: "川湘菜" },
      { value: "local-farm", label: "农家菜" },
    ],
  },
  {
    value: "foreign",
    label: "异域料理",
    options: [
      { value: "western", label: "西餐" },
      { value: "asian-japanese", label: "日本料理" },
      { value: "asian-korean", label: "韩式料理" },
      { value: "asian-southeast", label: "东南亚菜" },
    ],
  },
  {
    value: "buffet",
    label: "自助餐",
    options: [
      { value: "buffet", label: "全部自助餐" },
      { value: "buffet-hotpot", label: "火锅自助" },
      { value: "buffet-bbq", label: "烤肉自助" },
      { value: "buffet-seafood", label: "海鲜自助" },
    ],
  },
  {
    value: "dessert",
    label: "奶茶咖啡",
    options: [
      { value: "dessert", label: "全部奶茶咖啡" },
      { value: "dessert-coffee", label: "咖啡" },
      { value: "dessert-tea", label: "奶茶果茶" },
      { value: "dessert-bakery", label: "甜品烘焙" },
    ],
  },
];

export const CATEGORY_LABELS = {
  local: "地方菜系",
  hotpot: "火锅",
  bbq: "烧烤烤肉",
  snack: "快餐小吃",
  noodle: "面食米粉",
  seafood: "鱼鲜海鲜",
  western: "西餐",
  asian: "日料韩餐",
  dessert: "奶茶咖啡",
  buffet: "自助餐",
};

export function getCategoryLabel(value) {
  return CATEGORY_LABELS[value] || "地方菜系";
}

export function inferRestaurantCategory(restaurant) {
  if (CATEGORY_LABELS[restaurant.category]) return restaurant.category;
  const name = String(restaurant.name || "").toLowerCase();
  const note = String(restaurant.note || "").toLowerCase();
  const hasName = (words) => words.some((word) => name.includes(word.toLowerCase()));
  const hasNote = (words) => words.some((word) => note.includes(word.toLowerCase()));

  if (hasName(["自助", "buffet"]) || hasNote(["自助餐"])) return "buffet";
  if (hasName(["日料", "日本料理", "寿司", "割烹", "居酒屋", "韩食", "韩国料理", "泰国菜", "东南亚"])) return "asian";
  if (hasName(["西餐", "意式", "披萨", "pizza", "bistro", "牛排", "汉堡", "麦当劳", "肯德基", "萨莉亚"])) return "western";
  if (hasName(["火锅", "豆捞", "涮", "暖锅", "羊蝎子", "羊肉炉", "打边炉", "肉蟹煲"])) return "hotpot";
  if (hasName(["烧烤", "烤肉", "烤串", "串串", "烤鱼", "炭烤", "碳烤"])) return "bbq";
  if (hasName(["咖啡", "coffee", "奶茶", "茶饮", "甜品", "烘焙", "蛋糕", "下午茶"])) return "dessert";
  if (hasName(["海鲜", "河鲜", "湖鲜", "鱼馆", "鱼宴", "鱼味", "鱼府", "渔庄", "龙虾"])) return "seafood";
  if (hasName(["面馆", "拉面", "拌面", "米粉", "馄饨", "饺子", "煎饺", "麻辣烫"])) return "noodle";
  if (hasName(["小吃", "快餐", "食堂", "便当", "炸鸡", "鸡排"])) return "snack";
  return "local";
}

export function inferSubcategory(restaurant) {
  if (restaurant.subcategory) return restaurant.subcategory;
  const category = inferRestaurantCategory(restaurant);
  const text = `${restaurant.name || ""} ${restaurant.note || ""}`.toLowerCase();
  const includes = (words) => words.some((word) => text.includes(word.toLowerCase()));

  if (category === "hotpot") {
    if (includes(["潮汕", "鲜切牛肉"])) return "hotpot-chaoshan";
    if (includes(["牛肉", "羊肉", "羊蝎子"])) return "hotpot-beef";
    if (includes(["川渝", "重庆", "成都", "麻辣"])) return "hotpot-spicy";
  }
  if (category === "bbq") {
    if (includes(["烤鱼"])) return "bbq-fish";
    if (includes(["烤肉"])) return "bbq-meat";
    if (includes(["烤串", "串串", "羊肉串"])) return "bbq-skewer";
  }
  if (category === "local") {
    if (includes(["杭帮菜", "浙江菜", "浙菜", "桐庐菜", "建德菜", "临安菜"])) return "local-zhejiang";
    if (includes(["川菜", "湘菜", "川湘", "江西菜"])) return "local-sichuan";
    if (includes(["农家菜", "土菜"])) return "local-farm";
  }
  if (category === "asian") {
    if (includes(["日本", "日料", "寿司", "割烹"])) return "asian-japanese";
    if (includes(["韩国", "韩式", "韩餐"])) return "asian-korean";
    if (includes(["泰国", "越南", "东南亚"])) return "asian-southeast";
  }
  if (category === "buffet") {
    if (includes(["海鲜"])) return "buffet-seafood";
    if (includes(["烤肉"])) return "buffet-bbq";
    if (includes(["火锅"])) return "buffet-hotpot";
  }
  if (category === "dessert") {
    if (includes(["咖啡", "coffee"])) return "dessert-coffee";
    if (includes(["奶茶", "果茶", "茶饮"])) return "dessert-tea";
    if (includes(["蛋糕", "面包", "烘焙", "甜品"])) return "dessert-bakery";
  }
  return category;
}

export function matchesFoodSelection(restaurant, selectedValues) {
  if (!selectedValues.size) return true;
  const category = inferRestaurantCategory(restaurant);
  const subcategory = inferSubcategory(restaurant);
  return selectedValues.has(category) || selectedValues.has(subcategory);
}
