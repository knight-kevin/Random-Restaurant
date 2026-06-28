const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");

(async () => {
  const restaurants = JSON.parse(fs.readFileSync(path.join(root, "restaurants-index.json"), "utf8"));
  const categories = await import(pathToFileURL(path.join(root, "scripts", "categories.js")).href);
  const images = await import(pathToFileURL(path.join(root, "scripts", "app", "restaurant-images.js")).href);
  const report = images.getImageMatchReport(
    restaurants,
    categories.inferRestaurantCategory,
    categories.CATEGORY_LABELS,
    10,
  );
  const outputPath = path.join(root, "image-match-report.json");
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({
    restaurants: restaurants.length,
    categories: Object.fromEntries(Object.entries(report).map(([key, items]) => [key, items.length])),
    output: "image-match-report.json",
  }, null, 2));
})();
