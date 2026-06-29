import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("modern.html", "utf8");

assert.match(html, /data\/update-manifest\.json/);
assert.match(html, /updateManifest/);
assert.match(html, /20260630-v48/);
assert.doesNotMatch(html, /platform-links\.js/);
assert.doesNotMatch(html, /renderPlatformActions/);
assert.doesNotMatch(html, /data-platform-search/);
assert.doesNotMatch(html, /美团搜这家/);
assert.doesNotMatch(html, /大众点评搜这家/);
assert.doesNotMatch(html, /data-food-value/);
assert.doesNotMatch(html, /data-sort/);

console.log("page integration smoke tests passed");
