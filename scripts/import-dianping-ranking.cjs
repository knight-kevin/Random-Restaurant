const fs = require("node:fs");

const RESTAURANTS_PATH = "restaurants.json";
const IMPORT_PATH = "dianping-ranking-import.json";
const DEFAULT_DATE = "2026-06-17T00:00:00.000Z";

if (!fs.existsSync(IMPORT_PATH)) {
  console.error(`Missing ${IMPORT_PATH}. Copy dianping-ranking-import-template.json and fill it first.`);
  process.exit(1);
}

const restaurants = JSON.parse(fs.readFileSync(RESTAURANTS_PATH, "utf8"));
const incoming = JSON.parse(fs.readFileSync(IMPORT_PATH, "utf8"));

if (!Array.isArray(incoming)) {
  console.error(`${IMPORT_PATH} must be a JSON array.`);
  process.exit(1);
}

const normalized = incoming.map((item, index) => {
  const name = String(item.name || "").trim();
  if (!name) throw new Error(`Row ${index + 1}: name is required.`);

  const district = String(item.district || "").trim() || "其他区域";
  const rank = Number(item.rank || index + 1);
  const id = item.id || `dianping-${slugify(district)}-${String(rank).padStart(3, "0")}`;

  return {
    id,
    name,
    address: String(item.address || "").trim(),
    note: String(item.note || "").trim(),
    category: String(item.category || "stir").trim(),
    district,
    businessArea: String(item.businessArea || "").trim(),
    source: String(item.source || "大众点评区域榜").trim(),
    rank,
    createdAt: item.createdAt || DEFAULT_DATE,
  };
});

const merged = [...restaurants];
let added = 0;
let updated = 0;

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
console.log(`Imported Dianping ranking data. Added ${added}, updated ${updated}, total ${merged.length}.`);

function sameText(left = "", right = "") {
  return String(left).replace(/\s+/g, "") === String(right).replace(/\s+/g, "");
}

function slugify(text) {
  return String(text)
    .replace(/区|县|市/g, "")
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
