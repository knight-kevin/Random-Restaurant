const { spawnSync } = require("node:child_process");
const { CITY_DEFINITIONS } = require("./city-definitions.cjs");

const args = new Set(process.argv.slice(2));
const cityArg = process.argv.slice(2).find((arg) => arg.startsWith("--city="));
const skipFetch = args.has("--skip-fetch");
const selectedCity = cityArg ? cityArg.split("=")[1] : "";
const targetCities = selectedCity && selectedCity !== "all"
  ? CITY_DEFINITIONS.filter((city) => city.adcode === selectedCity || city.name === selectedCity || city.shortName === selectedCity)
  : CITY_DEFINITIONS;

if (!targetCities.length) {
  console.error("Unknown city. Use --city=330100, --city=331000, or --city=all.");
  process.exit(1);
}

if (!skipFetch && !process.env.AMAP_KEY) {
  console.error("AMAP_KEY is required in the shell environment before updating restaurant POI data.");
  console.error("Example: set AMAP_KEY as a GitHub Actions secret or PowerShell environment variable.");
  process.exit(1);
}

for (const city of targetCities) {
  if (skipFetch) {
    console.log(`Skipping AMap fetch for ${city.adcode}; rebuilding from existing source/cache.`);
    continue;
  }
  run("node", ["scripts/fetch-city-amap.cjs"], {
    ...process.env,
    CITY_ADCODE: city.adcode,
  });
}

run("node", ["scripts/build-city-data.cjs"], process.env);
run("npm", ["run", "test:data"], process.env);

function run(command, commandArgs, env) {
  const executable = process.platform === "win32" && command === "npm" ? "cmd.exe" : command;
  const args = process.platform === "win32" && command === "npm"
    ? ["/d", "/s", "/c", "npm.cmd", ...commandArgs]
    : commandArgs;
  console.log(`> ${command} ${commandArgs.join(" ")}`);
  const result = spawnSync(executable, args, {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
