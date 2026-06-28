const fs = require("node:fs");
const restaurants = JSON.parse(fs.readFileSync("restaurants.json", "utf8"));
const expectedDistricts = ["上城区", "拱墅区", "西湖区", "滨江区", "萧山区", "余杭区", "临平区", "钱塘区", "富阳区", "临安区", "桐庐县", "淳安县", "建德市"];
const districtCounts = countBy(restaurants, "district");
const categoryCounts = countBy(restaurants, "category");
const errors = [];

if (restaurants.length !== 1300) errors.push(`总数应为 1300，当前为 ${restaurants.length}`);
for (const district of expectedDistricts) {
  if (districtCounts[district] !== 100) errors.push(`${district} 应为 100 家，当前为 ${districtCounts[district] || 0}`);
}
restaurants.forEach((restaurant, index) => {
  if (!restaurant.locationVerified || !restaurant.location) errors.push(`第 ${index + 1} 条坐标未校验`);
  if (restaurant.district !== restaurant.amapDistrict) errors.push(`第 ${index + 1} 条行政区不一致`);
  if (!restaurant.category || !restaurant.subcategory) errors.push(`第 ${index + 1} 条分类不完整`);
});

console.log(JSON.stringify({
  total: restaurants.length,
  districtCounts,
  categoryCounts,
  verified: restaurants.filter((item) => item.locationVerified).length,
  rated: restaurants.filter((item) => item.rating > 0).length,
  errors: errors.slice(0, 30),
}, null, 2));
if (errors.length) process.exit(1);

function countBy(items, field) {
  return items.reduce((result, item) => {
    result[item[field]] = (result[item[field]] || 0) + 1;
    return result;
  }, {});
}
