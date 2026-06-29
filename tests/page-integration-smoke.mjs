import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("modern.html", "utf8");

assert.match(html, /platform-links\.js\?v=20260629-v46/);
assert.match(html, /data\/update-manifest\.json/);
assert.match(html, /renderPlatformActions/);
assert.match(html, /data-platform-search/);
assert.match(html, /updateManifest/);

console.log("page integration smoke tests passed");
