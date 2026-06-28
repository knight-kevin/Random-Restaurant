import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = path.resolve(import.meta.dirname, "..");
const baseUrl = "http://127.0.0.1:5173";
const indexData = JSON.parse(fs.readFileSync(path.join(root, "restaurants-index.json"), "utf8"));
const chromePath = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find((candidate) => fs.existsSync(candidate));

let serverProcess = null;

try {
  await ensureServer();
  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
  });

  await runFreshLoadTest(browser);
  await runLegacyCacheMigrationTest(browser);
  await runBadDeletionRepairTest(browser);
  await runLargeOfficialDeletionRepairTest(browser);
  await runStaleOfficialAdditionRepairTest(browser);
  await runResultModalVisibilityTest(browser);
  await runExplainablePickAndAvailabilityTest(browser);
  await runSimplifiedHomeAndTimelineTest(browser);

  await browser.close();
  console.log("mobile smoke tests passed");
} finally {
  if (serverProcess) serverProcess.kill();
}

async function runFreshLoadTest(browser) {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true });
  await page.goto(`${baseUrl}/modern.html?v=test`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#restaurant-count")?.textContent === "3300", null, { timeout: 15000 });
  const toastAboveDialogs = await page.evaluate(() => {
    const toastZ = Number(getComputedStyle(document.querySelector("#toast")).zIndex);
    const mapZ = Number(getComputedStyle(document.querySelector("#map-picker")).zIndex);
    return toastZ > mapZ;
  });
  if (!toastAboveDialogs) throw new Error("Toast should appear above map picker dialogs");
  await page.close();
}

async function runLegacyCacheMigrationTest(browser) {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true });
  await page.addInitScript((legacyRestaurants) => {
    localStorage.clear();
    localStorage.setItem("random-restaurant-checkin:restaurants", JSON.stringify(legacyRestaurants));
  }, indexData.slice(0, 1300));
  await page.goto(`${baseUrl}/modern.html?v=legacy-cache-test`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#restaurant-count")?.textContent === "3300", null, { timeout: 15000 });
  await page.close();
}

async function runBadDeletionRepairTest(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.addInitScript((deletedIds) => {
    localStorage.clear();
    localStorage.setItem("random-restaurant-checkin:restaurant-changes-v1", JSON.stringify({
      added: [],
      overrides: {},
      deletedIds,
    }));
  }, indexData.slice(1300).map((restaurant) => restaurant.id));
  await page.goto(`${baseUrl}/modern.html?v=repair-test`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#restaurant-count")?.textContent === "3300", null, { timeout: 15000 });
  await page.close();
}

async function runLargeOfficialDeletionRepairTest(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.addInitScript((deletedIds) => {
    localStorage.clear();
    localStorage.setItem("random-restaurant-checkin:restaurant-changes-v1", JSON.stringify({
      added: [],
      overrides: {},
      deletedIds,
    }));
  }, indexData.slice(0, 1000).map((restaurant) => restaurant.id));
  await page.goto(`${baseUrl}/modern.html?v=large-official-repair-test`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#restaurant-count")?.textContent === "3300", null, { timeout: 15000 });
  await page.close();
}

async function runStaleOfficialAdditionRepairTest(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const staleAdded = indexData.slice(0, 100).map((restaurant) => ({
    ...restaurant,
    id: `stale-${restaurant.id}`,
  }));
  await page.addInitScript((added) => {
    localStorage.clear();
    localStorage.setItem("random-restaurant-checkin:restaurant-changes-v1", JSON.stringify({
      added: [
        ...added,
        {
          id: "manual-test-restaurant",
          name: "手动新增测试餐厅",
          address: "杭州市测试路 1 号",
          note: "",
          category: "local",
          createdAt: new Date().toISOString(),
        },
      ],
      overrides: {},
      deletedIds: [],
    }));
  }, staleAdded);
  await page.goto(`${baseUrl}/modern.html?v=stale-added-repair-test`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#restaurant-count")?.textContent === "3301", null, { timeout: 15000 });
  await page.close();
}

async function runResultModalVisibilityTest(browser) {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true });
  await page.goto(`${baseUrl}/modern.html?v=modal-test`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#result-modal", { state: "attached", timeout: 15000 });
  await page.evaluate(() => {
    const modal = document.querySelector("#result-modal");
    document.querySelector("#result-modal-heading").innerHTML = `
      <div><p class="eyebrow">锁定目的地</p><h3>鱼大厨·淳鱼直营店(原翠花鱼府)</h3></div>
      <button class="result-modal-close" id="result-modal-x" type="button" aria-label="关闭结果">×</button>
    `;
    document.querySelector("#result-modal-content").innerHTML = `
      <dl>${Array.from({ length: 12 }, (_, index) => `
        <div><dt>详情 ${index + 1}</dt><dd>杭州市 · 淳安县 · 鱼街美食 · 千岛湖镇南景现代城南景路406号，红烧棍子鱼、千岛野娇娇、一鱼两吃、青椒小鱼干、酱爆茄子、桂花鱼卷、红烧红珠鱼、砂锅茄子、干椒大肠、香酥玉米饼</dd></div>
      `).join("")}</dl>
    `;
    modal.hidden = false;
    document.body.classList.add("is-result-modal-open");
  });
  const result = await page.evaluate(() => {
    const content = document.querySelector("#result-modal-content");
    const actions = document.querySelector(".result-modal-actions").getBoundingClientRect();
    return {
      visible: actions.bottom <= window.innerHeight && actions.top >= 0 && actions.height > 0,
      scrollable: content.scrollHeight > content.clientHeight,
    };
  });
  if (!result.visible || !result.scrollable) {
    throw new Error(`结果弹窗按钮不可达：${JSON.stringify(result)}`);
  }
  await page.close();
}

async function runExplainablePickAndAvailabilityTest(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.goto(`${baseUrl}/modern.html?v=explainable-test`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#restaurant-count")?.textContent === "3300", null, { timeout: 15000 });
  await page.evaluate(() => {
    window.__originalConfirm = window.confirm;
    window.confirm = () => true;
  });
  await page.click("#pick-button");
  await page.waitForSelector(".reason-box", { state: "visible", timeout: 7000 });
  const reasonCount = await page.locator(".reason-list li").count();
  if (reasonCount < 1) throw new Error("抽中原因未显示");
  await page.click("[data-result-decision='hide']");
  await page.waitForFunction(() => {
    const raw = localStorage.getItem("random-restaurant-checkin:restaurant-availability-v1");
    return raw && JSON.parse(raw).hiddenIds?.length === 1;
  }, null, { timeout: 5000 });
  await page.click("#manage-tab");
  await page.click("[data-action='restore-hidden']");
  await page.waitForFunction(() => {
    const raw = localStorage.getItem("random-restaurant-checkin:restaurant-availability-v1");
    return raw && JSON.parse(raw).hiddenIds?.length === 0;
  }, null, { timeout: 5000 });
  await page.evaluate(() => {
    if (window.__originalConfirm) window.confirm = window.__originalConfirm;
  });
  await page.close();
}

async function runSimplifiedHomeAndTimelineTest(browser) {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true });
  await page.addInitScript(() => {
    localStorage.setItem("random-restaurant-checkin:pick-mode-v1", JSON.stringify({ pickType: "triple", scene: "budget", prioritizeWishList: true }));
    localStorage.setItem("random-restaurant-checkin:wish-list-v1", JSON.stringify({ items: [{ restaurantId: "legacy", addedAt: new Date().toISOString() }] }));
  });
  await page.goto(`${baseUrl}/modern.html?v=simplified-home-test`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#restaurant-count")?.textContent === "3300", null, { timeout: 15000 });

  if (await page.locator("#scene-modes, #wish-priority-button, [data-pick-type='triple']").count()) {
    throw new Error("首页仍然渲染了已移除的情境/最近想吃/三选一控件");
  }
  const pickButtonRect = await page.locator("#pick-button").boundingBox();
  if (!pickButtonRect || pickButtonRect.y > 650) {
    throw new Error("移动端首屏主随机按钮不可见");
  }
  const countPillRect = await page.locator(".count-pill").boundingBox();
  if (!countPillRect || countPillRect.height > 38) {
    throw new Error("当前可抽数量仍然占用过大视觉空间");
  }
  await page.click("#combined-filter-button");
  await page.waitForSelector("#filter-dropdown:not([hidden])", { timeout: 5000 });
  await page.locator("[data-food-value]").first().click();
  await page.click("#filter-confirm-button");
  await page.waitForFunction(() => document.querySelector("#filter-summary")?.textContent?.includes("当前可抽"), null, { timeout: 5000 });

  await page.evaluate(() => {
    window.__originalConfirm = window.confirm;
    window.confirm = () => false;
  });
  await page.click("#pick-button");
  await page.waitForSelector(".reason-box", { state: "visible", timeout: 7000 });
  if (await page.locator(".choice-card, [data-choice-select]").count()) {
    throw new Error("单抽流程中不应出现三选一候选");
  }
  await page.waitForSelector("#result-complete-button", { state: "visible", timeout: 5000 });
  await page.click("#result-complete-button");
  await page.waitForSelector("#history-view:not([hidden]) .timeline-card", { timeout: 7000 });
  if (await page.locator("#history-count").count()) {
    throw new Error("打卡记录页不应显示重复的记录数 eyebrow");
  }
  const compactCount = await page.locator(".timeline-card .timeline-summary").count();
  if (compactCount < 1) throw new Error("打卡记录时间轴未显示");
  await page.locator(".timeline-card .timeline-summary").first().click();
  await page.waitForSelector(".timeline-card.is-expanded .timeline-detail", { state: "visible", timeout: 5000 });
  await page.evaluate(() => {
    if (window.__originalConfirm) window.confirm = window.__originalConfirm;
  });
  await page.close();
}

async function ensureServer() {
  if (await canReachServer()) return;
  serverProcess = spawn(process.execPath, ["server.mjs"], {
    cwd: root,
    stdio: "ignore",
    env: { ...process.env, HOST: "127.0.0.1", PORT: "5173" },
  });
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await canReachServer()) return;
    await delay(250);
  }
  throw new Error("本地静态服务启动失败");
}

function canReachServer() {
  return new Promise((resolve) => {
    const request = http.get(`${baseUrl}/modern.html`, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.on("error", () => resolve(false));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });
}
