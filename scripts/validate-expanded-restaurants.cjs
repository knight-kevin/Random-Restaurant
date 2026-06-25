const fs = require("node:fs");

const core = readJson("restaurants.json");
const additions = readJson("restaurants-quality-additions.json");
const combined = [...core, ...additions];
const errors = [];
const ids = new Set();
const compositeKeys = new Set();

if (core.length !== 1300) errors.push(`基础餐厅应为 1300 家，当前为 ${core.length}`);
if (!additions.length) errors.push("优质增量餐厅为空");

combined.forEach((restaurant, index) => {
  const label = `第 ${index + 1} 条 ${restaurant.name || "未命名"}`;
  const id = restaurant.amapId || restaurant.id;
  if (!id) errors.push(`${label} 缺少 ID`);
  if (ids.has(id)) errors.push(`${label} ID 重复：${id}`);
  ids.add(id);
  if (!restaurant.locationVerified || !restaurant.location) errors.push(`${label} 坐标未校验`);
  if (restaurant.district !== restaurant.amapDistrict) errors.push(`${label} 行政区不一致`);
  if (!restaurant.category || !restaurant.subcategory) errors.push(`${label} 分类不完整`);
  const key = `${normalize(restaurant.name)}|${normalize(restaurant.address)}`;
  if (compositeKeys.has(key)) errors.push(`${label} 店名地址重复`);
  compositeKeys.add(key);
});

additions.forEach((restaurant, index) => {
  if (Number(restaurant.rating) < 4) errors.push(`增量第 ${index + 1} 条评分低于 4.0`);
  if (restaurant.source !== "高德POI好评优选") errors.push(`增量第 ${index + 1} 条来源不正确`);
});

console.log(JSON.stringify({
  core: core.length,
  additions: additions.length,
  combined: combined.length,
  minimumAdditionRating: additions.length ? Math.min(...additions.map((item) => Number(item.rating))) : null,
  verified: combined.filter((item) => item.locationVerified).length,
  errors: errors.slice(0, 50),
  errorCount: errors.length,
}, null, 2));

if (errors.length) process.exit(1);

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, "");
}
