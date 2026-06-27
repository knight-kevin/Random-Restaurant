const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=520&q=82";

const IMAGE_POOLS = {
  dessert: [
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=520&q=82",
  ],
  hotpot: [
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=520&q=82",
  ],
  bbq: [
    "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=520&q=82",
  ],
  noodle: [
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=520&q=82",
  ],
  seafood: [
    "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=520&q=82",
  ],
  western: [
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=520&q=82",
  ],
  asian: [
    "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=520&q=82",
  ],
  snack: [
    "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=520&q=82",
  ],
  buffet: [
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=520&q=82",
  ],
  local: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=520&q=82",
    "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=520&q=82",
  ],
};

const KEYWORD_RULES = [
  { category: "dessert", words: ["咖啡", "coffee", "cafe", "café", "星巴克", "瑞幸", "manner", "m stand", "奶茶", "茶饮", "甜品", "蛋糕", "烘焙"] },
  { category: "hotpot", words: ["火锅", "涮", "羊蝎子", "牛肉火锅", "打边炉", "暖锅"] },
  { category: "bbq", words: ["烧烤", "烤肉", "烤串", "串串", "炭烤", "烤鱼"] },
  { category: "noodle", words: ["面馆", "拉面", "拌面", "拌川", "米粉", "粉面", "馄饨", "饺子"] },
  { category: "seafood", words: ["海鲜", "河鲜", "湖鲜", "鱼庄", "鱼馆", "虾", "蟹", "小龙虾"] },
  { category: "asian", words: ["日料", "寿司", "刺身", "居酒屋", "韩国", "韩式", "泰国", "越南", "东南亚"] },
  { category: "western", words: ["西餐", "披萨", "pizza", "牛排", "汉堡", "bistro", "意式"] },
  { category: "buffet", words: ["自助", "buffet"] },
  { category: "snack", words: ["小吃", "快餐", "食堂", "便当", "炸鸡", "鸡排"] },
];

export function getRestaurantImageCategory(restaurant, inferCategory, categoryLabels) {
  const text = `${restaurant.name || ""} ${restaurant.subcategory || ""} ${restaurant.category || ""} ${restaurant.note || ""}`.toLowerCase();
  const keywordMatch = KEYWORD_RULES.find((rule) => rule.words.some((word) => text.includes(word.toLowerCase())));
  if (keywordMatch) return keywordMatch.category;
  const category = restaurant.category || inferCategory(restaurant);
  return Object.prototype.hasOwnProperty.call(categoryLabels, category) ? category : "local";
}

export function getCategoryRestaurantImage(restaurant, inferCategory, categoryLabels) {
  const imageCategory = getRestaurantImageCategory(restaurant, inferCategory, categoryLabels);
  const pool = IMAGE_POOLS[imageCategory] || IMAGE_POOLS.local;
  return pool[getStableIndex(restaurant.id || restaurant.name, pool.length)] || FALLBACK_IMAGE;
}

export function getImageMatchReport(restaurants, inferCategory, categoryLabels, sampleSize = 10) {
  const groups = {};
  restaurants.forEach((restaurant) => {
    const category = getRestaurantImageCategory(restaurant, inferCategory, categoryLabels);
    if (!groups[category]) groups[category] = [];
    if (groups[category].length < sampleSize) {
      groups[category].push({
        id: restaurant.id,
        name: restaurant.name,
        category: restaurant.category || inferCategory(restaurant),
        imageCategory: category,
        image: getCategoryRestaurantImage(restaurant, inferCategory, categoryLabels),
      });
    }
  });
  return groups;
}

function getStableIndex(value, length) {
  const text = String(value || "");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return length ? hash % length : 0;
}
