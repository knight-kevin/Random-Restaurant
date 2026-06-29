const cleanFs = require("node:fs");
const cleanPath = require("node:path");
const { CITY_DEFINITIONS: CLEAN_CITY_DEFINITIONS } = require("./city-definitions.cjs");
const { inferCategory: inferCleanCategory, inferSubcategory: inferCleanSubcategory } = require("./category-rules.cjs");

const cleanRoot = cleanPath.resolve(__dirname, "..");
const cleanMinRating = Number(process.env.MIN_RATING || 4);
const cleanSourceUpdatedAt = new Date().toISOString();

const cleanIndexFields = [
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
  "businessArea",
  "rating",
  "averageCost",
  "rank",
  "location",
  "photoUrl",
];

cleanMain();

function cleanMain() {
  const cities = CLEAN_CITY_DEFINITIONS.map((city) => {
    const sourceRestaurants = city.adcode === "330100"
      ? cleanBuildHangzhouRestaurants(city)
      : cleanBuildCachedCityRestaurants(city);
    const { selected, rejectionSummary } = cleanSelectQualityRestaurants(sourceRestaurants, city);
    const report = cleanWriteCityPackage(city, selected, rejectionSummary);
    return {
      province: city.province,
      name: city.name,
      shortName: city.shortName,
      adcode: city.adcode,
      center: city.center,
      districts: city.districts,
      minRating: cleanMinRating,
      version: `amap-${city.adcode}-${selected.length}-${cleanSourceUpdatedAt.slice(0, 10)}`,
      restaurantCount: selected.length,
      minRestaurants: city.minRestaurants,
      indexPath: `data/cities/${city.adcode}/restaurants-index.json`,
      detailsPath: `data/cities/${city.adcode}/restaurants-details.json`,
      reportPath: `data/cities/${city.adcode}/quality-report.json`,
      selectedMinimumRating: report.selectedMinimumRating,
      generatedAt: report.generatedAt,
    };
  });

  cleanFs.writeFileSync(cleanPath.join(cleanRoot, "cities.json"), `${JSON.stringify(cities, null, 2)}\n`, "utf8");
  cleanWriteUpdateManifest(cities);

  const hangzhou = cities.find((city) => city.adcode === "330100");
  if (hangzhou) {
    cleanFs.copyFileSync(cleanPath.join(cleanRoot, hangzhou.indexPath), cleanPath.join(cleanRoot, "restaurants-index.json"));
    cleanFs.copyFileSync(cleanPath.join(cleanRoot, hangzhou.detailsPath), cleanPath.join(cleanRoot, "restaurants-details.json"));
  }

  console.log(JSON.stringify({
    generatedAt: cleanSourceUpdatedAt,
    cities: cities.map((city) => ({ name: city.name, adcode: city.adcode, restaurantCount: city.restaurantCount })),
  }, null, 2));
}

function cleanBuildHangzhouRestaurants(city) {
  const source = [
    ...cleanReadJson(cleanPath.join(cleanRoot, "restaurants.json"), []),
    ...cleanReadJson(cleanPath.join(cleanRoot, "restaurants-quality-additions.json"), []),
  ];
  const cacheCandidates = cleanReadCachedCityRestaurants(city);
  if (cacheCandidates.length) source.push(...cacheCandidates);
  return source.map((restaurant) => cleanNormalizeExistingRestaurant(restaurant, city));
}

function cleanBuildCachedCityRestaurants(city) {
  return cleanReadCachedCityRestaurants(city);
}

function cleanReadCachedCityRestaurants(city) {
  const cachePath = cleanPath.join(cleanRoot, "data", "cache", `amap-poi-${city.adcode}.json`);
  const legacyCachePath = cleanPath.join(cleanRoot, `.amap-poi-cache-${city.adcode}.json`);
  const readableCachePath = cleanFs.existsSync(cachePath) ? cachePath : legacyCachePath;
  if (!cleanFs.existsSync(readableCachePath)) {
    if (city.adcode === "330100") return [];
    throw new Error(`Missing ${cleanPath.basename(cachePath)}. Run scripts/fetch-city-amap.cjs for ${city.name} first.`);
  }
  const cache = cleanReadJson(readableCachePath, {});
  const candidates = new Map();
  for (const pois of Object.values(cache)) {
    if (!Array.isArray(pois)) continue;
    for (const poi of pois) {
      if (!poi?.id) continue;
      const restaurant = cleanNormalizeAmapPoi(poi, city);
      const existing = candidates.get(restaurant.amapId);
      if (!existing || cleanCompareQuality(restaurant, existing) < 0) candidates.set(restaurant.amapId, restaurant);
    }
  }
  return [...candidates.values()];
}

function cleanSelectQualityRestaurants(restaurants, city) {
  const rejectionSummary = {};
  const seen = new Set();
  let selected = restaurants
    .map((restaurant) => ({ restaurant, reason: cleanGetRejectReason(restaurant, city) }))
    .filter(({ reason }) => {
      if (!reason) return true;
      rejectionSummary[reason] = (rejectionSummary[reason] || 0) + 1;
      return false;
    })
    .map(({ restaurant }) => restaurant)
    .sort(cleanCompareQuality)
    .filter((restaurant) => {
      const key = cleanGetDedupKey(restaurant);
      if (seen.has(key)) {
        rejectionSummary.duplicate = (rejectionSummary.duplicate || 0) + 1;
        return false;
      }
      seen.add(key);
      return true;
    })
    .map((restaurant, index) => ({ ...restaurant, rank: index + 1 }));
  selected = cleanLimitRestaurantsForCity(selected, city).map((restaurant, index) => ({ ...restaurant, rank: index + 1 }));
  return { selected, rejectionSummary };
}

function cleanLimitRestaurantsForCity(restaurants, city) {
  if (!city.maxRestaurants || restaurants.length <= city.maxRestaurants) return restaurants;
  const selected = new Map();
  const minimumPerDistrict = Math.min(30, Math.floor(city.maxRestaurants / Math.max(city.districts.length, 1)));
  for (const district of city.districts) {
    restaurants
      .filter((restaurant) => restaurant.district === district)
      .slice(0, minimumPerDistrict)
      .forEach((restaurant) => selected.set(restaurant.id, restaurant));
  }
  for (const restaurant of restaurants) {
    if (selected.size >= city.maxRestaurants) break;
    selected.set(restaurant.id, restaurant);
  }
  return [...selected.values()].sort(cleanCompareQuality);
}

function cleanNormalizeExistingRestaurant(restaurant, city) {
  const category = restaurant.category || inferCleanCategory(restaurant);
  const district = restaurant.district || restaurant.amapDistrict || "";
  return {
    ...restaurant,
    id: restaurant.id || `hz-${cleanNormalizeText(restaurant.name)}-${cleanNormalizeText(restaurant.address)}`,
    province: city.province,
    city: city.name,
    cityAdcode: city.adcode,
    district,
    districtAdcode: restaurant.districtAdcode || "",
    category,
    categoryGroup: restaurant.categoryGroup || category,
    subcategory: restaurant.subcategory || inferCleanSubcategory({ ...restaurant, category }),
    rating: cleanParseRating(restaurant.rating),
    averageCost: Number(restaurant.averageCost || 0) || null,
    latitude: cleanGetCoordinate(restaurant.location, 1),
    longitude: cleanGetCoordinate(restaurant.location, 0),
    sourceUpdatedAt: cleanSourceUpdatedAt,
    locationVerified: Boolean(restaurant.locationVerified || restaurant.location),
  };
}

function cleanNormalizeAmapPoi(poi, city) {
  const business = poi.business || {};
  const bizExt = poi.biz_ext || {};
  const rawTags = business.tag || poi.tag || poi.atag || "";
  const tags = String(rawTags).split(/[;,，；]/).map((tag) => tag.trim()).filter(Boolean);
  const categoryInput = { name: poi.name || "", note: tags.join(" "), tags, type: poi.type || "" };
  const category = inferCleanCategory(categoryInput);
  const averageCost = Number(business.cost || bizExt.cost || 0) || null;
  const location = String(poi.location || "");
  return {
    id: `amap-${poi.id}`,
    amapId: String(poi.id),
    name: String(poi.name || "").trim(),
    address: cleanFirstString(poi.address).trim(),
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
    businessArea: cleanNormalizeBusinessArea(poi.business_area || business.business_area || business.business_area_name),
    category,
    categoryGroup: category,
    subcategory: inferCleanSubcategory({ ...categoryInput, category }),
    source: "高德POI评分整理",
    rank: 0,
    rating: cleanParseRating(business.rating || bizExt.rating),
    averageCost,
    location,
    latitude: cleanGetCoordinate(location, 1),
    longitude: cleanGetCoordinate(location, 0),
    telephone: cleanFirstString(poi.tel),
    photoUrl: cleanFirstString(poi.photos?.[0]?.url),
    locationVerified: Boolean(location && city.districts.includes(String(poi.adname || ""))),
    createdAt: cleanSourceUpdatedAt,
    sourceUpdatedAt: cleanSourceUpdatedAt,
  };
}

function cleanWriteCityPackage(city, restaurants, rejectionSummary) {
  const dir = cleanPath.join(cleanRoot, "data", "cities", city.adcode);
  cleanFs.mkdirSync(dir, { recursive: true });
  const index = restaurants.map((restaurant) => cleanPickFields(restaurant, cleanIndexFields));
  const details = Object.fromEntries(restaurants.map((restaurant) => [restaurant.id, restaurant]));
  const report = cleanBuildReport(city, restaurants, rejectionSummary);
  cleanFs.writeFileSync(cleanPath.join(dir, "restaurants-index.json"), JSON.stringify(index), "utf8");
  cleanFs.writeFileSync(cleanPath.join(dir, "restaurants-details.json"), JSON.stringify(details), "utf8");
  cleanFs.writeFileSync(cleanPath.join(dir, "quality-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

function cleanWriteUpdateManifest(cities) {
  const manifest = {
    generatedAt: cleanSourceUpdatedAt,
    source: "amap-public-poi",
    minimumRating: cleanMinRating,
    cities: cities.map((city) => ({
      province: city.province,
      name: city.name,
      shortName: city.shortName,
      adcode: city.adcode,
      version: city.version,
      updatedAt: city.generatedAt || cleanSourceUpdatedAt,
      restaurantCount: city.restaurantCount,
      minRating: city.minRating,
      selectedMinimumRating: city.selectedMinimumRating ?? null,
      reportPath: city.reportPath,
      indexPath: city.indexPath,
      detailsPath: city.detailsPath,
    })),
  };
  const dataDir = cleanPath.join(cleanRoot, "data");
  cleanFs.mkdirSync(dataDir, { recursive: true });
  cleanFs.writeFileSync(cleanPath.join(dataDir, "update-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function cleanBuildReport(city, restaurants, rejectionSummary) {
  return {
    generatedAt: cleanSourceUpdatedAt,
    city: city.name,
    cityAdcode: city.adcode,
    minimumRating: cleanMinRating,
    selectedCount: restaurants.length,
    selectedMinimumRating: restaurants.length ? Math.min(...restaurants.map((item) => Number(item.rating))) : null,
    ratingDistribution: cleanCountBy(restaurants, (item) => Number(item.rating).toFixed(1)),
    districtDistribution: cleanCountBy(restaurants, (item) => item.district),
    categoryDistribution: cleanCountBy(restaurants, (item) => item.category),
    rejectionSummary,
    dataCompleteness: {
      withBusinessArea: restaurants.filter((item) => item.businessArea).length,
      withAverageCost: restaurants.filter((item) => item.averageCost).length,
      withTags: restaurants.filter((item) => item.tags?.length).length,
      withPhoto: restaurants.filter((item) => item.photoUrl).length,
      verifiedLocations: restaurants.filter((item) => item.locationVerified).length,
    },
  };
}

function cleanGetRejectReason(restaurant, city) {
  if (!restaurant.name || !restaurant.address) return "missingNameOrAddress";
  if (Number(restaurant.rating || 0) < cleanMinRating) return "belowRating";
  if (!restaurant.location || !cleanIsValidCoordinate(restaurant, city)) return "invalidLocation";
  if (!city.districts.includes(String(restaurant.district || ""))) return "districtMismatch";
  if (!restaurant.category || !restaurant.subcategory) return "missingCategory";
  if (cleanIsNonRestaurant(restaurant)) return "notDiningPoi";
  if (/已关闭|暂停营业|停止营业|装修中|筹备中|已搬迁|已注销|暂无营业/.test(restaurant.name)) return "closedOrUnavailable";
  return "";
}

function cleanIsNonRestaurant(restaurant) {
  const text = `${restaurant.name || ""} ${restaurant.type || ""}`;
  return /便利店|超市|菜市场|食品店|烟酒|粮油|水果店|生鲜店|药店|培训|公司|工厂|酒店住宿|宾馆|停车场|景区|售楼|医院|学校/.test(text);
}

function cleanIsValidCoordinate(restaurant, city) {
  const longitude = Number(restaurant.longitude ?? String(restaurant.location || "").split(",")[0]);
  const latitude = Number(restaurant.latitude ?? String(restaurant.location || "").split(",")[1]);
  const bounds = city.coordinateBounds;
  return Number.isFinite(longitude) && Number.isFinite(latitude) &&
    longitude >= bounds.minLongitude && longitude <= bounds.maxLongitude &&
    latitude >= bounds.minLatitude && latitude <= bounds.maxLatitude;
}

function cleanCompareQuality(left, right) {
  return Number(right.rating || 0) - Number(left.rating || 0) ||
    cleanGetCompletenessScore(right) - cleanGetCompletenessScore(left) ||
    String(left.name || "").localeCompare(String(right.name || ""), "zh-CN");
}

function cleanGetCompletenessScore(item) {
  return Number(Boolean(item.address)) +
    Number(Boolean(item.businessArea)) +
    Number(Boolean(item.averageCost)) +
    Number(Boolean(item.tags?.length)) +
    Number(Boolean(item.telephone)) +
    Number(Boolean(item.photoUrl));
}

function cleanGetDedupKey(restaurant) {
  const location = restaurant.location
    ? String(restaurant.location).split(",").map((value) => Number(value).toFixed(4)).join(",")
    : "";
  return [
    cleanNormalizeText(restaurant.name),
    cleanNormalizeText(restaurant.address),
    location,
  ].join("|");
}

function cleanPickFields(item, fields) {
  const picked = {};
  fields.forEach((field) => {
    if (item[field] !== undefined && item[field] !== null && item[field] !== "") picked[field] = item[field];
  });
  return picked;
}

function cleanNormalizeBusinessArea(value) {
  if (Array.isArray(value)) return value.find((item) => typeof item === "string") || "";
  return typeof value === "string" ? value : "";
}

function cleanFirstString(value) {
  if (Array.isArray(value)) return value.find((item) => typeof item === "string") || "";
  return typeof value === "string" ? value : "";
}

function cleanParseRating(value) {
  const rating = Number(value);
  return Number.isFinite(rating) ? rating : 0;
}

function cleanGetCoordinate(location, index) {
  const value = Number(String(location || "").split(",")[index]);
  return Number.isFinite(value) ? value : null;
}

function cleanCountBy(items, getter) {
  return Object.fromEntries(
    [...items.reduce((map, item) => {
      const key = getter(item) || "未知";
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map())].sort(([left], [right]) => left.localeCompare(right, "zh-CN")),
  );
}

function cleanNormalizeText(value) {
  return String(value || "").toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, "");
}

function cleanReadJson(filePath, fallback) {
  try {
    return cleanFs.existsSync(filePath) ? JSON.parse(cleanFs.readFileSync(filePath, "utf8")) : fallback;
  } catch {
    return fallback;
  }
}

if (false) {
const fs = require("node:fs");
const path = require("node:path");
const { CITY_DEFINITIONS, getCityDefinition } = require("./city-definitions.cjs");
const { inferCategory, inferSubcategory } = require("./category-rules.cjs");

const root = path.resolve(__dirname, "..");
const minRating = Number(process.env.MIN_RATING || 4);
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
  "businessArea",
  "rating",
  "averageCost",
  "rank",
  "location",
  "photoUrl",
];

main();

function main() {
  const cities = CITY_DEFINITIONS.map((city) => {
    const restaurants = city.adcode === "330100"
      ? buildHangzhouRestaurants(city)
      : buildCachedCityRestaurants(city);
    writeCityPackage(city, restaurants);
    return {
      province: city.province,
      name: city.name,
      shortName: city.shortName,
      adcode: city.adcode,
      center: city.center,
      version: `amap-${city.adcode}-${restaurants.length}-${sourceUpdatedAt.slice(0, 10)}`,
      restaurantCount: restaurants.length,
      minRating,
      indexPath: `data/cities/${city.adcode}/restaurants-index.json`,
      detailsPath: `data/cities/${city.adcode}/restaurants-details.json`,
      reportPath: `data/cities/${city.adcode}/quality-report.json`,
    };
  });

  fs.writeFileSync(path.join(root, "cities.json"), `${JSON.stringify(cities, null, 2)}\n`, "utf8");

  const hangzhou = cities.find((city) => city.adcode === "330100");
  if (hangzhou) {
    fs.copyFileSync(path.join(root, hangzhou.indexPath), path.join(root, "restaurants-index.json"));
    fs.copyFileSync(path.join(root, hangzhou.detailsPath), path.join(root, "restaurants-details.json"));
  }

  console.log(JSON.stringify({
    generatedAt: sourceUpdatedAt,
    cities: cities.map((city) => ({ name: city.name, adcode: city.adcode, restaurantCount: city.restaurantCount })),
  }, null, 2));
}

function buildHangzhouRestaurants(city) {
  const source = [
    ...readJson(path.join(root, "restaurants.json"), []),
    ...readJson(path.join(root, "restaurants-quality-additions.json"), []),
  ];
  return selectQualityRestaurants(source.map((restaurant) => normalizeExistingRestaurant(restaurant, city)), city);
}

function buildCachedCityRestaurants(city) {
  const cachePath = path.join(root, "data", "cache", `amap-poi-${city.adcode}.json`);
  const legacyCachePath = path.join(root, `.amap-poi-cache-${city.adcode}.json`);
  const readableCachePath = fs.existsSync(cachePath) ? cachePath : legacyCachePath;
  if (!fs.existsSync(readableCachePath)) {
    throw new Error(`Missing ${path.basename(cachePath)}. Run scripts/fetch-city-amap.cjs for ${city.name} first.`);
  }
  const cache = readJson(readableCachePath, {});
  const candidates = new Map();
  for (const pois of Object.values(cache)) {
    if (!Array.isArray(pois)) continue;
    for (const poi of pois) {
      if (!poi?.id) continue;
      const restaurant = normalizeAmapPoi(poi, city);
      const existing = candidates.get(restaurant.amapId);
      if (!existing || compareQuality(restaurant, existing) < 0) candidates.set(restaurant.amapId, restaurant);
    }
  }
  return selectQualityRestaurants([...candidates.values()], city);
}

function selectQualityRestaurants(restaurants, city) {
  const seen = new Set();
  return restaurants
    .filter((restaurant) => getRejectReason(restaurant, city) === "")
    .sort(compareQuality)
    .filter((restaurant) => {
      const key = getDedupKey(restaurant);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((restaurant, index) => ({ ...restaurant, rank: index + 1 }));
}

function normalizeExistingRestaurant(restaurant, city) {
  const category = restaurant.category || inferCategory(restaurant);
  const district = restaurant.district || restaurant.amapDistrict || "";
  const normalized = {
    ...restaurant,
    province: city.province,
    city: city.name,
    cityAdcode: city.adcode,
    district,
    districtAdcode: restaurant.districtAdcode || "",
    category,
    categoryGroup: restaurant.categoryGroup || category,
    subcategory: restaurant.subcategory || inferSubcategory({ ...restaurant, category }),
    rating: Number(restaurant.rating || 0),
    averageCost: Number(restaurant.averageCost || 0) || null,
    sourceUpdatedAt,
    locationVerified: Boolean(restaurant.locationVerified || restaurant.location),
  };
  return normalized;
}

function normalizeAmapPoi(poi, city) {
  const business = poi.business || {};
  const bizExt = poi.biz_ext || {};
  const rawTags = business.tag || poi.tag || poi.atag || "";
  const tags = String(rawTags).split(/[;,，；]/).map((tag) => tag.trim()).filter(Boolean);
  const categoryInput = { name: poi.name || "", note: tags.join(" "), tags, type: poi.type || "" };
  const category = inferCategory(categoryInput);
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
    source: "高德POI评分整理",
    rank: 0,
    rating: Number(business.rating || bizExt.rating || 0),
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

function writeCityPackage(city, restaurants) {
  const dir = path.join(root, "data", "cities", city.adcode);
  fs.mkdirSync(dir, { recursive: true });
  const index = restaurants.map((restaurant) => pickFields(restaurant, indexFields));
  const details = Object.fromEntries(restaurants.map((restaurant) => [restaurant.id, restaurant]));
  const report = buildReport(city, restaurants);
  fs.writeFileSync(path.join(dir, "restaurants-index.json"), JSON.stringify(index), "utf8");
  fs.writeFileSync(path.join(dir, "restaurants-details.json"), JSON.stringify(details), "utf8");
  fs.writeFileSync(path.join(dir, "quality-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function buildReport(city, restaurants) {
  return {
    generatedAt: sourceUpdatedAt,
    city: city.name,
    cityAdcode: city.adcode,
    minimumRating: minRating,
    selectedCount: restaurants.length,
    selectedMinimumRating: restaurants.length ? Math.min(...restaurants.map((item) => Number(item.rating))) : null,
    ratingDistribution: countBy(restaurants, (item) => Number(item.rating).toFixed(1)),
    districtDistribution: countBy(restaurants, (item) => item.district),
    categoryDistribution: countBy(restaurants, (item) => item.category),
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
  return /便利店|超市|菜市场|食品店|烟酒|粮油|水果店|生鲜店|药店|培训|公司|工厂|酒店住宿/.test(text);
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
  const location = restaurant.location
    ? String(restaurant.location).split(",").map((value) => Number(value).toFixed(4)).join(",")
    : "";
  return [
    normalizeText(restaurant.name),
    normalizeText(restaurant.address),
    location,
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
}
