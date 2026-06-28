const fs = require("node:fs");
const https = require("node:https");

const AMAP_KEY = process.env.AMAP_KEY;
const CACHE_PATH = ".amap-poi-cache.json";
const CORE_PATH = "restaurants.json";
const ENDPOINT = "https://restapi.amap.com/v3/place/text";
const MIN_RATING = Number(process.env.MIN_RATING || 4);
const TARGET_POOL = Number(process.env.TARGET_POOL || 3200);
const MAX_PAGES = Number(process.env.MAX_PAGES || 5);
const DISTRICTS = [
  "上城区", "拱墅区", "西湖区", "滨江区", "萧山区", "余杭区", "临平区",
  "钱塘区", "富阳区", "临安区", "桐庐县", "淳安县", "建德市",
];
const KEYWORDS = [
  "餐厅", "美食", "中餐", "杭帮菜", "浙江菜", "私房菜", "农家菜", "川菜", "湘菜",
  "火锅", "潮汕牛肉火锅", "烧烤", "烤肉", "烤鱼", "小龙虾", "海鲜", "酸菜鱼",
  "面馆", "米粉", "馄饨", "饺子", "麻辣烫", "小吃", "快餐", "日本料理", "寿司",
  "韩国料理", "西餐", "牛排", "披萨", "咖啡", "奶茶", "甜品", "烘焙", "自助餐",
];
const DISTRICT_SET = new Set(DISTRICTS);
const cache = readJson(CACHE_PATH, {});
const coreIds = new Set(readJson(CORE_PATH, []).map((item) => String(item.amapId || "")));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  let available = countAvailableCandidates();
  console.log(`当前缓存已有 ${available} 家评分不低于 ${MIN_RATING} 的新增候选。`);
  if (available >= TARGET_POOL) {
    console.log(`已达到候选池目标 ${TARGET_POOL}，无需调用高德 API。`);
    return;
  }
  if (!AMAP_KEY) {
    throw new Error("候选池不足且未设置 AMAP_KEY。请仅在当前命令中设置高德 Web 服务 Key。");
  }

  for (const district of DISTRICTS) {
    for (const keyword of KEYWORDS) {
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const cacheKey = `${district}|${keyword}|${page}`;
        if (!Array.isArray(cache[cacheKey])) {
          cache[cacheKey] = await searchPoi(district, keyword, page);
          writeCache();
          await sleep(280);
        }
      }
      available = countAvailableCandidates();
      console.log(`${district} ${keyword}: ${available}/${TARGET_POOL}`);
      if (available >= TARGET_POOL) {
        console.log("候选池已达到目标，停止补采。");
        return;
      }
    }
  }
  console.log(`补采结束，当前共有 ${countAvailableCandidates()} 家合格新增候选。`);
}

async function searchPoi(district, keyword, page) {
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
    const data = await requestJson(`${ENDPOINT}?${params}`);
    if (data.status === "1") return Array.isArray(data.pois) ? data.pois : [];
    if (!["10020", "10021", "10022"].includes(data.infocode)) {
      throw new Error(`Amap API error: ${data.info} (${data.infocode})`);
    }
    await sleep(1200 * (attempt + 1));
  }
  throw new Error(`高德 API 持续限流：${district} ${keyword} 第 ${page} 页`);
}

function countAvailableCandidates() {
  const unique = new Map();
  Object.values(cache).forEach((pois) => {
    if (!Array.isArray(pois)) return;
    pois.forEach((poi) => {
      if (poi?.id) unique.set(String(poi.id), poi);
    });
  });
  return [...unique.values()].filter((poi) => {
    const rating = Number(poi.business?.rating || poi.biz_ext?.rating || 0);
    return !coreIds.has(String(poi.id)) &&
      rating >= MIN_RATING &&
      Boolean(poi.location) &&
      DISTRICT_SET.has(String(poi.adname || "")) &&
      String(poi.type || "").startsWith("餐饮服务");
  }).length;
}

function writeCache() {
  fs.writeFileSync(`${CACHE_PATH}.partial`, JSON.stringify(cache), "utf8");
  fs.renameSync(`${CACHE_PATH}.partial`, CACHE_PATH);
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

function readJson(path, fallback) {
  try {
    return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : fallback;
  } catch {
    return fallback;
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
