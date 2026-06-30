import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  CATEGORY_TABS,
  inferRestaurantCategories,
  inferRestaurantCategory,
  inferSubcategory as inferBrowserSubcategory,
} from "../scripts/categories.js";

const require = createRequire(import.meta.url);
const { inferCategory, inferCategories, inferSubcategory } = require("../scripts/category-rules.cjs");

const categoryCases = [
  {
    name: "星巴克(台州路桥吾悦广场店)",
    type: "餐饮服务;咖啡厅;星巴克咖啡",
    tags: ["美式咖啡"],
    expectedCategory: "dessert",
    expectedSubcategory: "dessert-coffee",
  },
  {
    name: "古茗(黄岩食品街店)",
    type: "餐饮服务;冷饮店;冷饮店",
    tags: ["珍珠奶茶", "果茶", "现磨咖啡"],
    expectedCategory: "dessert",
    expectedSubcategory: "dessert-tea",
  },
  {
    name: "好利来(临海银泰店)",
    type: "餐饮服务;糕饼店;糕饼店",
    tags: ["生日蛋糕", "芋泥"],
    expectedCategory: "dessert",
    expectedSubcategory: "dessert-bakery",
  },
  {
    name: "临海小海鲜",
    type: "餐饮服务;中餐厅;海鲜酒楼",
    tags: ["小海鲜", "鱼"],
    expectedCategory: "seafood",
    expectedSubcategory: "seafood",
  },
  {
    name: "东坡肉本地菜",
    type: "餐饮服务;中餐厅;浙江菜",
    tags: ["本地菜"],
    expectedCategory: "local",
    expectedSubcategory: "local-zhejiang",
  },
  {
    name: "遵义虾子羊肉粉(滨江店)",
    type: "餐饮服务;休闲餐饮场所;休闲餐饮场所",
    tags: ["羊肉粉"],
    expectedCategory: "noodle",
    expectedSubcategory: "noodle-rice",
  },
];

for (const item of categoryCases) {
  const restaurant = {
    ...item,
    note: item.tags.join(" "),
  };
  assert.equal(inferCategory(restaurant), item.expectedCategory, `${item.name} category`);
  assert.equal(
    inferSubcategory({ ...restaurant, category: item.expectedCategory }),
    item.expectedSubcategory,
    `${item.name} subcategory`,
  );
}

const crabNoodle = {
  name: "苏小蟹·蟹黄面(西湖湖景店)",
  type: "餐饮服务;中餐厅;海鲜酒楼",
  tags: ["蟹黄面"],
  note: "蟹黄面",
};
assert.equal(inferCategory(crabNoodle), "seafood");
assert.ok(inferCategories(crabNoodle).includes("noodle"), "crab noodle should also match noodle");

console.log("category rules smoke test passed");

assert.equal(CATEGORY_TABS[0]?.value, "recommend");
assert.equal(CATEGORY_TABS[0]?.label, "全部");
assert.ok(CATEGORY_TABS.every((tab) => tab.thumb), "top category tabs should include thumbnails");
for (const value of ["local", "hotpot", "bbq", "seafood", "snack", "noodle", "dessert-drink", "dessert-bakery", "asian", "buffet"]) {
  assert.ok(CATEGORY_TABS.some((tab) => tab.value === value), `top category tab missing ${value}`);
}

assert.equal(
  inferRestaurantCategory({
    name: "古茗(黄岩食品街店)",
    type: "餐饮服务;冷饮店;冷饮店",
    note: "珍珠奶茶 果茶 现磨咖啡",
  }),
  "dessert",
);
assert.equal(
  inferBrowserSubcategory({
    name: "好利来(临海银泰店)",
    type: "餐饮服务;糕饼店;糕饼店",
    note: "生日蛋糕 芋泥",
  }),
  "dessert-bakery",
);
assert.ok(inferRestaurantCategories(crabNoodle).includes("noodle"));

console.log("browser category tabs smoke test passed");
