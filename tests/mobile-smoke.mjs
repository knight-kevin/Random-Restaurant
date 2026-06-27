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
  await runResultModalVisibilityTest(browser);
  await runExplainablePickAndAvailabilityTest(browser);
  await runPickModeWishListTest(browser);

  await browser.close();
  console.log("mobile smoke tests passed");
} finally {
  if (serverProcess) serverProcess.kill();
}

async function runFreshLoadTest(browser) {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true });
  await page.goto(`${baseUrl}/modern.html?v=test`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#restaurant-count")?.textContent === "3300", null, { timeout: 15000 });
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

async function runPickModeWishListTest(browser) {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true });
  await page.goto(`${baseUrl}/modern.html?v=pick-mode-test`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#restaurant-count")?.textContent === "3300", null, { timeout: 15000 });

  const sceneCount = await page.locator("#scene-modes [data-pick-scene]").count();
  if (sceneCount < 7) throw new Error(`情境模式数量不足：${sceneCount}`);
  await page.click("[data-pick-scene='budget']");
  await page.waitForFunction(() => document.querySelector(".scene-chip.is-selected")?.textContent?.includes("想省钱"), null, { timeout: 5000 });

  await page.click("#pick-button");
  await page.waitForSelector(".reason-box", { state: "visible", timeout: 7000 });
  await page.click("[data-action='toggle-wish'][data-wish-source='result']");
  await page.waitForFunction(() => {
    const raw = localStorage.getItem("random-restaurant-checkin:wish-list-v1");
    return raw && JSON.parse(raw).items?.length === 1;
  }, null, { timeout: 5000 });

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => {
    const text = document.querySelector("#restaurant-count")?.textContent || "";
    return Number(text.replace(/\D/g, "")) > 0;
  }, null, { timeout: 15000 });
  await page.waitForFunction(() => document.querySelector("#wish-priority-button")?.textContent?.includes("1"), null, { timeout: 5000 });
  await page.click("#wish-priority-button");
  await page.click("[data-pick-type='triple']");
  await page.click("#pick-button");
  await page.waitForSelector(".choice-card", { state: "visible", timeout: 7000 });
  const choiceCount = await page.locator(".choice-card").count();
  if (choiceCount < 3) throw new Error(`三选一候选不足：${choiceCount}`);
  const uniqueChoiceIds = await page.$$eval("[data-choice-select]", (buttons) => new Set(buttons.map((button) => button.dataset.choiceSelect)).size);
  if (uniqueChoiceIds !== choiceCount) throw new Error("三选一候选存在重复餐厅");
  await page.locator("[data-choice-select]").first().click();
  await page.waitForSelector("#result-complete-button", { state: "visible", timeout: 5000 });
  await page.waitForSelector(".reason-box", { state: "visible", timeout: 5000 });
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
