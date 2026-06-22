const fs = require("node:fs");

const path = "restaurants.json";
const restaurants = JSON.parse(fs.readFileSync(path, "utf8"));

const districts = [
  ["西湖区", ["象山", "小和山", "屏峰", "转塘", "龙坞", "袁浦", "之江", "西溪", "留下", "石马", "西文", "高教园", "奥莱金街", "星光荟", "七贤山居"]],
  ["拱墅区", ["大关", "上塘", "香积寺", "胜利河", "河东路", "新天地", "海外海", "乐堤港", "中大银泰", "大关大润发", "上塘路", "香积寺路"]],
  ["萧山区", ["萧山", "西子丁兰"]],
  ["余杭区", ["良渚", "海创园", "永旺", "永旺梦乐城", "西溪印象城"]],
  ["钱塘区", ["下沙", "金沙湖", "文海南路", "下沙江滨"]],
  ["上城区", ["景芳", "新塘路", "九堡", "信义坊", "丁兰"]],
  ["滨江区", ["滨江", "西兴", "长河", "浦沿"]],
  ["临平区", ["临平", "乔司"]],
  ["富阳区", ["富阳"]],
];

const categories = [
  ["bbq", ["烧烤", "烤", "串", "生蚝"]],
  ["hotpot", ["火锅", "涮", "羊蝎子", "锅"]],
  ["noodle", ["面", "粉", "拌川", "麻辣烫"]],
  ["seafood", ["海鲜", "小龙虾", "龙虾", "虾", "蟹", "鱼"]],
  ["beef", ["牛", "羊"]],
  ["fast", ["肯德基", "麦当劳", "必胜客", "汉堡王", "汉堡", "披萨"]],
  ["stir", ["小炒", "炒", "菜馆", "饭店", "私房菜", "下饭菜"]],
];

const businessAreas = [
  "象山国际",
  "奥莱金街",
  "金街美地",
  "胜利河美食街",
  "新天地",
  "良渚",
  "大关",
  "屏峰",
  "西文街",
  "信义坊",
  "星光荟",
  "海创园",
  "剑桥公社",
  "永旺梦乐城",
];

function pickMatch(rules, text, fallback) {
  return (rules.find(([, keywords]) => keywords.some((keyword) => text.includes(keyword))) || [fallback])[0];
}

const enriched = restaurants.map((restaurant) => {
  const text = `${restaurant.name || ""} ${restaurant.note || ""} ${restaurant.address || ""}`;
  const address = restaurant.address || "";

  return {
    ...restaurant,
    category: pickMatch(categories, text, "stir"),
    district: pickMatch(districts, `${address} ${restaurant.name || ""}`, "其他区域"),
    businessArea: businessAreas.find((area) => address.includes(area)) || address,
    source: "原始99家清单",
  };
});

fs.writeFileSync(path, JSON.stringify(enriched, null, 2), "utf8");
console.log(`Enriched ${enriched.length} restaurants.`);
