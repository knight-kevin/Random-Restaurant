import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import process from "node:process";

const env = { ...process.env };
delete env.AMAP_KEY;

const result = spawnSync(process.execPath, ["scripts/update-city-data.cjs", "--city=331000"], {
  cwd: process.cwd(),
  encoding: "utf8",
  env,
});

assert.notEqual(result.status, 0);
assert.match(`${result.stdout}\n${result.stderr}`, /AMAP_KEY/);
assert.match(`${result.stdout}\n${result.stderr}`, /environment/i);

console.log("update script no-key test passed");
