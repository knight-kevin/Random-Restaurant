import assert from "node:assert/strict";
import {
  getPlatformSearchLinks,
  getPlatformSearchQuery,
} from "../scripts/app/platform-links.js";

const restaurant = {
  name: "\u5c71\u91cc\u6d6a\u91cd\u5e86\u80a5\u706b\u9505(\u676d\u5dde\u5e97)",
  city: "\u676d\u5dde\u5e02",
  address: "\u4e0a\u57ce\u533a\u4e2d\u5c71\u4e2d\u8def1\u53f7",
};

const query = getPlatformSearchQuery(restaurant);
assert.equal(query, "\u676d\u5dde\u5e02 \u5c71\u91cc\u6d6a\u91cd\u5e86\u80a5\u706b\u9505(\u676d\u5dde\u5e97) \u4e0a\u57ce\u533a\u4e2d\u5c71\u4e2d\u8def1\u53f7");

const links = getPlatformSearchLinks(restaurant);
assert.equal(links.length, 2);
assert.deepEqual(links.map((link) => link.value), ["meituan", "dianping"]);
assert.equal(links[0].label, "\u7f8e\u56e2\u641c\u8fd9\u5bb6");
assert.equal(links[1].label, "\u5927\u4f17\u70b9\u8bc4\u641c\u8fd9\u5bb6");

for (const link of links) {
  assert.match(link.url, /^https:\/\//);
  assert.match(decodeURIComponent(link.url), /\u676d\u5dde\u5e02/);
  assert.match(decodeURIComponent(link.url), /\u5c71\u91cc\u6d6a/);
}

console.log("platform link tests passed");
