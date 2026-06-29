const fs = require("node:fs");
const path = require("node:path");
const { inferCategory } = require("./category-rules.cjs");

const root = path.resolve(__dirname, "..");
const citiesPath = path.join(root, "cities.json");
const errors = [];
const globalIds = new Set();
const summary = [];

if (!fs.existsSync(citiesPath)) {
  errors.push("Missing cities.json");
} else {
  const cities = readJson(citiesPath);
  for (const city of cities) validateCity(city);
}

console.log(JSON.stringify({ cities: summary, errors: errors.slice(0, 80), errorCount: errors.length }, null, 2));
if (errors.length) process.exit(1);

function validateCity(city) {
  const indexPath = path.join(root, city.indexPath || "");
  const detailsPath = path.join(root, city.detailsPath || "");
  const reportPath = path.join(root, city.reportPath || "");

  if (!fs.existsSync(indexPath)) errors.push(`${city.name} missing index file ${city.indexPath}`);
  if (!fs.existsSync(detailsPath)) errors.push(`${city.name} missing details file ${city.detailsPath}`);
  if (!fs.existsSync(reportPath)) errors.push(`${city.name} missing quality report ${city.reportPath}`);
  if (!fs.existsSync(indexPath) || !fs.existsSync(detailsPath) || !fs.existsSync(reportPath)) return;

  const index = readJson(indexPath);
  const details = readJson(detailsPath);
  const report = readJson(reportPath);
  const ids = new Set();
  const compositeKeys = new Set();

  if (index.length !== city.restaurantCount) errors.push(`${city.name} city count ${city.restaurantCount} does not match index ${index.length}`);
  if (Object.keys(details).length !== index.length) errors.push(`${city.name} details count ${Object.keys(details).length} does not match index ${index.length}`);
  if (report.selectedCount !== index.length) errors.push(`${city.name} report count ${report.selectedCount} does not match index ${index.length}`);
  if (city.minRestaurants && index.length < city.minRestaurants) errors.push(`${city.name} count below target ${city.minRestaurants}; current ${index.length}`);

  const districtSet = new Set(city.districts || []);
  const districtSeen = new Set();
  for (const restaurant of index) {
    const label = `${city.name} ${restaurant.name || restaurant.id}`;
    const id = restaurant.id || restaurant.amapId;
    if (!id) errors.push(`${label} missing ID`);
    if (ids.has(id)) errors.push(`${label} duplicate city ID ${id}`);
    if (globalIds.has(id)) errors.push(`${label} duplicate cross-city ID ${id}`);
    ids.add(id);
    globalIds.add(id);
    if (restaurant.city !== city.name) errors.push(`${label} has wrong city field`);
    if (restaurant.cityAdcode !== city.adcode) errors.push(`${label} has wrong cityAdcode field`);
    if (Number(restaurant.rating || 0) < Number(city.minRating || 3.5)) errors.push(`${label} rating below ${city.minRating || 3.5}`);
    if (!restaurant.location || !isLocation(restaurant.location)) errors.push(`${label} has invalid location`);
    if (!restaurant.district) errors.push(`${label} missing district`);
    if (districtSet.size && !districtSet.has(restaurant.district)) errors.push(`${label} district is outside ${city.name}: ${restaurant.district}`);
    if (!restaurant.category || !restaurant.subcategory) errors.push(`${label} has incomplete category`);
    if (!details[restaurant.id]) {
      errors.push(`${label} missing details`);
    } else {
      const expectedCategory = inferCategory(details[restaurant.id]);
      if (expectedCategory && restaurant.category !== expectedCategory) {
        errors.push(`${label} obvious category mismatch: expected ${expectedCategory}, got ${restaurant.category}`);
      }
    }
    districtSeen.add(restaurant.district);
    const key = `${normalize(restaurant.name)}|${normalize(details[restaurant.id]?.address || "")}`;
    if (compositeKeys.has(key)) errors.push(`${label} duplicate name/address`);
    compositeKeys.add(key);
  }

  const missingDistricts = [...districtSet].filter((district) => !districtSeen.has(district));
  if (missingDistricts.length) errors.push(`${city.name} missing districts: ${missingDistricts.join(", ")}`);

  summary.push({
    city: city.name,
    adcode: city.adcode,
    count: index.length,
    minimumRating: index.length ? Math.min(...index.map((item) => Number(item.rating))) : null,
    districts: districtSeen.size,
    verifiedDetails: Object.keys(details).length,
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isLocation(value) {
  return /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(String(value));
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, "");
}
