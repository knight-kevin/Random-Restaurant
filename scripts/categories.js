const CATEGORY_THUMBS = {
  recommend: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=120&q=70",
  local: "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=120&q=70",
  hotpot: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?auto=format&fit=crop&w=120&q=70",
  bbq: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=120&q=70",
  seafood: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=120&q=70",
  snack: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=120&q=70",
  noodle: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=120&q=70",
  dessert: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=120&q=70",
  bakery: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=120&q=70",
  asian: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=120&q=70",
  buffet: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=120&q=70",
};

export const CATEGORY_TABS = [
  { value: "recommend", label: "全部", categories: [], thumb: CATEGORY_THUMBS.recommend },
  { value: "local", label: "中餐", categories: ["local"], thumb: CATEGORY_THUMBS.local },
  { value: "hotpot", label: "火锅", categories: ["hotpot"], thumb: CATEGORY_THUMBS.hotpot },
  { value: "bbq", label: "烧烤烤肉", categories: ["bbq"], thumb: CATEGORY_THUMBS.bbq },
  { value: "seafood", label: "鱼鲜海鲜", categories: ["seafood"], thumb: CATEGORY_THUMBS.seafood },
  { value: "snack", label: "快餐小吃", categories: ["snack"], thumb: CATEGORY_THUMBS.snack },
  { value: "noodle", label: "面食米粉", categories: ["noodle"], thumb: CATEGORY_THUMBS.noodle },
  { value: "dessert-drink", label: "咖啡茶饮", categories: ["dessert-coffee", "dessert-tea"], thumb: CATEGORY_THUMBS.dessert },
  { value: "dessert-bakery", label: "甜品烘焙", categories: ["dessert-bakery"], thumb: CATEGORY_THUMBS.bakery },
  { value: "asian", label: "日韩西餐", categories: ["asian", "western"], thumb: CATEGORY_THUMBS.asian },
  { value: "buffet", label: "自助餐", categories: ["buffet"], thumb: CATEGORY_THUMBS.buffet },
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
    value: "snack",
    label: "小吃快餐",
    options: [
      { value: "snack", label: "快餐小吃" },
      { value: "noodle", label: "面食米粉" },
      { value: "noodle-rice", label: "米粉粉面" },
      { value: "noodle-dumpling", label: "馄饨饺子" },
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
    label: "水产海鲜",
    options: [
      { value: "seafood", label: "全部鱼鲜海鲜" },
      { value: "buffet-seafood", label: "海鲜自助" },
    ],
  },
  {
    value: "dessert",
    label: "奶茶茶饮",
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

const CATEGORY_VALUES = new Set(Object.keys(CATEGORY_LABELS));

const RULES = [
  { value: "buffet", strong: ["自助餐厅", "自助餐"], name: ["自助", "buffet"] },
  {
    value: "dessert",
    strong: ["咖啡厅", "冷饮店", "糕饼店", "甜品店", "茶艺馆", "饮品店"],
    name: ["咖啡", "coffee", "cafe", "café", "星巴克", "瑞幸", "luckin", "manner", "库迪", "cotti", "奶茶", "茶饮", "果茶", "古茗", "喜茶", "奈雪", "茶百道", "霸王茶姬", "一点点", "沪上阿姨", "甜品", "蛋糕", "面包", "吐司", "烘焙", "bakery", "好利来", "下午茶", "冰淇淋", "酸奶"],
    text: ["珍珠奶茶", "鲜奶茶", "果茶", "现磨咖啡", "美式咖啡", "生日蛋糕", "小蛋糕", "蛋挞", "泡芙", "奶油", "提拉米苏"],
  },
  { value: "hotpot", strong: ["火锅店"], name: ["火锅", "豆捞", "涮", "暖锅", "羊蝎子", "羊肉锅", "打边炉", "肉蟹煲"] },
  { value: "bbq", strong: ["烧烤店"], name: ["烧烤", "烤肉", "烤串", "串串", "烤鱼", "炭烤", "碳烤", "烧鸟", "烤吧"] },
  { value: "seafood", strong: ["海鲜酒楼"], name: ["海鲜", "小海鲜", "河鲜", "湖鲜", "鱼馆", "鱼府", "鱼味", "鱼庄", "渔庄", "龙虾", "小龙虾", "蟹", "黄鱼", "梭子蟹", "酸菜鱼", "烤鱼"] },
  { value: "asian", strong: ["日本料理", "韩国料理"], name: ["日料", "日本料理", "寿司", "刺身", "居酒屋", "韩食", "韩国料理", "韩式", "泰国菜", "越南", "东南亚"] },
  { value: "western", strong: ["西餐厅", "外国餐厅"], name: ["西餐", "意式", "披萨", "比萨", "pizza", "bistro", "牛排", "汉堡", "麦当劳", "肯德基", "萨莉亚", "达美乐"] },
  { value: "noodle", strong: ["面馆"], name: ["面馆", "蟹黄面", "海鲜面", "黄鱼面", "鱼面", "捞面", "拉面", "拌面", "拌川", "米粉", "米线", "粉面", "粉丝", "馄饨", "饺子", "煎饼", "麻辣烫", "螺蛳粉", "羊肉粉", "牛肉粉", "汤粉", "砂锅粉"] },
  { value: "snack", strong: ["快餐厅", "休闲餐饮场所"], name: ["小吃", "快餐", "食堂", "便当", "炸鸡", "鸡排", "粥铺", "包子", "早餐", "煲仔饭", "盖浇饭", "饭团", "肉夹馍"] },
  { value: "local", strong: ["中餐厅", "浙江菜", "杭帮菜", "台州菜"], name: ["杭帮菜", "浙江菜", "浙菜", "台州菜", "本地菜", "土菜", "私房菜", "农家菜", "川菜", "湘菜", "江浙菜", "东北菜", "贵州菜", "徽菜", "云南菜", "北京菜"] },
];

export function getCategoryLabel(value) {
  return CATEGORY_LABELS[value] || getSubcategoryLabel(value) || "中餐地方菜";
}

export function inferRestaurantCategory(restaurant) {
  const explicit = CATEGORY_LABELS[restaurant.category] ? restaurant.category : "";
  const fields = collectTextFields(restaurant);

  for (const rule of RULES) {
    if (includesAny(fields.name, rule.name || [])) return rule.value;
  }
  for (const rule of RULES) {
    if (includesAny(fields.type, rule.strong || [])) return rule.value;
  }
  for (const rule of RULES) {
    if (includesAny(fields.all, rule.text || [])) return rule.value;
  }
  return explicit && explicit !== "local" ? explicit : "local";
}

export function inferRestaurantCategories(restaurant) {
  const primary = inferRestaurantCategory(restaurant);
  const fields = collectTextFields({ ...restaurant, category: primary });
  const categories = [primary];

  for (const rule of RULES) {
    if (rule.value === primary) continue;
    if (
      includesAny(fields.type, rule.strong || []) ||
      includesAny(fields.name, rule.name || []) ||
      includesAny(fields.all, rule.text || [])
    ) {
      categories.push(rule.value);
    }
  }
  if (Array.isArray(restaurant.categoryTags)) {
    categories.push(...restaurant.categoryTags.filter((item) => CATEGORY_VALUES.has(item)));
  }
  return [...new Set(categories.filter((item) => CATEGORY_VALUES.has(item)))];
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
    if (includes(["杭帮菜", "浙江菜", "浙菜", "台州菜", "桐庠菜", "建德菜", "临安菜", "江浙菜"])) return "local-zhejiang";
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
    if (includes(["奶茶", "果茶", "茶饮", "冷饮", "古茗", "喜茶", "奈雪", "茶百道", "霸王茶姬", "一点点", "沪上阿姨"])) return "dessert-tea";
    if (includes(["咖啡", "coffee", "cafe", "café", "星巴克", "瑞幸", "luckin", "manner", "库迪", "cotti"])) return "dessert-coffee";
    if (includes(["蛋糕", "面包", "吐司", "烘焙", "甜品", "糕饼", "bakery"])) return "dessert-bakery";
  }
  if (category === "noodle") {
    if (includes(["米粉", "粉面", "粉丝", "螺蛳粉", "羊肉粉", "牛肉粉", "汤粉"])) return "noodle-rice";
    if (includes(["馄饨", "饺子"])) return "noodle-dumpling";
  }
  return category;
}

export function matchesFoodSelection(restaurant, selectedValues) {
  if (!selectedValues.size) return true;
  const categories = inferRestaurantCategories(restaurant);
  const subcategory = inferSubcategory(restaurant);
  return categories.some((category) => selectedValues.has(category)) || selectedValues.has(subcategory);
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
