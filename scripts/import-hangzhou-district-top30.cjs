const fs = require("node:fs");

const RESTAURANTS_PATH = "restaurants.json";
const IMPORT_PATH = "hangzhou-district-top30-import.json";
const TARGET_PER_DISTRICT = 30;
const DEFAULT_DATE = "2026-06-23T00:00:00.000Z";
const DISTRICTS = [
  "上城区",
  "拱墅区",
  "西湖区",
  "滨江区",
  "萧山区",
  "余杭区",
  "临平区",
  "钱塘区",
  "富阳区",
  "临安区",
  "桐庐县",
  "淳安县",
  "建德市",
];

if (!fs.existsSync(IMPORT_PATH)) {
  console.error(`Missing ${IMPORT_PATH}. Copy hangzhou-district-top30-import-template.json and fill it first.`);
  printCurrentCoverage();
  process.exit(1);
}

const restaurants = readJson(RESTAURANTS_PATH);
const incoming = readJson(IMPORT_PATH);

if (!Array.isArray(incoming)) {
  console.error(`${IMPORT_PATH} must be a JSON array.`);
  process.exit(1);
}

const normalized = incoming.map((item, index) => normalizeItem(item, index));
const districtCounts = countByDistrict(normalized);
const shortDistricts = DISTRICTS.filter((district) => (districtCounts[district] || 0) < TARGET_PER_DISTRICT);

if (shortDistricts.length) {
  console.warn("Import file does not yet contain 30 restaurants for every district:");
  for (const district of shortDistricts) {
    console.warn(`- ${district}: ${districtCounts[district] || 0}/${TARGET_PER_DISTRICT}`);
  }
}

let added = 0;
let updated = 0;
const merged = [...restaurants];

for (const item of normalized) {
  const existingIndex = merged.findIndex((restaurant) =>
    sameText(restaurant.name, item.name) && sameText(restaurant.address, item.address)
  );

  if (existingIndex >= 0) {
    merged[existingIndex] = { ...merged[existingIndex], ...item, id: merged[existingIndex].id };
    updated += 1;
  } else {
    merged.push(item);
    added += 1;
  }
}

fs.writeFileSync(RESTAURANTS_PATH, JSON.stringify(merged, null, 2), "utf8");
console.log(`Imported Hangzhou district top-30 data. Added ${added}, updated ${updated}, total ${merged.length}.`);
printCoverage(merged);

function normalizeItem(item, index) {
  const name = String(item.name || "").trim();
  if (!name) throw new Error(`Row ${index + 1}: name is required.`);

  const district = normalizeDistrict(item.district);
  if (!DISTRICTS.includes(district)) {
    throw new Error(`Row ${index + 1}: unsupported district "${item.district}".`);
  }

  const rank = Number(item.rank || getDistrictFallbackRank(index));
  return {
    id: item.id || `hz-${slugify(district)}-${String(rank).padStart(3, "0")}-${slugify(name)}`,
    name,
    address: String(item.address || "").trim(),
    note: String(item.note || "").trim(),
    category: String(item.category || "stir").trim(),
    district,
    businessArea: String(item.businessArea || "").trim(),
    source: String(item.source || "公开口碑整理").trim(),
    rank,
    rating: item.rating === undefined || item.rating === "" ? undefined : Number(item.rating),
    createdAt: item.createdAt || DEFAULT_DATE,
  };
}

function printCurrentCoverage() {
  if (!fs.existsSync(RESTAURANTS_PATH)) return;
  printCoverage(readJson(RESTAURANTS_PATH));
}

function printCoverage(items) {
  const counts = countByDistrict(items);
  console.log("Current district coverage:");
  for (const district of DISTRICTS) {
    console.log(`- ${district}: ${counts[district] || 0}/${TARGET_PER_DISTRICT}`);
  }
}

function countByDistrict(items) {
  return items.reduce((counts, item) => {
    const district = normalizeDistrict(item.district);
    counts[district] = (counts[district] || 0) + 1;
    return counts;
  }, {});
}

function normalizeDistrict(value) {
  return String(value || "其他区域").replace(/\s+/g, "");
}

function getDistrictFallbackRank(index) {
  return (index % TARGET_PER_DISTRICT) + 1;
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function sameText(left = "", right = "") {
  return String(left).replace(/\s+/g, "") === String(right).replace(/\s+/g, "");
}

function slugify(text) {
  return String(text)
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
