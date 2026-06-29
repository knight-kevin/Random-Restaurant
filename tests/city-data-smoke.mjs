import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const requiredCities = [
  ["330100", "\u676d\u5dde\u5e02", 3273],
  ["331000", "\u53f0\u5dde\u5e02", 1001],
];

const cities = readJson("cities.json", []);
const updateManifest = readJson("data/update-manifest.json", null);

if (!Array.isArray(cities) || cities.length === 0) {
  errors.push("cities.json missing or empty");
}

if (!updateManifest) {
  errors.push("data/update-manifest.json missing");
}

for (const [adcode, cityName, minimumCount] of requiredCities) {
  const city = cities.find((item) => item.adcode === adcode);
  if (!city) {
    errors.push(`${cityName} (${adcode}) missing from cities.json`);
    continue;
  }

  const index = readJson(city.indexPath, null);
  const details = readJson(city.detailsPath, null);
  const report = readJson(city.reportPath, null);
  const manifestCity = updateManifest?.cities?.find((item) => item.adcode === adcode);

  if (!index) errors.push(`${cityName} index missing: ${city.indexPath}`);
  if (!details) errors.push(`${cityName} details missing: ${city.detailsPath}`);
  if (!report) errors.push(`${cityName} report missing: ${city.reportPath}`);
  if (!manifestCity) errors.push(`${cityName} missing from update manifest`);
  if (!index || !details) continue;

  if (index.length < minimumCount) {
    errors.push(`${cityName} should have at least ${minimumCount} restaurants, got ${index.length}`);
  }
  if (Object.keys(details).length !== index.length) {
    errors.push(`${cityName} details count mismatch`);
  }
  if (city.restaurantCount !== index.length) {
    errors.push(`${cityName} cities.json count mismatch`);
  }
  if (report?.selectedCount !== index.length) {
    errors.push(`${cityName} report count mismatch`);
  }
  if (manifestCity && manifestCity.restaurantCount !== index.length) {
    errors.push(`${cityName} update manifest count mismatch`);
  }
  if (manifestCity && manifestCity.minRating !== city.minRating) {
    errors.push(`${cityName} update manifest minRating mismatch`);
  }
  if (manifestCity && manifestCity.reportPath !== city.reportPath) {
    errors.push(`${cityName} update manifest report path mismatch`);
  }

  const ids = new Set();
  const districtSet = new Set(city.districts || []);
  const districtSeen = new Set();
  for (const restaurant of index) {
    if (ids.has(restaurant.id)) errors.push(`${cityName} duplicate id ${restaurant.id}`);
    ids.add(restaurant.id);
    districtSeen.add(restaurant.district);
    if (restaurant.city !== cityName) errors.push(`${cityName} item ${restaurant.id} has city ${restaurant.city}`);
    if (restaurant.cityAdcode !== adcode) errors.push(`${cityName} item ${restaurant.id} has cityAdcode ${restaurant.cityAdcode}`);
    if (Number(restaurant.rating || 0) < 4) errors.push(`${cityName} item ${restaurant.id} rating below 4.0`);
    if (!/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(String(restaurant.location || ""))) {
      errors.push(`${cityName} item ${restaurant.id} invalid location`);
    }
    if (!restaurant.category || !restaurant.district) {
      errors.push(`${cityName} item ${restaurant.id} missing category or district`);
    }
    if (districtSet.size && !districtSet.has(restaurant.district)) {
      errors.push(`${cityName} item ${restaurant.id} district out of scope`);
    }
    if (!details[restaurant.id]) errors.push(`${cityName} details missing for ${restaurant.id}`);
  }

  const missingDistricts = [...districtSet].filter((district) => !districtSeen.has(district));
  if (missingDistricts.length) errors.push(`${cityName} missing districts: ${missingDistricts.join(", ")}`);
}

console.log(JSON.stringify({ errors: errors.slice(0, 80), errorCount: errors.length }, null, 2));
if (errors.length) process.exit(1);

function readJson(relativePath, fallback) {
  try {
    const fullPath = path.join(root, relativePath || "");
    return fs.existsSync(fullPath) ? JSON.parse(fs.readFileSync(fullPath, "utf8")) : fallback;
  } catch (error) {
    errors.push(`${relativePath} invalid JSON: ${error.message}`);
    return fallback;
  }
}
