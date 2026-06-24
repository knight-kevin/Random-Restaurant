const fs = require("node:fs");
const https = require("node:https");

const AMAP_KEY = process.env.AMAP_KEY;
const RESTAURANTS_PATH = "restaurants.json";
const OUTPUT_PATH = "hangzhou-district-top30-import.json";
const BACKUP_PATH = "restaurants-original-99-backup.json";
const TARGET_PER_DISTRICT = 30;
const DEFAULT_DATE = "2026-06-23T00:00:00.000Z";
const AMAP_ENDPOINT = "https://restapi.amap.com/v5/place/text";

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

const KEYWORDS = [
  "餐厅",
  "美食",
  "火锅",
  "烧烤",
  "杭帮菜",
  "中餐",
  "饭店",
  "私房菜",
  "本帮菜",
  "川菜",
  "湘菜",
  "粤菜",
  "面馆",
  "小吃",
  "海鲜",
  "小龙虾",
  "牛肉",
  "烤肉",
  "日料",
  "日式料理",
  "韩国料理",
  "西餐",
  "自助餐",
  "甜品",
];

if (!AMAP_KEY) {
  console.error("Missing AMAP_KEY. Run with: $env:AMAP_KEY='你的高德Web服务Key'; node scripts\\fetch-amap-district-restaurants.cjs");
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const all = [];

  for (const district of DISTRICTS) {
    const candidates = await collectDistrictRestaurants(district);
    const top = candidates
      .filter((item) => item.locationVerified)
      .sort((left, right) =>
        Number(right.rating > 0) - Number(left.rating > 0) ||
        right.rating - left.rating ||
        left.name.localeCompare(right.name, "zh-CN")
      )
      .slice(0, TARGET_PER_DISTRICT)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    if (top.length < TARGET_PER_DISTRICT) {
      throw new Error(`${district} only has ${top.length}/${TARGET_PER_DISTRICT} verified restaurants. Refine keywords or inspect API response.`);
    }
    const ratedCount = top.filter((item) => item.rating > 0).length;
    console.log(`${district}: ${top.length}/${TARGET_PER_DISTRICT}，其中有评分 ${ratedCount} 家`);
    all.push(...top);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(all, null, 2), "utf8");
  console.log(`Wrote ${OUTPUT_PATH} with ${all.length} restaurants.`);

  replaceRestaurants(all);
}

async function collectDistrictRestaurants(district) {
  const map = new Map();

  for (const keyword of KEYWORDS) {
    for (let page = 1; page <= 3; page += 1) {
      const pois = await searchPoi({ district, keyword, page });
      for (const poi of pois) {
        const item = normalizePoi(poi, district);
        if (!item.name || !item.address) continue;
        const key = `${item.name}|${item.address}`;
        const existing = map.get(key);
        if (!existing || item.rating > existing.rating) map.set(key, item);
      }
      const verifiedRatedCount = [...map.values()].filter((item) => item.rating > 0 && item.locationVerified).length;
      if (verifiedRatedCount >= TARGET_PER_DISTRICT + 10) return [...map.values()];
      await sleep(90);
    }
  }

  return [...map.values()];
}

function searchPoi({ district, keyword, page }) {
  const params = new URLSearchParams({
    key: AMAP_KEY,
    keywords: `${district} ${keyword}`,
    region: "杭州",
    city_limit: "true",
    show_fields: "business",
    page_size: "25",
    page_num: String(page),
  });

  return requestJson(`${AMAP_ENDPOINT}?${params.toString()}`).then((data) => {
    if (data.status !== "1") {
      throw new Error(`Amap API error: ${data.info || "unknown"} (${data.infocode || "no infocode"})`);
    }
    return Array.isArray(data.pois) ? data.pois : [];
  });
}

function normalizePoi(poi, district) {
  const business = poi.business || {};
  const rating = Number(business.rating || 0);
  const cost = business.cost ? `人均：${business.cost}` : "";
  const tag = business.tag ? `标签：${business.tag}` : "";
  const recommend = [tag, cost].filter(Boolean).join("；");

  const amapDistrict = poi.adname || "";
  const location = poi.location || "";

  return {
    id: `amap-${poi.id || slugify(`${district}-${poi.name}`)}`,
    amapId: poi.id || "",
    name: poi.name || "",
    address: poi.address || "",
    note: recommend || "高德公开 POI 评分较高",
    category: inferCategory({
      name: poi.name || "",
      note: `${business.tag || ""} ${poi.type || ""}`,
    }),
    district,
    amapDistrict,
    businessArea: business.business_area || business.business_area_name || "",
    source: "高德POI评分整理",
    rank: 0,
    rating,
    location,
    locationVerified: Boolean(location && amapDistrict === district),
    createdAt: DEFAULT_DATE,
  };
}

function replaceRestaurants(incoming) {
  if (fs.existsSync(RESTAURANTS_PATH) && !fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(RESTAURANTS_PATH, BACKUP_PATH);
  }

  fs.writeFileSync(RESTAURANTS_PATH, JSON.stringify(incoming, null, 2), "utf8");
  console.log(`Replaced ${RESTAURANTS_PATH} with ${incoming.length} verified Amap restaurants.`);
}

function inferCategory(restaurant) {
  const name = String(restaurant.name || "").toLowerCase();
  const note = String(restaurant.note || "").toLowerCase();
  const hasName = (keywords) => keywords.some((keyword) => name.includes(keyword.toLowerCase()));
  const hasNote = (keywords) => keywords.some((keyword) => note.includes(keyword.toLowerCase()));
  if (hasName(["自助", "buffet"]) || hasNote(["自助餐"])) return "buffet";
  if (hasName(["日料", "日本料理", "日式料理", "寿司", "割烹", "居酒屋", "韩食", "韩国料理", "韩式料理"])) return "asian";
  if (hasName(["西餐", "意式", "披萨", "pizza", "bistro", "牛排", "汉堡", "麦当劳", "肯德基", "萨莉亚"])) return "western";
  if (hasName(["火锅", "豆捞", "涮", "暖锅", "羊蝎子", "羊肉炉", "打边炉"])) return "hotpot";
  if (hasName(["烧烤", "烤肉", "烤串", "串串", "烤鱼", "炭烤", "碳烤"])) return "bbq";
  if (hasName(["咖啡", "coffee", "甜品", "烘焙", "蛋糕", "下午茶", "酒馆"])) return "dessert";
  if (hasName(["海鲜", "河鲜", "湖鲜", "鱼馆", "鱼宴", "鱼味", "鱼府", "渔庄", "龙虾"])) return "seafood";
  if (hasName(["牛肉馆", "羊肉馆", "清真", "西域", "新疆"])) return "beef";
  if (hasName(["面馆", "拉面", "拌面", "米粉", "馄饨", "饺子", "麻辣烫", "小吃"])) return "noodle";
  if (hasNote(["寿司", "刺身", "日式料理", "韩国料理"])) return "asian";
  if (hasNote(["意面", "披萨", "pizza", "汉堡"]) && hasNote(["牛排", "沙拉", "薯条", "芝士"])) return "western";
  return "stir";
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
