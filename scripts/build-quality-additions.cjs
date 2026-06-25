const fs = require("node:fs");
const { CATEGORY_DEFINITIONS, inferCategory, inferSubcategory } = require("./category-rules.cjs");

const CACHE_PATH = ".amap-poi-cache.json";
const CORE_PATH = "restaurants.json";
const OUTPUT_PATH = "restaurants-quality-additions.json";
const REPORT_PATH = "restaurants-quality-report.json";
const MIN_RATING = Number(process.env.MIN_RATING || 4);
const TARGET_MAX = Number(process.env.TARGET_MAX || 2000);
const MAX_PER_BRAND = 12;
const MAX_PER_BRAND_PER_DISTRICT = 3;
const CREATED_AT = new Date().toISOString();
const DISTRICTS = new Set([
  "上城区", "拱墅区", "西湖区", "滨江区", "萧山区", "余杭区", "临平区",
  "钱塘区", "富阳区", "临安区", "桐庐县", "淳安县", "建德市",
]);
const CLOSED_PATTERN = /已关闭|暂停营业|停止营业|装修中|筹备中|已搬迁|已注销|暂未营业/;
const NON_RESTAURANT_PATTERN = /便利店|超市|菜市场|食品店|烟酒|粮油|水果店|生鲜店|药店|培训|公司|工厂/;

main();

function main() {
  if (!fs.existsSync(CACHE_PATH)) throw new Error(`Missing ${CACHE_PATH}`);
  if (!fs.existsSync(CORE_PATH)) throw new Error(`Missing ${CORE_PATH}`);

  const cache = readJson(CACHE_PATH);
  const core = readJson(CORE_PATH);
  const coreIds = new Set(core.map((item) => String(item.amapId || item.id || "")));
  const coreCompositeKeys = new Set(core.flatMap(getDedupKeys));
  const candidates = collectCandidates(cache);
  const rejected = createRejectCounters();
  const eligible = [];
  const seenIds = new Set();
  const seenCompositeKeys = new Set();

  for (const candidate of candidates.values()) {
    const reason = getRejectReason(candidate, coreIds, coreCompositeKeys);
    if (reason) {
      rejected[reason] += 1;
      continue;
    }
    const keys = getDedupKeys(candidate);
    if (seenIds.has(candidate.amapId) || keys.some((key) => seenCompositeKeys.has(key))) {
      rejected.duplicateCandidate += 1;
      continue;
    }
    seenIds.add(candidate.amapId);
    keys.forEach((key) => seenCompositeKeys.add(key));
    eligible.push(candidate);
  }

  eligible.sort(compareQuality);
  const selected = [];
  const brandCounts = new Map();
  const districtBrandCounts = new Map();
  for (const candidate of eligible) {
    const brand = getBrandKey(candidate.name);
    const districtBrand = `${candidate.district}|${brand}`;
    if ((brandCounts.get(brand) || 0) >= MAX_PER_BRAND) {
      rejected.brandGlobalLimit += 1;
      continue;
    }
    if ((districtBrandCounts.get(districtBrand) || 0) >= MAX_PER_BRAND_PER_DISTRICT) {
      rejected.brandDistrictLimit += 1;
      continue;
    }
    selected.push({
      ...candidate,
      rank: selected.length + 1,
      source: "高德POI好评优选",
    });
    brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
    districtBrandCounts.set(districtBrand, (districtBrandCounts.get(districtBrand) || 0) + 1);
    if (selected.length >= TARGET_MAX) break;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    coreCount: core.length,
    candidateCount: candidates.size,
    eligibleBeforeBrandLimits: eligible.length,
    selectedCount: selected.length,
    combinedCount: core.length + selected.length,
    targetMax: TARGET_MAX,
    minimumRating: MIN_RATING,
    selectedMinimumRating: selected.length ? Math.min(...selected.map((item) => item.rating)) : null,
    selectedAverageRating: selected.length ? round(selected.reduce((sum, item) => sum + item.rating, 0) / selected.length, 3) : null,
    ratingDistribution: countBy(selected, (item) => item.rating.toFixed(1)),
    districtDistribution: countBy(selected, (item) => item.district),
    categoryDistribution: countBy(selected, (item) => item.category),
    dataCompleteness: {
      withBusinessArea: selected.filter((item) => item.businessArea).length,
      withAverageCost: selected.filter((item) => item.averageCost).length,
      withTags: selected.filter((item) => item.tags.length).length,
      withPhoto: selected.filter((item) => item.photoUrl).length,
      verifiedLocations: selected.filter((item) => item.locationVerified).length,
    },
    rejected,
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(selected, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

function collectCandidates(cache) {
  const candidates = new Map();
  for (const [queryKey, pois] of Object.entries(cache)) {
    if (!Array.isArray(pois)) continue;
    const queryParts = queryKey.split("|");
    const page = Number(queryParts.at(-1)) || 99;
    pois.forEach((poi, index) => {
      if (!poi || !poi.id) return;
      const normalized = normalizePoi(poi);
      const existing = candidates.get(normalized.amapId);
      if (existing) {
        existing.appearances += 1;
        existing.bestPage = Math.min(existing.bestPage, page);
        existing.bestPosition = Math.min(existing.bestPosition, index + 1);
        if (compareQuality(normalized, existing) < 0) {
          Object.assign(existing, normalized, {
            appearances: existing.appearances,
            bestPage: existing.bestPage,
            bestPosition: existing.bestPosition,
          });
        }
      } else {
        candidates.set(normalized.amapId, {
          ...normalized,
          appearances: 1,
          bestPage: page,
          bestPosition: index + 1,
        });
      }
    });
  }
  return candidates;
}

function normalizePoi(poi) {
  const business = poi.business || {};
  const bizExt = poi.biz_ext || {};
  const rawTags = business.tag || poi.tag || poi.atag || "";
  const tags = String(rawTags).split(/[;,，；]/).map((tag) => tag.trim()).filter(Boolean);
  const rating = Number(business.rating || bizExt.rating || 0);
  const averageCost = Number(business.cost || bizExt.cost || 0) || null;
  const location = String(poi.location || "");
  const categoryInput = { name: poi.name || "", note: tags.join(" "), tags, type: poi.type || "" };
  const category = inferCategory(categoryInput);
  const photoUrl = getFirstString(poi.photos?.[0]?.url);
  return {
    id: `amap-${poi.id}`,
    amapId: String(poi.id),
    name: String(poi.name || "").trim(),
    address: getFirstString(poi.address).trim(),
    note: [
      tags.length ? `标签：${tags.join(",")}` : "",
      averageCost ? `人均：${averageCost.toFixed(2)}` : "",
    ].filter(Boolean).join("；") || "高德公开 POI",
    tags,
    type: String(poi.type || ""),
    typecode: String(poi.typecode || ""),
    category,
    categoryGroup: category,
    subcategory: inferSubcategory({ ...categoryInput, category }),
    district: String(poi.adname || ""),
    amapDistrict: String(poi.adname || ""),
    businessArea: normalizeBusinessArea(poi.business_area || business.business_area || business.business_area_name),
    source: "高德POI好评优选",
    rank: 0,
    rating,
    averageCost,
    location,
    latitude: getCoordinate(location, 1),
    longitude: getCoordinate(location, 0),
    telephone: getFirstString(poi.tel),
    photoUrl,
    locationVerified: Boolean(location && DISTRICTS.has(String(poi.adname || ""))),
    createdAt: CREATED_AT,
  };
}

function getRejectReason(item, coreIds, coreCompositeKeys) {
  if (!item.name || !item.address) return "missingNameOrAddress";
  if (!String(item.type).startsWith("餐饮服务")) return "notDiningPoi";
  if (CLOSED_PATTERN.test(item.name)) return "closedOrUnavailable";
  if (NON_RESTAURANT_PATTERN.test(item.name)) return "nonRestaurantName";
  if (!item.locationVerified || !isValidHangzhouCoordinate(item.longitude, item.latitude)) return "invalidLocation";
  if (item.rating < MIN_RATING) return "belowRating";
  if (!item.category || !item.subcategory) return "missingCategory";
  if (coreIds.has(item.amapId)) return "alreadyInCoreById";
  if (getDedupKeys(item).some((key) => coreCompositeKeys.has(key))) return "alreadyInCoreComposite";
  return "";
}

function compareQuality(left, right) {
  return Number(right.rating || 0) - Number(left.rating || 0) ||
    Number(right.appearances || 0) - Number(left.appearances || 0) ||
    Number(left.bestPage || 99) - Number(right.bestPage || 99) ||
    Number(left.bestPosition || 99) - Number(right.bestPosition || 99) ||
    getCompletenessScore(right) - getCompletenessScore(left) ||
    left.name.localeCompare(right.name, "zh-CN");
}

function getCompletenessScore(item) {
  return Number(Boolean(item.address)) +
    Number(Boolean(item.businessArea)) +
    Number(Boolean(item.averageCost)) +
    Number(Boolean(item.tags?.length)) +
    Number(Boolean(item.telephone)) +
    Number(Boolean(item.photoUrl));
}

function getDedupKeys(item) {
  const name = normalizeText(item.name);
  const address = normalizeText(item.address);
  const telephone = normalizeText(item.telephone);
  const roundedLocation = item.longitude && item.latitude
    ? `${Number(item.longitude).toFixed(4)},${Number(item.latitude).toFixed(4)}`
    : "";
  return [
    name && address ? `name-address:${name}|${address}` : "",
    name && telephone ? `name-phone:${name}|${telephone}` : "",
    name && roundedLocation ? `name-location:${name}|${roundedLocation}` : "",
  ].filter(Boolean);
}

function getBrandKey(name) {
  return normalizeText(String(name).replace(/[（(].*?[）)]/g, "")).slice(0, 16);
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, "");
}

function isValidHangzhouCoordinate(longitude, latitude) {
  return Number.isFinite(longitude) && Number.isFinite(latitude) &&
    longitude >= 118.3 && longitude <= 120.8 &&
    latitude >= 29.1 && latitude <= 30.7;
}

function normalizeBusinessArea(value) {
  if (Array.isArray(value)) return value.find((item) => typeof item === "string") || "";
  return typeof value === "string" ? value : "";
}

function getFirstString(value) {
  if (Array.isArray(value)) return value.find((item) => typeof item === "string") || "";
  return typeof value === "string" ? value : "";
}

function getCoordinate(location, index) {
  const value = Number(String(location || "").split(",")[index]);
  return Number.isFinite(value) ? value : null;
}

function countBy(items, getter) {
  return Object.fromEntries(
    [...items.reduce((map, item) => {
      const key = getter(item) || "未知";
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map())].sort(([left], [right]) => left.localeCompare(right, "zh-CN")),
  );
}

function createRejectCounters() {
  return {
    missingNameOrAddress: 0,
    notDiningPoi: 0,
    closedOrUnavailable: 0,
    nonRestaurantName: 0,
    invalidLocation: 0,
    belowRating: 0,
    missingCategory: 0,
    alreadyInCoreById: 0,
    alreadyInCoreComposite: 0,
    duplicateCandidate: 0,
    brandGlobalLimit: 0,
    brandDistrictLimit: 0,
  };
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
