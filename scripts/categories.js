export const CATEGORY_TABS = [
  { value: "recommend", label: "全部", categories: [] },
  { value: "local", label: "中餐", categories: ["local"] },
  { value: "hotpot", label: "火锅", categories: ["hotpot"] },
  { value: "bbq", label: "烧烤烤肉", categories: ["bbq"] },
  { value: "seafood", label: "鱼鲜海鲜", categories: ["seafood"] },
  { value: "snack", label: "快餐小吃", categories: ["snack"] },
  { value: "noodle", label: "面食米粉", categories: ["noodle"] },
  { value: "dessert-drink", label: "咖啡茶饮", categories: ["dessert-coffee", "dessert-tea"] },
  { value: "dessert-bakery", label: "甜品烘焙", categories: ["dessert-bakery"] },
  { value: "asian", label: "日韩西餐", categories: ["asian", "western"] },
  { value: "buffet", label: "自助餐", categories: ["buffet"] },
];

export const FOOD_GROUPS = [
  {
    value: "local",
    label: "中餐",
    options: [
      { value: "local", label: "全部中餐" },
      { value: "local-zhejiang", label: "江浙本地菜" },
      { value: "local-sichuan", label: "川湘菜" },
      { value: "local-farm", label: "农家土菜" },
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
    value: "seafood",
    label: "鱼鲜海鲜",
    options: [
      { value: "seafood", label: "全部鱼鲜海鲜" },
    ],
  },
  {
    value: "fast",
    label: "快餐小吃",
    options: [
      { value: "snack", label: "快餐小吃" },
      { value: "noodle", label: "面食米粉" },
    ],
  },
  {
    value: "dessert",
    label: "咖啡茶饮",
    options: [
      { value: "dessert", label: "全部咖啡甜品" },
      { value: "dessert-coffee", label: "咖啡" },
      { value: "dessert-tea", label: "奶茶果茶" },
      { value: "dessert-bakery", label: "甜品烘焙" },
    ],
  },
  {
    value: "foreign",
    label: "日韩西餐",
    options: [
      { value: "asian", label: "日韩东南亚" },
      { value: "western", label: "西餐轻食" },
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
];

export const CATEGORY_LABELS = {
  local: "中餐地方菜",
  hotpot: "火锅",
  bbq: "烧烤烤肉",
  snack: "快餐小吃",
  noodle: "面食米粉",
  seafood: "鱼鲜海鲜",
  western: "西餐轻食",
  asian: "日韩东南亚",
  dessert: "咖啡茶饮甜品",
  buffet: "自助餐",
};

export function getCategoryLabel(value) {
  return CATEGORY_LABELS[value] || getSubcategoryLabel(value) || "中餐地方菜";
}

export function inferRestaurantCategory(restaurant) {
  const explicit = CATEGORY_LABELS[restaurant.category] ? restaurant.category : "";
  const fields = collectTextFields(restaurant);

  const rules = [
    { value: "buffet", strong: ["自助餐厅", "自助餐"], name: ["自助", "buffet"] },
    {
      value: "dessert",
      strong: ["咖啡厅", "冷饮店", "糕饼店", "甜品店", "茶艺馆", "饮品店"],
      name: ["咖啡", "coffee", "cafe", "café", "星巴克", "瑞幸", "manner", "奶茶", "茶饮", "果茶", "古茗", "喜茶", "奈雪", "茶百道", "霸王茶姬", "1点点", "甜品", "蛋糕", "面包", "吐司", "烘焙", "bakery", "好利来", "下午茶"],
      text: ["珍珠奶茶", "鲜奶茶", "果茶", "现磨咖啡", "美式咖啡", "生日蛋糕", "小蛋糕", "蛋挞", "泡芙", "奶油", "提拉米苏"],
    },
    { value: "hotpot", strong: ["火锅店"], name: ["火锅", "豆捞", "涮", "暖锅", "羊蝎子", "羊肉锅", "打边炉", "肉蟹煲"] },
    { value: "bbq", strong: ["烧烤店"], name: ["烧烤", "烤肉", "烤串", "串串", "烤鱼", "炭烤", "碳烤"] },
    { value: "seafood", strong: ["海鲜酒楼"], name: ["海鲜", "小海鲜", "河鲜", "湖鲜", "鱼馆", "鱼宴", "鱼味", "鱼府", "渔庄", "龙虾", "蟹"] },
    { value: "asian", strong: ["日本料理", "韩国料理"], name: ["日料", "日本料理", "寿司", "刺身", "居酒屋", "韩食", "韩国料理", "韩式", "泰国菜", "东南亚"] },
    { value: "western", strong: ["西餐厅", "外国餐厅"], name: ["西餐", "意式", "披萨", "比萨", "pizza", "bistro", "牛排", "汉堡", "麦当劳", "肯德基", "萨莉亚", "达美乐"] },
    { value: "noodle", strong: ["面馆"], name: ["面馆", "拉面", "拌面", "拌川", "米粉", "粉面", "馄饨", "饺子", "煎饼", "麻辣烫"] },
    { value: "snack", strong: ["快餐厅", "休闲餐饮场所"], name: ["小吃", "快餐", "食堂", "便当", "炸鸡", "鸡排", "粥铺", "包子", "早餐"] },
    { value: "local", strong: ["中餐厅", "浙江菜", "杭帮菜", "台州菜"], name: ["杭帮菜", "浙江菜", "浙菜", "台州菜", "本地菜", "土菜", "私房菜", "农家菜", "川菜", "湘菜", "江浙菜"] },
  ];

  for (const rule of rules) {
    if (includesAny(fields.type, rule.strong || [])) return rule.value;
  }

  for (const rule of rules) {
    if (includesAny(fields.name, rule.name || [])) return rule.value;
  }

  for (const rule of rules) {
    if (includesAny(fields.all, rule.text || [])) return rule.value;
  }

  return explicit && explicit !== "local" ? explicit : "local";
}

export function inferSubcategory(restaurant) {
  const category = inferRestaurantCategory(restaurant);
  const fields = collectTextFields(restaurant);
  const text = fields.all;
  const includes = (words) => includesAny(text, words);

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
    if (includes(["杭帮菜", "浙江菜", "浙菜", "台州菜", "桐庐菜", "建德菜", "临安菜"])) return "local-zhejiang";
    if (includes(["川菜", "湘菜", "川湘", "江西菜"])) return "local-sichuan";
    if (includes(["农家菜", "土菜"])) return "local-farm";
  }
  if (category === "asian") {
    if (includes(["日本", "日料", "寿司", "刺身"])) return "asian-japanese";
    if (includes(["韩国", "韩式", "韩餐"])) return "asian-korean";
    if (includes(["泰国", "越南", "东南亚"])) return "asian-southeast";
  }
  if (category === "buffet") {
    if (includes(["海鲜"])) return "buffet-seafood";
    if (includes(["烤肉"])) return "buffet-bbq";
    if (includes(["火锅"])) return "buffet-hotpot";
  }
  if (category === "dessert") {
    if (includes(["奶茶", "果茶", "茶饮", "冷饮", "古茗", "喜茶", "奈雪", "茶百道", "霸王茶姬", "1点点"])) return "dessert-tea";
    if (includes(["咖啡", "coffee", "cafe", "café", "星巴克", "瑞幸", "manner"])) return "dessert-coffee";
    if (includes(["蛋糕", "面包", "吐司", "烘焙", "甜品", "糕饼", "bakery"])) return "dessert-bakery";
  }
  return category;
}

export function matchesFoodSelection(restaurant, selectedValues) {
  if (!selectedValues.size) return true;
  const category = inferRestaurantCategory(restaurant);
  const subcategory = inferSubcategory(restaurant);
  return selectedValues.has(category) || selectedValues.has(subcategory);
}

function getSubcategoryLabel(value) {
  const allOptions = FOOD_GROUPS.flatMap((group) => group.options);
  return allOptions.find((item) => item.value === value)?.label || "";
}

function collectTextFields(restaurant) {
  const name = String(restaurant.name || "").toLowerCase();
  const note = String(restaurant.note || "").toLowerCase();
  const tags = Array.isArray(restaurant.tags) ? restaurant.tags.join(" ").toLowerCase() : "";
  const type = `${restaurant.type || ""} ${restaurant.typecode || ""}`.toLowerCase();
  const category = String(restaurant.category || "").toLowerCase();
  const subcategory = String(restaurant.subcategory || "").toLowerCase();
  return {
    name,
    note,
    tags,
    type,
    category,
    subcategory,
    all: `${name} ${note} ${tags} ${type} ${category} ${subcategory}`.toLowerCase(),
  };
}

function includesAny(text, words) {
  return words.some((word) => text.includes(String(word).toLowerCase()));
}
