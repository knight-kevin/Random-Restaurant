const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const files = [
  "README.md",
  "index.html",
  "modern.html",
  "manifest.webmanifest",
  "scripts/categories.js",
  "scripts/location-fixed.js",
  "scripts/app/restaurant-store.js",
  "scripts/app/restaurant-filter.js",
  "scripts/app/restaurant-images.js",
  "scripts/app/restaurant-availability.js",
  "scripts/app/random-reasons.js",
  "scripts/app/food-diary.js",
  "scripts/app/map-links.js",
  "scripts/city-definitions.cjs",
  "scripts/fetch-city-amap.cjs",
  "scripts/build-city-data.cjs",
  "scripts/update-city-data.cjs",
  "scripts/category-rules.cjs",
];

const suspiciousPatterns = [
  { label: "replacement character", regex: /\uFFFD/ },
  { label: "common mojibake", regex: /(浜洪棿|鎶介|鎵撳崱|椁愬巺|褰撳墠|缇庨|鎺掑簭|閫夋嫨|鍦板浘|鏁版嵁|璁板綍|鏀惰棌|姝ｅ湪|宸插|鏈€|鐐硅瘎|鍒犻櫎|缂栬緫|銆|锛)/ },
];

let failed = false;

for (const relativePath of files) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) continue;
  const text = fs.readFileSync(absolutePath, "utf8");
  const matched = suspiciousPatterns.find((pattern) => pattern.regex.test(text));
  if (matched) {
    failed = true;
    console.error(`encoding check failed: ${relativePath} contains ${matched.label}`);
  }
}

if (failed) process.exit(1);
console.log("document encoding check passed");
