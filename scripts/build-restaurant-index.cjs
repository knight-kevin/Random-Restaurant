const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceFiles = [
  path.join(root, "restaurants.json"),
  path.join(root, "restaurants-quality-additions.json"),
];

const indexFields = [
  "id",
  "amapId",
  "name",
  "category",
  "categoryGroup",
  "subcategory",
  "district",
  "businessArea",
  "rating",
  "averageCost",
  "rank",
  "location",
];

function pickFields(item, fields) {
  const picked = {};
  fields.forEach((field) => {
    if (item[field] !== undefined && item[field] !== null && item[field] !== "") {
      picked[field] = item[field];
    }
  });
  return picked;
}

const restaurants = sourceFiles.flatMap((file) => JSON.parse(fs.readFileSync(file, "utf8")));
const index = restaurants.map((restaurant) => pickFields(restaurant, indexFields));
const details = Object.fromEntries(restaurants.map((restaurant) => [restaurant.id, restaurant]));

fs.writeFileSync(path.join(root, "restaurants-index.json"), JSON.stringify(index), "utf8");
fs.writeFileSync(path.join(root, "restaurants-details.json"), JSON.stringify(details), "utf8");

console.log(`Wrote ${index.length} restaurants to restaurants-index.json`);
console.log(`Wrote ${Object.keys(details).length} restaurants to restaurants-details.json`);
