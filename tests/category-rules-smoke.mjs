import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  CATEGORY_TABS,
  inferRestaurantCategory,
  inferSubcategory as inferBrowserSubcategory,
} from "../scripts/categories.js";

const require = createRequire(import.meta.url);
const { inferCategory, inferSubcategory } = require("../scripts/category-rules.cjs");

const categoryCases = [
  {
    name: "星巴克(台州路桥吾悦广场店)",
    type: "餐饮服务;咖啡厅;星巴克咖啡",
    tags: ["三明治"],
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
    name: "麦野云窑窑烤面包",
    type: "餐饮服务;餐饮相关场所;餐饮相关",
    tags: [],
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

console.log("category rules smoke test passed");

assert.equal(CATEGORY_TABS[0]?.value, "recommend");
assert.equal(CATEGORY_TABS[0]?.label, "全部");
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

console.log("browser category tabs smoke test passed");
