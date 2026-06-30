const CATEGORY_DEFINITIONS = [
  { value: "local", label: "中餐地方菜", keywords: ["中餐厅", "浙江菜", "杭帮菜", "台州菜", "地方菜", "私房菜", "农家菜", "本地菜", "土菜", "川菜", "湘菜", "江浙菜"] },
  { value: "hotpot", label: "火锅", keywords: ["火锅店", "火锅", "重庆火锅", "潮汕牛肉火锅", "牛肉火锅", "羊肉火锅", "豆捞", "涮锅"] },
  { value: "bbq", label: "烧烤烤肉", keywords: ["烧烤店", "烧烤", "烤肉", "烤串", "烤鱼", "炭烤", "碳烤", "串串"] },
  { value: "snack", label: "快餐小吃", keywords: ["快餐厅", "快餐", "小吃", "中式快餐", "炸鸡", "便当", "食堂", "汉堡", "包子", "粥"] },
  { value: "noodle", label: "面食米粉", keywords: ["面馆", "拉面", "拌面", "拌川", "米粉", "粉面", "粉丝", "馄饨", "饺子", "麻辣烫", "煎饼", "螺蛳粉"] },
  { value: "seafood", label: "鱼鲜海鲜", keywords: ["海鲜酒楼", "海鲜", "河鲜", "湖鲜", "鱼馆", "鱼府", "渔庄", "小龙虾", "龙虾", "蟹", "黄鱼", "酸菜鱼"] },
  { value: "western", label: "西餐", keywords: ["外国餐厅", "西餐厅", "西餐", "意式", "披萨", "pizza", "bistro", "牛排", "汉堡"] },
  { value: "asian", label: "日韩东南亚", keywords: ["日本料理", "日料", "寿司", "刺身", "居酒屋", "韩国料理", "韩式", "泰国菜", "东南亚", "越南"] },
  { value: "dessert", label: "咖啡茶饮甜品", keywords: ["咖啡厅", "咖啡", "coffee", "cafe", "冷饮店", "饮品店", "奶茶", "茶饮", "果茶", "甜品店", "甜品", "糕饼店", "蛋糕", "面包", "烘焙", "下午茶"] },
  { value: "buffet", label: "自助餐", keywords: ["自助餐厅", "自助餐", "海鲜自助", "烤肉自助", "火锅自助", "自助"] },
];

const CATEGORY_VALUES = new Set(CATEGORY_DEFINITIONS.map((item) => item.value));

const RULES = [
  {
    value: "buffet",
    strongWords: ["自助餐厅", "自助餐"],
    nameWords: ["自助", "buffet"],
  },
  {
    value: "dessert",
    strongWords: ["咖啡厅", "冷饮店", "糕饼店", "甜品店", "茶艺馆", "饮品店"],
    nameWords: [
      "咖啡", "coffee", "cafe", "café", "星巴克", "瑞幸", "luckin", "manner", "m stand", "库迪", "cotti",
      "奶茶", "茶饮", "果茶", "古茗", "喜茶", "奈雪", "茶百道", "霸王茶姬", "一点点", "沪上阿姨",
      "甜品", "蛋糕", "面包", "吐司", "烘焙", "bakery", "好利来", "下午茶", "冰淇淋", "酸奶",
    ],
    textWords: ["珍珠奶茶", "鲜奶茶", "果茶", "现磨咖啡", "美式咖啡", "生日蛋糕", "小蛋糕", "蛋挞", "泡芙", "奶油", "提拉米苏"],
  },
  {
    value: "hotpot",
    strongWords: ["火锅店"],
    nameWords: ["火锅", "豆捞", "涮", "暖锅", "羊蝎子", "羊肉锅", "打边炉", "肉蟹煲"],
  },
  {
    value: "bbq",
    strongWords: ["烧烤店"],
    nameWords: ["烧烤", "烤肉", "烤串", "串串", "烤鱼", "炭烤", "碳烤", "烧鸟", "烤吧"],
  },
  {
    value: "seafood",
    strongWords: ["海鲜酒楼"],
    nameWords: ["海鲜", "小海鲜", "河鲜", "湖鲜", "鱼馆", "鱼府", "鱼味", "鱼庄", "渔庄", "龙虾", "小龙虾", "蟹", "黄鱼", "梭子蟹", "酸菜鱼", "烤鱼"],
  },
  {
    value: "asian",
    strongWords: ["日本料理", "韩国料理"],
    nameWords: ["日料", "日本料理", "寿司", "刺身", "居酒屋", "韩食", "韩国料理", "韩式", "泰国菜", "越南", "东南亚"],
  },
  {
    value: "western",
    strongWords: ["西餐厅", "外国餐厅"],
    nameWords: ["西餐", "意式", "披萨", "比萨", "pizza", "bistro", "牛排", "汉堡", "麦当劳", "肯德基", "萨莉亚", "达美乐"],
  },
  {
    value: "noodle",
    strongWords: ["面馆"],
    nameWords: ["面馆", "蟹黄面", "海鲜面", "黄鱼面", "鱼面", "捞面", "拉面", "拌面", "拌川", "米粉", "米线", "粉面", "粉丝", "馄饨", "饺子", "煎饼", "麻辣烫", "螺蛳粉", "羊肉粉", "牛肉粉", "汤粉", "砂锅粉"],
  },
  {
    value: "snack",
    strongWords: ["快餐厅", "休闲餐饮场所"],
    nameWords: ["小吃", "快餐", "食堂", "便当", "炸鸡", "鸡排", "粥铺", "包子", "早餐", "煲仔饭", "盖浇饭", "饭团", "肉夹馍"],
  },
  {
    value: "local",
    strongWords: ["中餐厅", "浙江菜", "杭帮菜", "台州菜"],
    nameWords: ["杭帮菜", "浙江菜", "浙菜", "台州菜", "本地菜", "土菜", "私房菜", "农家菜", "川菜", "湘菜", "江浙菜", "东北菜", "贵州菜", "徽菜", "云南菜", "北京菜"],
  },
];

function inferCategory(restaurant, preferredCategory = "") {
  const explicitCategory = CATEGORY_VALUES.has(restaurant.category) ? restaurant.category : "";
  const preferred = CATEGORY_VALUES.has(preferredCategory) ? preferredCategory : "";
  const fields = collectTextFields(restaurant);

  for (const rule of RULES) {
    if (includesAny(fields.name, rule.nameWords || [])) return rule.value;
  }

  for (const rule of RULES) {
    if (includesAny(fields.type, rule.strongWords || [])) return rule.value;
  }

  for (const rule of RULES) {
    if (includesAny(fields.all, rule.textWords || [])) return rule.value;
  }

  if (preferred) return preferred;
  if (explicitCategory && explicitCategory !== "local") return explicitCategory;
  return "local";
}

function inferCategories(restaurant, preferredCategory = "") {
  const primary = inferCategory(restaurant, preferredCategory);
  const fields = collectTextFields({ ...restaurant, category: primary });
  const result = [primary];

  for (const rule of RULES) {
    if (rule.value === primary) continue;
    if (
      includesAny(fields.type, rule.strongWords || []) ||
      includesAny(fields.name, rule.nameWords || []) ||
      includesAny(fields.all, rule.textWords || [])
    ) {
      result.push(rule.value);
    }
  }

  if (restaurant.category && CATEGORY_VALUES.has(restaurant.category)) {
    result.push(restaurant.category);
  }
  if (Array.isArray(restaurant.categoryTags)) {
    result.push(...restaurant.categoryTags.filter((item) => CATEGORY_VALUES.has(item)));
  }

  return [...new Set(result.filter((item) => CATEGORY_VALUES.has(item)))];
}

function inferSubcategory(restaurant) {
  const category = inferCategory(restaurant);
  const fields = collectTextFields(restaurant);
  const text = fields.all;
  const has = (words) => words.some((word) => text.includes(word.toLowerCase()));

  if (category === "hotpot") {
    if (has(["潮汕", "鲜切牛肉"])) return "hotpot-chaoshan";
    if (has(["牛肉", "羊肉", "羊蝎子"])) return "hotpot-beef";
    if (has(["川渝", "重庆", "成都", "麻辣"])) return "hotpot-spicy";
  }
  if (category === "bbq") {
    if (has(["烤鱼"])) return "bbq-fish";
    if (has(["烤肉"])) return "bbq-meat";
    if (has(["烤串", "串串", "羊肉串"])) return "bbq-skewer";
  }
  if (category === "local") {
    if (has(["杭帮菜", "浙江菜", "浙菜", "台州菜", "桐庠菜", "建德菜", "临安菜", "江浙菜"])) return "local-zhejiang";
    if (has(["川菜", "湘菜", "川湘", "江西菜"])) return "local-sichuan";
    if (has(["农家菜", "土菜"])) return "local-farm";
  }
  if (category === "asian") {
    if (has(["日本", "日料", "寿司", "刺身"])) return "asian-japanese";
    if (has(["韩国", "韩式", "韩餐"])) return "asian-korean";
    if (has(["泰国", "越南", "东南亚"])) return "asian-southeast";
  }
  if (category === "buffet") {
    if (has(["海鲜"])) return "buffet-seafood";
    if (has(["烤肉"])) return "buffet-bbq";
    if (has(["火锅"])) return "buffet-hotpot";
  }
  if (category === "dessert") {
    if (has(["奶茶", "果茶", "茶饮", "冷饮", "古茗", "喜茶", "奈雪", "茶百道", "霸王茶姬", "一点点", "沪上阿姨"])) return "dessert-tea";
    if (has(["咖啡", "coffee", "cafe", "café", "星巴克", "瑞幸", "luckin", "manner", "库迪", "cotti"])) return "dessert-coffee";
    if (has(["蛋糕", "面包", "吐司", "烘焙", "甜品", "糕饼", "bakery"])) return "dessert-bakery";
  }
  if (category === "noodle") {
    if (has(["米粉", "粉面", "粉丝", "螺蛳粉", "羊肉粉", "牛肉粉", "汤粉"])) return "noodle-rice";
    if (has(["馄饨", "饺子"])) return "noodle-dumpling";
  }
  return category;
}

function collectTextFields(restaurant) {
  const name = String(restaurant.name || "").toLowerCase();
  const note = normalizeListText(restaurant.note || restaurant.tags || "").toLowerCase();
  const tags = normalizeListText(restaurant.tags || "").toLowerCase();
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

function normalizeListText(value) {
  if (Array.isArray(value)) return value.join(" ");
  return String(value || "");
}

module.exports = {
  CATEGORY_DEFINITIONS,
  inferCategory,
  inferCategories,
  inferSubcategory,
};
