const fs = require("node:fs");

const paths = ["restaurants.json", "hangzhou-district-top30-import.json"];

for (const path of paths) {
  if (!fs.existsSync(path)) continue;
  const restaurants = JSON.parse(fs.readFileSync(path, "utf8"));
  const updated = restaurants.map((restaurant) => ({
    ...restaurant,
    category: inferCategory(restaurant),
  }));
  fs.writeFileSync(path, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
  console.log(`${path}: reclassified ${updated.length} restaurants`);
  console.log(countByCategory(updated));
}

function inferCategory(restaurant) {
  const name = String(restaurant.name || "").toLowerCase();
  const note = String(restaurant.note || "").toLowerCase();
  const hasName = (keywords) => keywords.some((keyword) => name.includes(keyword.toLowerCase()));
  const hasNote = (keywords) => keywords.some((keyword) => note.includes(keyword.toLowerCase()));

  if (hasName(["自助", "buffet"]) || hasNote(["自助餐"])) return "buffet";
  if (hasName(["日料", "日本料理", "日式料理", "寿司", "割烹", "居酒屋", "韩食", "韩国料理", "韩式料理"])) return "asian";
  if (hasName(["西餐", "意式", "披萨", "pizza", "bistro", "steak", "牛排", "汉堡", "麦当劳", "肯德基", "必胜客", "萨莉亚", "commune", "pub"])) return "western";
  if (hasName(["火锅", "豆捞", "涮", "暖锅", "羊蝎子", "羊肉炉", "打边炉", "肉蟹煲", "鸡公煲"])) return "hotpot";
  if (hasName(["烧烤", "烤肉", "烤串", "串串", "烤鱼", "烤羊", "炭烤", "碳烤"])) return "bbq";
  if (hasName(["咖啡", "coffee", "甜品", "烘焙", "蛋糕", "茶饮", "下午茶", "酒馆"])) return "dessert";
  if (hasName(["海鲜", "河鲜", "湖鲜", "鱼馆", "鱼宴", "鱼味", "鱼府", "渔庄", "渔村", "龙虾", "虾馆", "蟹馆"])) return "seafood";
  if (hasName(["牛肉馆", "牛肉汤", "羊肉馆", "羊肉汤", "清真", "西域", "新疆"])) return "beef";
  if (hasName(["面馆", "拉面", "拌面", "米粉", "粉店", "馄饨", "饺子", "煎饺", "麻辣烫", "小吃"])) return "noodle";
  if (hasNote(["寿司", "刺身", "日式料理", "韩国料理"])) return "asian";
  if (hasNote(["意面", "披萨", "pizza", "汉堡"]) && hasNote(["牛排", "沙拉", "薯条", "芝士"])) return "western";
  const fishMentions = (note.match(/鱼头|海鲜|河鲜|湖鲜|龙虾|螃蟹|鲜鱼/g) || []).length;
  if (fishMentions >= 3) return "seafood";
  return "stir";
}

function countByCategory(restaurants) {
  return restaurants.reduce((counts, restaurant) => {
    counts[restaurant.category] = (counts[restaurant.category] || 0) + 1;
    return counts;
  }, {});
}
