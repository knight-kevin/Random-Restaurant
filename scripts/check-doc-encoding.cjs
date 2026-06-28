const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const files = [
  "README.md",
  "index.html",
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
];
const suspiciousPatterns = [
  /\uFFFD/,
  /锛|涓|椁|鎵|鍦|璺|閫|鐢|绛|褰|瀹|鏉|蹇|瑙/,
];

let failed = false;
for (const relativePath of files) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) continue;
  const text = fs.readFileSync(absolutePath, "utf8");
  const matched = suspiciousPatterns.find((pattern) => pattern.test(text));
  if (matched) {
    failed = true;
    console.error(`encoding check failed: ${relativePath} contains suspicious text (${matched})`);
  }
}

if (failed) process.exit(1);
console.log("document encoding check passed");
