const fs = require("node:fs");
const path = require("node:path");
const { CITY_DEFINITIONS } = require("./city-definitions.cjs");
const { inferCategory, inferCategories, inferSubcategory } = require("./category-rules.cjs");

const root = path.resolve(__dirname, "..");
const minRating = Number(process.env.MIN_RATING || 3.5);
const sourceUpdatedAt = new Date().toISOString();

const indexFields = [
  "id",
  "amapId",
  "name",
  "province",
  "city",
  "cityAdcode",
  "district",
  "districtAdcode",
  "category",
  "categoryGroup",
  "subcategory",
  "categoryTags",
  "businessArea",
  "rating",
  "averageCost",
  "rank",
  "location",
  "photoUrl",
];

main();

function main() {
  const cityResults = CITY_DEFINITIONS.map((city) => {
    const sources = buildCitySources(city);
    const result = selectQualityRestaurants(sources, city);
    const report = writeCityPackage(city, result.selected, result);
    return {
      province: city.province,
      name: city.name,
      shortName: city.shortName,
      adcode: city.adcode,
      center: city.center,
      districts: city.districts,
      minRating,
      version: `amap-${city.adcode}-${result.selected.length}-${sourceUpdatedAt.slice(0, 10)}`,
      restaurantCount: result.selected.length,
      minRestaurants: city.minRestaurants,
      indexPath: `data/cities/${city.adcode}/restaurants-index.json`,
      detailsPath: `data/cities/${city.adcode}/restaurants-details.json`,
      reportPath: `data/cities/${city.adcode}/quality-report.json`,
      selectedMinimumRating: report.selectedMinimumRating,
      generatedAt: report.generatedAt,
    };
  });

  writeJson(path.join(root, "cities.json"), cityResults);
  writeUpdateManifest(cityResults);

  const hangzhou = cityResults.find((city) => city.adcode === "330100");
  if (hangzhou) {
    fs.copyFileSync(path.join(root, hangzhou.indexPath), path.join(root, "restaurants-index.json"));
    fs.copyFileSync(path.join(root, hangzhou.detailsPath), path.join(root, "restaurants-details.json"));
  }

  console.log(JSON.stringify({
    generatedAt: sourceUpdatedAt,
    cities: cityResults.map((city) => ({
      name: city.name,
      adcode: city.adcode,
      restaurantCount: city.restaurantCount,
      minRating: city.selectedMinimumRating,
    })),
  }, null, 2));
}

function buildCitySources(city) {
  const sources = [];
  if (city.adcode === "330100") {
    sources.push(...readExistingHangzhouSources(city));
  }
  sources.push(...readCachedCityRestaurants(city));
  return sources;
}

function readExistingHangzhouSources(city) {
  const restaurants = [
    ...readJson(path.join(root, "restaurants.json"), []),
    ...readJson(path.join(root, "restaurants-quality-additions.json"), []),
  ];
  return restaurants.map((restaurant) => normalizeExistingRestaurant(restaurant, city));
}

function readCachedCityRestaurants(city) {
  const cachePaths = [
    path.join(root, "data", "cache", `amap-poi-${city.adcode}.json`),
    path.join(root, `.amap-poi-cache-${city.adcode}.json`),
  ];
  if (city.adcode === "330100") cachePaths.push(path.join(root, ".amap-poi-cache.json"));

  const candidates = [];
  for (const cachePath of cachePaths) {
    if (!fs.existsSync(cachePath)) continue;
    const cache = readJson(cachePath, {});
    for (const pois of Object.values(cache)) {
      if (!Array.isArray(pois)) continue;
      for (const poi of pois) {
        if (poi?.id) candidates.push(normalizeAmapPoi(poi, city));
      }
    }
  }

  if (!candidates.length && city.adcode !== "330100") {
    throw new Error(`Missing AMap cache for ${city.name}. Run scripts/fetch-city-amap.cjs first.`);
  }
  return candidates;
}

function selectQualityRestaurants(restaurants, city) {
  const rejectionSummary = {};
  const valid = [];
  for (const restaurant of restaurants) {
    const reason = getRejectReason(restaurant, city);
    if (reason) {
      rejectionSummary[reason] = (rejectionSummary[reason] || 0) + 1;
    } else {
      valid.push(restaurant);
    }
  }

  const selected = dedupeRestaurants(valid.sort(compareQuality), rejectionSummary)
    .map((restaurant, index) => ({ ...restaurant, rank: index + 1 }));

  return {
    candidateCount: restaurants.length,
    validBeforeDedupCount: valid.length,
    selected,
    rejectionSummary,
  };
}

function dedupeRestaurants(restaurants, rejectionSummary) {
  const seenIds = new Set();
  const seenAmapIds = new Set();
  const seenComposite = new Set();
  const selected = [];

  for (const restaurant of restaurants) {
    const id = String(restaurant.id || "");
    const amapId = String(restaurant.amapId || "");
    const composite = getDedupKey(restaurant);
    if ((id && seenIds.has(id)) || (amapId && seenAmapIds.has(amapId)) || seenComposite.has(composite)) {
      rejectionSummary.duplicate = (rejectionSummary.duplicate || 0) + 1;
      continue;
    }
    if (id) seenIds.add(id);
    if (amapId) seenAmapIds.add(amapId);
    seenComposite.add(composite);
    selected.push(restaurant);
  }

  return selected;
}

function normalizeExistingRestaurant(restaurant, city) {
  const category = inferCategory(restaurant);
  const categoryTags = inferCategories({ ...restaurant, category });
  const district = restaurant.district || restaurant.amapDistrict || "";
  const location = String(restaurant.location || "");
  return {
    ...restaurant,
    id: restaurant.id || `legacy-${normalizeText(restaurant.name)}-${normalizeText(restaurant.address)}`,
    amapId: restaurant.amapId || "",
    province: city.province,
    city: city.name,
    cityAdcode: city.adcode,
    district,
    districtAdcode: restaurant.districtAdcode || "",
    category,
    categoryGroup: category,
    subcategory: inferSubcategory({ ...restaurant, category }),
    categoryTags,
    rating: parseRating(restaurant.rating),
    averageCost: Number(restaurant.averageCost || 0) || null,
    location,
    latitude: getCoordinate(location, 1),
    longitude: getCoordinate(location, 0),
    sourceUpdatedAt,
    locationVerified: Boolean(restaurant.locationVerified || location),
  };
}

function normalizeAmapPoi(poi, city) {
  const business = poi.business || {};
  const bizExt = poi.biz_ext || {};
  const tags = parseTags(business.tag || poi.tag || poi.atag || "");
  const categoryInput = { name: poi.name || "", note: tags.join(" "), tags, type: poi.type || "", typecode: poi.typecode || "" };
  const category = inferCategory(categoryInput);
  const categoryTags = inferCategories({ ...categoryInput, category });
  const averageCost = Number(business.cost || bizExt.cost || 0) || null;
  const location = String(poi.location || "");
  return {
    id: `amap-${poi.id}`,
    amapId: String(poi.id),
    name: String(poi.name || "").trim(),
    address: firstString(poi.address).trim(),
    note: [
      tags.length ? `标签：${tags.join("、")}` : "",
      averageCost ? `人均：${averageCost.toFixed(2)}` : "",
    ].filter(Boolean).join("；") || "高德公开 POI",
    tags,
    type: String(poi.type || ""),
    typecode: String(poi.typecode || ""),
    province: city.province,
    city: city.name,
    cityAdcode: city.adcode,
    district: String(poi.adname || ""),
    districtAdcode: String(poi.adcode || ""),
    amapDistrict: String(poi.adname || ""),
    businessArea: normalizeBusinessArea(poi.business_area || business.business_area || business.business_area_name),
    category,
    categoryGroup: category,
    subcategory: inferSubcategory({ ...categoryInput, category }),
    categoryTags,
    source: "高德POI评分整理",
    rank: 0,
    rating: parseRating(business.rating || bizExt.rating),
    averageCost,
    location,
    latitude: getCoordinate(location, 1),
    longitude: getCoordinate(location, 0),
    telephone: firstString(poi.tel),
    photoUrl: firstString(poi.photos?.[0]?.url),
    locationVerified: Boolean(location && city.districts.includes(String(poi.adname || ""))),
    createdAt: sourceUpdatedAt,
    sourceUpdatedAt,
  };
}

function writeCityPackage(city, restaurants, selectionResult) {
  const dir = path.join(root, "data", "cities", city.adcode);
  fs.mkdirSync(dir, { recursive: true });
  const index = restaurants.map((restaurant) => pickFields(restaurant, indexFields));
  const details = Object.fromEntries(restaurants.map((restaurant) => [restaurant.id, restaurant]));
  const report = buildReport(city, restaurants, selectionResult);
  fs.writeFileSync(path.join(dir, "restaurants-index.json"), JSON.stringify(index), "utf8");
  fs.writeFileSync(path.join(dir, "restaurants-details.json"), JSON.stringify(details), "utf8");
  writeJson(path.join(dir, "quality-report.json"), report);
  return report;
}

function writeUpdateManifest(cities) {
  const manifest = {
    generatedAt: sourceUpdatedAt,
    source: "amap-public-poi",
    minimumRating: minRating,
    cities: cities.map((city) => ({
      province: city.province,
      name: city.name,
      shortName: city.shortName,
      adcode: city.adcode,
      version: city.version,
      updatedAt: city.generatedAt || sourceUpdatedAt,
      restaurantCount: city.restaurantCount,
      minRating: city.minRating,
      selectedMinimumRating: city.selectedMinimumRating ?? null,
      reportPath: city.reportPath,
      indexPath: city.indexPath,
      detailsPath: city.detailsPath,
    })),
  };
  fs.mkdirSync(path.join(root, "data"), { recursive: true });
  writeJson(path.join(root, "data", "update-manifest.json"), manifest);
}

function buildReport(city, restaurants, selectionResult) {
  return {
    generatedAt: sourceUpdatedAt,
    city: city.name,
    cityAdcode: city.adcode,
    minimumRating: minRating,
    candidateCount: selectionResult.candidateCount,
    validBeforeDedupCount: selectionResult.validBeforeDedupCount,
    selectedCount: restaurants.length,
    selectedMinimumRating: restaurants.length ? Math.min(...restaurants.map((item) => Number(item.rating))) : null,
    ratingDistribution: countBy(restaurants, (item) => Number(item.rating).toFixed(1)),
    districtDistribution: countBy(restaurants, (item) => item.district),
    categoryDistribution: countBy(restaurants, (item) => item.category),
    rejectionSummary: selectionResult.rejectionSummary,
    dataCompleteness: {
      withBusinessArea: restaurants.filter((item) => item.businessArea).length,
      withAverageCost: restaurants.filter((item) => item.averageCost).length,
      withTags: restaurants.filter((item) => item.tags?.length).length,
      withPhoto: restaurants.filter((item) => item.photoUrl).length,
      verifiedLocations: restaurants.filter((item) => item.locationVerified).length,
    },
  };
}

function getRejectReason(restaurant, city) {
  if (!restaurant.name || !restaurant.address) return "missingNameOrAddress";
  if (Number(restaurant.rating || 0) < minRating) return "belowRating";
  if (!restaurant.location || !isValidCoordinate(restaurant, city)) return "invalidLocation";
  if (!city.districts.includes(String(restaurant.district || ""))) return "districtMismatch";
  if (!restaurant.category || !restaurant.subcategory) return "missingCategory";
  if (isNonRestaurant(restaurant)) return "notDiningPoi";
  if (/已关闭|暂停营业|停止营业|装修中|筹备中|已搬迁|已注销|暂无营业/.test(restaurant.name)) return "closedOrUnavailable";
  return "";
}

function isNonRestaurant(restaurant) {
  const text = `${restaurant.name || ""} ${restaurant.type || ""}`;
  return /便利店|超市|菜市场|食品店|烟酒|粮油|水果店|生鲜店|药店|培训|公司|工厂|酒店住宿|宾馆|停车场|景区|售楼|医院|学校/.test(text);
}

function isValidCoordinate(restaurant, city) {
  const longitude = Number(restaurant.longitude ?? String(restaurant.location || "").split(",")[0]);
  const latitude = Number(restaurant.latitude ?? String(restaurant.location || "").split(",")[1]);
  const bounds = city.coordinateBounds;
  return Number.isFinite(longitude) && Number.isFinite(latitude) &&
    longitude >= bounds.minLongitude && longitude <= bounds.maxLongitude &&
    latitude >= bounds.minLatitude && latitude <= bounds.maxLatitude;
}

function compareQuality(left, right) {
  return Number(right.rating || 0) - Number(left.rating || 0) ||
    getCompletenessScore(right) - getCompletenessScore(left) ||
    String(left.name || "").localeCompare(String(right.name || ""), "zh-CN");
}

function getCompletenessScore(item) {
  return Number(Boolean(item.address)) +
    Number(Boolean(item.businessArea)) +
    Number(Boolean(item.averageCost)) +
    Number(Boolean(item.tags?.length)) +
    Number(Boolean(item.telephone)) +
    Number(Boolean(item.photoUrl));
}

function getDedupKey(restaurant) {
  return [
    normalizeText(restaurant.name),
    normalizeText(restaurant.address),
  ].join("|");
}

function pickFields(item, fields) {
  const picked = {};
  fields.forEach((field) => {
    if (item[field] !== undefined && item[field] !== null && item[field] !== "") picked[field] = item[field];
  });
  return picked;
}

function normalizeBusinessArea(value) {
  if (Array.isArray(value)) return value.find((item) => typeof item === "string") || "";
  return typeof value === "string" ? value : "";
}

function firstString(value) {
  if (Array.isArray(value)) return value.find((item) => typeof item === "string") || "";
  return typeof value === "string" ? value : "";
}

function parseTags(value) {
  return String(value)
    .split(/[;,，；、]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseRating(value) {
  const rating = Number(value);
  return Number.isFinite(rating) ? rating : 0;
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

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, "");
}

function readJson(filePath, fallback) {
  try {
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
