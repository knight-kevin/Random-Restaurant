const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");

(async () => {
  const citiesPath = path.join(root, "cities.json");
  const cities = fs.existsSync(citiesPath)
    ? JSON.parse(fs.readFileSync(citiesPath, "utf8"))
    : [{ name: "默认", indexPath: "restaurants-index.json" }];
  const categories = await import(pathToFileURL(path.join(root, "scripts", "categories.js")).href);
  const images = await import(pathToFileURL(path.join(root, "scripts", "app", "restaurant-images.js")).href);
  const report = {};
  let restaurantCount = 0;
  for (const city of cities) {
    const restaurants = JSON.parse(fs.readFileSync(path.join(root, city.indexPath), "utf8"));
    restaurantCount += restaurants.length;
    const cityReport = images.getImageMatchReport(
      restaurants,
      categories.inferRestaurantCategory,
      categories.CATEGORY_LABELS,
      10,
    );
    Object.entries(cityReport).forEach(([category, items]) => {
      report[`${city.name}:${category}`] = items;
    });
  }
  const outputPath = path.join(root, "image-match-report.json");
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({
    restaurants: restaurantCount,
    cities: cities.map((city) => city.name),
    categories: Object.fromEntries(Object.entries(report).map(([key, items]) => [key, items.length])),
    output: "image-match-report.json",
  }, null, 2));
})();
