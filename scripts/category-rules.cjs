const CATEGORY_DEFINITIONS = [
  { value: "local", label: "地方菜系", target: 10, keywords: ["杭帮菜", "浙江菜", "中餐", "私房菜", "农家菜", "川菜", "湘菜"] },
  { value: "hotpot", label: "火锅", target: 10, keywords: ["火锅", "重庆火锅", "潮汕牛肉火锅", "羊肉火锅"] },
  { value: "bbq", label: "烧烤烤肉", target: 10, keywords: ["烧烤", "烤肉", "烤串", "烤鱼"] },
  { value: "snack", label: "快餐小吃", target: 10, keywords: ["快餐", "小吃", "中式快餐", "炸鸡", "便当"] },
  { value: "noodle", label: "面食米粉", target: 10, keywords: ["面馆", "米粉", "馄饨", "饺子", "麻辣烫"] },
  { value: "seafood", label: "鱼鲜海鲜", target: 10, keywords: ["海鲜", "河鲜", "鱼馆", "小龙虾", "酸菜鱼"] },
  { value: "western", label: "西餐", target: 10, keywords: ["西餐", "牛排", "披萨", "汉堡"] },
  { value: "asian", label: "日料韩餐", target: 10, keywords: ["日本料理", "寿司", "韩国料理", "东南亚菜"] },
  { value: "dessert", label: "奶茶咖啡", target: 10, keywords: ["咖啡", "奶茶", "甜品", "烘焙", "蛋糕"] },
  { value: "buffet", label: "自助餐", target: 10, keywords: ["自助餐", "海鲜自助", "烤肉自助", "火锅自助"] },
];

function inferCategory(restaurant, preferredCategory = "") {
  if (CATEGORY_DEFINITIONS.some((item) => item.value === restaurant.category)) return restaurant.category;
  const name = String(restaurant.name || "").toLowerCase();
  const note = String(restaurant.note || restaurant.tags || "").toLowerCase();
  const type = String(restaurant.type || "").toLowerCase();
  const text = `${name} ${note} ${type}`;
  const hasName = (words) => words.some((word) => name.includes(word.toLowerCase()));
  const hasText = (words) => words.some((word) => text.includes(word.toLowerCase()));

  if (hasName(["自助", "buffet"]) || hasText(["自助餐"])) return "buffet";
  if (hasName(["日料", "日本料理", "寿司", "割烹", "居酒屋", "韩食", "韩国料理", "泰国菜", "东南亚"])) return "asian";
  if (hasName(["西餐", "意式", "披萨", "pizza", "bistro", "牛排", "汉堡", "麦当劳", "肯德基", "萨莉亚"])) return "western";
  if (hasName(["火锅", "豆捞", "涮", "暖锅", "羊蝎子", "羊肉炉", "打边炉", "肉蟹煲"])) return "hotpot";
  if (hasName(["烧烤", "烤肉", "烤串", "串串", "烤鱼", "炭烤", "碳烤"])) return "bbq";
  if (hasName(["咖啡", "coffee", "奶茶", "茶饮", "甜品", "烘焙", "蛋糕", "下午茶"])) return "dessert";
  if (hasName(["海鲜", "河鲜", "湖鲜", "鱼馆", "鱼宴", "鱼味", "鱼府", "渔庄", "龙虾"])) return "seafood";
  if (hasName(["面馆", "拉面", "拌面", "米粉", "馄饨", "饺子", "煎饺", "麻辣烫"])) return "noodle";
  if (hasName(["小吃", "快餐", "食堂", "便当", "炸鸡", "鸡排"])) return "snack";
  if (preferredCategory && CATEGORY_DEFINITIONS.some((item) => item.value === preferredCategory)) return preferredCategory;
  if (hasText(["寿司", "刺身", "韩式料理"])) return "asian";
  if (hasText(["意面", "披萨", "汉堡"]) && hasText(["牛排", "沙拉", "薯条", "芝士"])) return "western";
  return "local";
}

function inferSubcategory(restaurant) {
  const category = restaurant.category || inferCategory(restaurant);
  const text = `${restaurant.name || ""} ${restaurant.note || ""} ${restaurant.tags || ""}`.toLowerCase();
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
    if (has(["杭帮菜", "浙江菜", "浙菜", "桐庐菜", "建德菜", "临安菜"])) return "local-zhejiang";
    if (has(["川菜", "湘菜", "川湘", "江西菜"])) return "local-sichuan";
    if (has(["农家菜", "土菜"])) return "local-farm";
  }
  if (category === "asian") {
    if (has(["日本", "日料", "寿司", "割烹"])) return "asian-japanese";
    if (has(["韩国", "韩式", "韩餐"])) return "asian-korean";
    if (has(["泰国", "越南", "东南亚"])) return "asian-southeast";
  }
  if (category === "buffet") {
    if (has(["海鲜"])) return "buffet-seafood";
    if (has(["烤肉"])) return "buffet-bbq";
    if (has(["火锅"])) return "buffet-hotpot";
  }
  if (category === "dessert") {
    if (has(["咖啡", "coffee"])) return "dessert-coffee";
    if (has(["奶茶", "果茶", "茶饮"])) return "dessert-tea";
    if (has(["蛋糕", "面包", "烘焙", "甜品"])) return "dessert-bakery";
  }
  return category;
}

module.exports = { CATEGORY_DEFINITIONS, inferCategory, inferSubcategory };
