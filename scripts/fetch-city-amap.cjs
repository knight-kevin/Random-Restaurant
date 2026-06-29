const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const { getCityDefinition, RESTAURANT_KEYWORDS } = require("./city-definitions.cjs");

const AMAP_KEY = process.env.AMAP_KEY;
const CITY = getCityDefinition(process.env.CITY_ADCODE || process.env.CITY_NAME || "331000");
const ENDPOINT = "https://restapi.amap.com/v3/place/text";
const MAX_PAGES = Number(process.env.MAX_PAGES || 5);
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
const cache = readJson(cachePath, readJson(legacyCachePath, {}));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  for (const district of CITY.districts) {
    for (const keyword of RESTAURANT_KEYWORDS) {
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const cacheKey = `${CITY.adcode}|${district}|${keyword}|${page}`;
        if (Array.isArray(cache[cacheKey])) continue;
        cache[cacheKey] = await searchPoi(district, keyword, page);
        await sleep(REQUEST_DELAY_MS);
      }
      writeCache();
      console.log(`${CITY.name} ${district} ${keyword}: cached ${countPois()} POI responses`);
    }
    writeCache();
  }
  writeCache();
  console.log(`Finished ${CITY.name}. Cache written to ${cachePath}`);
}

async function searchPoi(district, keyword, page) {
  const params = new URLSearchParams({
    key: AMAP_KEY,
    keywords: `${district} ${keyword}`,
    city: CITY.name,
    citylimit: "true",
    offset: "25",
    page: String(page),
    extensions: "all",
  });
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const data = await requestJson(`${ENDPOINT}?${params}`);
    if (data.status === "1") return Array.isArray(data.pois) ? data.pois : [];
    if (!["10020", "10021", "10022"].includes(data.infocode)) {
      throw new Error(`Amap API error: ${data.info} (${data.infocode})`);
    }
    await sleep(1200 * (attempt + 1));
  }
  throw new Error(`Amap API stayed rate-limited for ${district} ${keyword} page ${page}`);
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
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
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
