const fs = require("node:fs");
const https = require("node:https");
const { CATEGORY_DEFINITIONS, inferCategory, inferSubcategory } = require("./category-rules.cjs");

const AMAP_KEY = process.env.AMAP_KEY;
const RESTAURANTS_PATH = "restaurants.json";
const OUTPUT_PATH = "hangzhou-district-top100-import.json";
const REPORT_PATH = "hangzhou-district-top100-report.json";
const BACKUP_PATH = "restaurants-before-1300-backup.json";
const TARGET_PER_DISTRICT = 100;
const MAX_PER_BRAND_PER_DISTRICT = 3;
const MIN_PER_CATEGORY = 6;
const MAX_PER_CATEGORY = 16;
const DEFAULT_DATE = "2026-06-24T00:00:00.000Z";
const AMAP_ENDPOINT = "https://restapi.amap.com/v3/place/text";
const CACHE_PATH = ".amap-poi-cache.json";
const DISTRICTS = ["上城区", "拱墅区", "西湖区", "滨江区", "萧山区", "余杭区", "临平区", "钱塘区", "富阳区", "临安区", "桐庐县", "淳安县", "建德市"];
const apiCache = readJsonFile(CACHE_PATH, {});

if (!AMAP_KEY) {
  console.error("Missing AMAP_KEY. Set it only for this command, then run this script.");
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const all = [];
  const report = { generatedAt: new Date().toISOString(), targetPerDistrict: TARGET_PER_DISTRICT, districts: {} };
  const seed = readSeedRestaurants();

  for (const district of DISTRICTS) {
    const pools = new Map(CATEGORY_DEFINITIONS.map((definition) => [definition.value, new Map()]));
    addSeedRestaurants(pools, seed.filter((restaurant) => restaurant.district === district));
    for (const definition of CATEGORY_DEFINITIONS) {
      await collectCategoryCandidates(district, definition, pools.get(definition.value));
    }
    await collectFallbackCandidates(district, pools);
    const selected = selectBalancedRestaurants(pools, TARGET_PER_DISTRICT)
      .map((restaurant, index) => ({ ...restaurant, rank: index + 1 }));
    if (selected.length < TARGET_PER_DISTRICT) {
      throw new Error(`${district} only has ${selected.length}/${TARGET_PER_DISTRICT} verified unique restaurants`);
    }
    all.push(...selected);
    report.districts[district] = summarizeDistrict(selected, pools);
    fs.writeFileSync(`${OUTPUT_PATH}.partial`, `${JSON.stringify(all, null, 2)}\n`, "utf8");
    fs.writeFileSync(`${REPORT_PATH}.partial`, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`${district}: ${selected.length}`, report.districts[district].selectedByCategory);
  }

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(all, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  if (fs.existsSync(RESTAURANTS_PATH) && !fs.existsSync(BACKUP_PATH)) fs.copyFileSync(RESTAURANTS_PATH, BACKUP_PATH);
  fs.writeFileSync(RESTAURANTS_PATH, `${JSON.stringify(all, null, 2)}\n`, "utf8");
  console.log(`Wrote ${all.length} restaurants and validation report.`);
}

function readSeedRestaurants() {
  if (!fs.existsSync(RESTAURANTS_PATH)) return [];
  return JSON.parse(fs.readFileSync(RESTAURANTS_PATH, "utf8"));
}

function addSeedRestaurants(pools, restaurants) {
  restaurants.forEach((restaurant) => {
    const category = inferCategory(restaurant);
    const normalized = {
      ...restaurant,
      category,
      categoryGroup: category,
      subcategory: inferSubcategory({ ...restaurant, category }),
      averageCost: getAverageCost(restaurant),
      latitude: getCoordinate(restaurant.location, 1),
      longitude: getCoordinate(restaurant.location, 0),
    };
    if (normalized.locationVerified && normalized.location) pools.get(category)?.set(getPoiKey(normalized), normalized);
  });
}

async function collectCategoryCandidates(district, definition, pool) {
  for (const keyword of definition.keywords) {
    for (let page = 1; page <= 3; page += 1) {
      addPoisToPool(await searchPoi(district, keyword, page), district, definition.value, pool);
      if (pool.size >= definition.target * 3) return;
      await sleep(260);
    }
  }
}

async function collectFallbackCandidates(district, pools) {
  for (const keyword of ["餐厅", "美食", "饭店", "小吃"]) {
    for (let page = 1; page <= 4; page += 1) {
      const pois = await searchPoi(district, keyword, page);
      for (const poi of pois) {
        const item = normalizePoi(poi, district);
        if (item.locationVerified) pools.get(item.category)?.set(getPoiKey(item), item);
      }
      if (getUniqueCandidateCount(pools) >= TARGET_PER_DISTRICT * 2) return;
      await sleep(260);
    }
  }
}

function addPoisToPool(pois, district, preferredCategory, pool) {
  for (const poi of pois) {
    const item = normalizePoi(poi, district, preferredCategory);
    if (item.locationVerified && item.category === preferredCategory) pool.set(getPoiKey(item), item);
  }
}

function selectBalancedRestaurants(pools, target) {
  const selected = [];
  const used = new Set();
  const brandCounts = new Map();
  const categoryCounts = new Map();
  const sortedPools = new Map([...pools].map(([category, map]) => [category, [...map.values()].sort(compareRestaurantQuality)]));
  for (const definition of CATEGORY_DEFINITIONS) {
    takeFromPool(sortedPools.get(definition.value), MIN_PER_CATEGORY, selected, used, brandCounts, categoryCounts);
  }

  const allCandidates = [...sortedPools.values()].flat().sort(compareRestaurantQuality);
  while (selected.length < target) {
    const candidate = allCandidates.find((restaurant) =>
      !used.has(getPoiKey(restaurant)) &&
      (categoryCounts.get(restaurant.category) || 0) < MAX_PER_CATEGORY &&
      (brandCounts.get(getBrandKey(restaurant.name)) || 0) < MAX_PER_BRAND_PER_DISTRICT
    );
    if (!candidate) break;
    addRestaurant(candidate, selected, used, brandCounts, categoryCounts);
  }
  return selected.slice(0, target);
}

function takeFromPool(pool = [], count, selected, used, brandCounts, categoryCounts) {
  let added = 0;
  for (const restaurant of pool) {
    const key = getPoiKey(restaurant);
    if (used.has(key)) continue;
    const brand = getBrandKey(restaurant.name);
    if ((brandCounts.get(brand) || 0) >= MAX_PER_BRAND_PER_DISTRICT) continue;
    addRestaurant(restaurant, selected, used, brandCounts, categoryCounts);
    added += 1;
    if (added >= count) break;
  }
  return added;
}

function addRestaurant(restaurant, selected, used, brandCounts, categoryCounts) {
  selected.push(restaurant);
  used.add(getPoiKey(restaurant));
  const brand = getBrandKey(restaurant.name);
  brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
  categoryCounts.set(restaurant.category, (categoryCounts.get(restaurant.category) || 0) + 1);
}

async function searchPoi(district, keyword, page) {
  const cacheKey = `${district}|${keyword}|${page}`;
  if (apiCache[cacheKey]) return apiCache[cacheKey];
  const params = new URLSearchParams({
    key: AMAP_KEY,
    keywords: `${district} ${keyword}`,
    city: "杭州",
    citylimit: "true",
    offset: "25",
    page: String(page),
    extensions: "all",
  });
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const data = await requestJson(`${AMAP_ENDPOINT}?${params}`);
    if (data.status === "1") {
      const pois = Array.isArray(data.pois) ? data.pois : [];
      apiCache[cacheKey] = pois;
      fs.writeFileSync(CACHE_PATH, JSON.stringify(apiCache), "utf8");
      return pois;
    }
    if (data.infocode !== "10021") {
      throw new Error(`Amap API error: ${data.info} (${data.infocode})`);
    }
    await sleep(1200 * (attempt + 1));
  }
  throw new Error(`Amap API stayed rate-limited for ${district} ${keyword} page ${page}`);
}

function normalizePoi(poi, district, preferredCategory = "") {
  const business = poi.business || {};
  const bizExt = poi.biz_ext || {};
  const tagText = business.tag || poi.tag || poi.type || "";
  const tags = String(tagText).split(/[;,，；]/).map((tag) => tag.trim()).filter(Boolean);
  const averageCost = Number(business.cost || bizExt.cost || 0) || null;
  const location = poi.location || "";
  const base = { name: poi.name || "", note: tags.join(" "), tags, type: poi.type || "" };
  const category = inferCategory(base, preferredCategory);
  return {
    id: `amap-${poi.id || slugify(`${district}-${poi.name}`)}`,
    amapId: poi.id || "",
    name: base.name,
    address: poi.address || "",
    note: [tags.length ? `标签：${tags.join(",")}` : "", averageCost ? `人均：${averageCost.toFixed(2)}` : ""].filter(Boolean).join("；") || "高德公开 POI",
    tags,
    category,
    categoryGroup: category,
    subcategory: inferSubcategory({ ...base, category }),
    district,
    amapDistrict: poi.adname || "",
    businessArea: normalizeBusinessArea(business.business_area || business.business_area_name || poi.business_area),
    source: "高德POI评分整理",
    rank: 0,
    rating: Number(business.rating || bizExt.rating || 0),
    averageCost,
    location,
    latitude: getCoordinate(location, 1),
    longitude: getCoordinate(location, 0),
    locationVerified: Boolean(location && poi.adname === district),
    createdAt: DEFAULT_DATE,
  };
}

function compareRestaurantQuality(left, right) {
  return Number(right.rating > 0) - Number(left.rating > 0) ||
    Number(right.rating || 0) - Number(left.rating || 0) ||
    Number(Boolean(right.businessArea)) - Number(Boolean(left.businessArea)) ||
    left.name.localeCompare(right.name, "zh-CN");
}

function summarizeDistrict(selected, pools) {
  return {
    selected: selected.length,
    selectedByCategory: countBy(selected, "category"),
    candidatesByCategory: Object.fromEntries([...pools].map(([category, pool]) => [category, pool.size])),
    verifiedLocations: selected.filter((item) => item.locationVerified).length,
    rated: selected.filter((item) => item.rating > 0).length,
    withBusinessArea: selected.filter((item) => item.businessArea).length,
  };
}

function getUniqueCandidateCount(pools) {
  return new Set([...pools.values()].flatMap((pool) => [...pool.keys()])).size;
}
function countUnused(pool, used) {
  return pool.filter((item) => !used.has(getPoiKey(item))).length;
}
function countBy(items, field) {
  return items.reduce((result, item) => {
    result[item[field]] = (result[item[field]] || 0) + 1;
    return result;
  }, {});
}
function getPoiKey(item) {
  return item.amapId || `${item.name}|${item.location || item.address}`;
}
function getBrandKey(name) {
  return String(name).replace(/[（(].*?[）)]/g, "").replace(/[\s·.]/g, "").slice(0, 12);
}
function getCoordinate(location, index) {
  const value = Number(String(location || "").split(",")[index]);
  return Number.isFinite(value) ? value : null;
}
function normalizeBusinessArea(value) {
  if (Array.isArray(value)) return value.find((item) => typeof item === "string") || "";
  return typeof value === "string" ? value : "";
}
function getAverageCost(restaurant) {
  if (Number.isFinite(Number(restaurant.averageCost))) return Number(restaurant.averageCost);
  const match = String(restaurant.note || "").match(/人均[：:]\s*([\d.]+)/);
  return match ? Number(match[1]) : null;
}
function requestJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    }).on("error", reject);
  });
}
function slugify(text) {
  return String(text).replace(/[^\w\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJsonFile(path, fallback) {
  try {
    return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : fallback;
  } catch {
    return fallback;
  }
}
