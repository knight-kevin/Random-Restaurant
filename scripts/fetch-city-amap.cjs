const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const {
  BUSINESS_AREA_KEYWORDS,
  getCityDefinition,
  RESTAURANT_KEYWORDS,
} = require("./city-definitions.cjs");

const AMAP_KEY = process.env.AMAP_KEY;
const CITY = getCityDefinition(process.env.CITY_ADCODE || process.env.CITY_NAME || "331000");
const ENDPOINT = "https://restapi.amap.com/v3/place/text";
const MAX_PAGES = Number(process.env.MAX_PAGES || 10);
const REQUEST_DELAY_MS = Number(process.env.REQUEST_DELAY_MS || 280);

if (!CITY) {
  console.error("Unknown city. Set CITY_ADCODE=330100 or CITY_ADCODE=331000.");
  process.exit(1);
}

if (!AMAP_KEY) {
  console.error("Missing AMAP_KEY. Set it only in your shell environment, never in source code.");
  process.exit(1);
}

const cachePath = process.env.AMAP_CACHE_PATH || path.join("data", "cache", `amap-poi-${CITY.adcode}.json`);
const legacyCachePath = `.amap-poi-cache-${CITY.adcode}.json`;
const cityWideLegacyCachePath = CITY.adcode === "330100" ? ".amap-poi-cache.json" : "";
const cache = readJson(cachePath, readJson(legacyCachePath, cityWideLegacyCachePath ? readJson(cityWideLegacyCachePath, {}) : {}));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const plans = buildSearchPlans(CITY);
  console.log(`Fetching ${plans.length} search plans for ${CITY.name}, up to ${MAX_PAGES} pages each.`);

  for (const plan of plans) {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const cacheKey = `${CITY.adcode}|${plan.scope}|${plan.keyword}|${page}`;
      if (Array.isArray(cache[cacheKey])) continue;
      const pois = await searchPoi(plan.keyword, page);
      cache[cacheKey] = pois;
      await sleep(REQUEST_DELAY_MS);
      if (pois.length === 0) break;
    }
    writeCache();
    console.log(`${CITY.name} ${plan.scope} ${plan.keyword}: cached ${countPois()} POI rows`);
  }

  writeCache();
  console.log(`Finished ${CITY.name}. Cache written to ${cachePath}`);
}

function buildSearchPlans(city) {
  const plans = [];
  const add = (scope, keyword) => {
    const normalized = `${scope}|${keyword}`;
    if (plans.some((plan) => plan.normalized === normalized)) return;
    plans.push({ scope, keyword, normalized });
  };

  for (const district of city.districts) {
    for (const keyword of RESTAURANT_KEYWORDS) add(district, `${district} ${keyword}`);
  }

  for (const keyword of RESTAURANT_KEYWORDS) {
    add("city", `${city.shortName || city.name} ${keyword}`);
  }

  for (const area of city.businessAreas || []) {
    for (const keyword of BUSINESS_AREA_KEYWORDS) add(area, `${area} ${keyword}`);
  }

  return plans;
}

async function searchPoi(keyword, page) {
  const params = new URLSearchParams({
    key: AMAP_KEY,
    keywords: keyword,
    city: CITY.name,
    citylimit: "true",
    offset: "25",
    page: String(page),
    extensions: "all",
    types: "050000",
    children: "0",
  });

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const data = await requestJson(`${ENDPOINT}?${params}`);
    if (data.status === "1") return Array.isArray(data.pois) ? data.pois : [];
    if (!["10020", "10021", "10022"].includes(data.infocode)) {
      throw new Error(`Amap API error: ${data.info} (${data.infocode})`);
    }
    await sleep(1200 * (attempt + 1));
  }
  throw new Error(`Amap API stayed rate-limited for ${keyword} page ${page}`);
}

function writeCache() {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  const payload = JSON.stringify(cache);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      fs.writeFileSync(cachePath, payload, "utf8");
      return;
    } catch (error) {
      if (attempt === 7) throw error;
      sleepSync(250 * (attempt + 1));
    }
  }
}

function countPois() {
  return Object.values(cache).reduce((sum, pois) => sum + (Array.isArray(pois) ? pois.length : 0), 0);
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    }).on("error", reject);
  });
}

function readJson(filePath, fallback) {
  try {
    return filePath && fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
  } catch {
    return fallback;
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function sleepSync(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}
