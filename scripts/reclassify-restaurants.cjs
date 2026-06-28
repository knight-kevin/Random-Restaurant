const fs = require("node:fs");
const { inferCategory, inferSubcategory } = require("./category-rules.cjs");

const paths = [
  "restaurants.json",
  "hangzhou-district-top100-import.json",
  "hangzhou-district-top30-import.json",
];

for (const path of paths) {
  if (!fs.existsSync(path)) continue;
  const restaurants = JSON.parse(fs.readFileSync(path, "utf8"));
  const updated = restaurants.map((restaurant) => {
    const category = inferCategory(restaurant);
    return {
      ...restaurant,
      category,
      categoryGroup: category,
      subcategory: inferSubcategory({ ...restaurant, category }),
      businessArea: normalizeBusinessArea(restaurant.businessArea),
      averageCost: getAverageCost(restaurant),
      latitude: getCoordinate(restaurant.location, 1),
      longitude: getCoordinate(restaurant.location, 0),
    };
  });
  fs.writeFileSync(path, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
  console.log(`${path}: reclassified ${updated.length} restaurants`);
  console.log(countByCategory(updated));
}

function getAverageCost(restaurant) {
  if (Number.isFinite(Number(restaurant.averageCost))) return Number(restaurant.averageCost);
  const match = String(restaurant.note || "").match(/人均[：:]\s*([\d.]+)/);
  return match ? Number(match[1]) : null;
}

function getCoordinate(location, index) {
  const value = Number(String(location || "").split(",")[index]);
  return Number.isFinite(value) ? value : null;
}

function normalizeBusinessArea(value) {
  if (Array.isArray(value)) return value.find((item) => typeof item === "string") || "";
  return typeof value === "string" ? value : "";
}

function countByCategory(restaurants) {
  return restaurants.reduce((counts, restaurant) => {
    counts[restaurant.category] = (counts[restaurant.category] || 0) + 1;
    return counts;
  }, {});
}
