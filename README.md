# 人间寻味记

一个面向手机浏览器的多城市随机餐厅打卡应用。应用不需要后端服务，官方餐厅库由静态 JSON 提供，用户新增、编辑、删除、打卡、评价和收藏等个人数据以增量方式保存在当前浏览器的 localStorage 中。

## 当前功能

- 首批支持杭州和台州：杭州 4812 家评分 4.0+ 餐厅，台州 7720 家评分 4.0+ 餐厅。
- 首页支持城市切换，切换后会刷新区域、商圈、候选数量和随机池。
- 首页筛选只保留位置能力：定位距离、行政区和商圈。
- 首页改为精简单抽流程：城市、位置筛选、当前可抽数量、大随机按钮和球体动画。
- 位置筛选抽屉集中管理距离、行政区和商圈，首页只显示一行已选摘要。
- 球体餐厅动画由快到慢，抽中后弹出结果详情，无需下滑找信息。
- 抽中结果会解释为什么是它，例如匹配当前筛选、高评分、未打卡、距离较近等。
- 不想吃时可选择今天不想吃、稍后再说或不再推荐，管理页可恢复隐藏餐厅。
- 结果弹窗支持打开地图、复制地址、完成打卡、再抽一次和关闭。
- 已移除美团/大众点评入口，避免不稳定的第三方 App 唤起；保留地图、复制地址和完成打卡等可靠操作。
- 地图支持高德、百度、腾讯和 Apple 地图，并按设备调整推荐顺序。
- 打卡记录升级为紧凑时间轴，支持统计、筛选、展开详情、评分、点评、图片预览和收藏。
- 我的收藏为独立二级页面，可随时查看好吃的餐厅。
- 管理餐厅支持新增、编辑、删除、分类修改、打开地图和数据诊断。
- 数据诊断可查看官方库版本、餐厅总数、用户新增/删除/编辑、跳过和不再推荐数量，并可修复异常数据。
- 适配 iPhone、Android 移动浏览器和桌面浏览器，可添加到手机主屏幕。

## 本地运行

项目主入口是 `modern.html`，推荐使用内置静态服务器：

```bash
node server.mjs
```

然后访问：

```text
http://localhost:5173/
```

也可以使用 Vite：

```bash
npm install
npm run dev
```

Windows PowerShell 如果限制执行 `npm.ps1`，可改用：

```bash
npm.cmd install
npm.cmd run dev
```

## 数据文件

- `restaurants.json`：基础餐厅数据。
- `restaurants-quality-additions.json`：好评优先增量餐厅。
- `cities.json`：城市配置、城市数据版本和数据文件路径。
- `data/cities/330100/restaurants-index.json`：杭州首屏轻量索引。
- `data/cities/330100/restaurants-details.json`：杭州完整餐厅详情。
- `data/cities/330100/quality-report.json`：杭州 4.0+ 质量报告。
- `data/cities/331000/restaurants-index.json`：台州首屏轻量索引。
- `data/cities/331000/restaurants-details.json`：台州完整餐厅详情。
- `data/cities/331000/quality-report.json`：台州质量报告。
- `data/update-manifest.json`：城市餐厅库更新时间、版本、数量和评分门槛。
- `restaurants-index.json` / `restaurants-details.json`：杭州城市包的兼容入口，方便旧浏览器平滑升级。
- `restaurants-quality-report.json`：历史新增餐厅质量报告。
- `scripts/app/restaurant-store.js`：餐厅库加载、旧数据迁移、用户增量差异和健康检查。
- `scripts/app/restaurant-filter.js`：位置筛选和结果缓存。
- `scripts/app/restaurant-images.js`：餐厅分类图片匹配。
- `scripts/app/restaurant-availability.js`：今日跳过、稍后再说、不再推荐和近期抽中过。
- `scripts/app/random-reasons.js`：抽中原因生成。
- `scripts/app/food-diary.js`：打卡记录统计与筛选。
- `scripts/app/map-links.js`：跨平台地图链接和复制地址。
- `scripts/app/storage.js`：localStorage 读写封装。

## 发布前检查

```bash
npm run test:data
npm run test:e2e
```

`test:data` 会校验杭州和台州城市包、生成图片匹配报告并检查文档编码；`test:e2e` 会在移动端视口下检查餐厅加载、城市切换、旧缓存迁移、异常删除修复、位置筛选、单抽结果弹窗、抽中原因、隐藏恢复和打卡记录时间轴。

## 餐厅库更新

城市包由脚本生成，高德 API Key 只通过环境变量传入，不写入代码：

```bash
$env:AMAP_KEY="你的高德Key"
npm run data:city:update -- --city=all
```

也可以只更新单个城市：

```bash
npm run data:city:update -- --city=330100
npm run data:city:update -- --city=331000
```

脚本会依次拉取高德 POI、重建城市包、生成 `data/update-manifest.json` 并运行 `npm run test:data`。重新生成后会更新 `cities.json`、`data/cities/{adcode}/`、`data/update-manifest.json` 以及杭州兼容入口 `restaurants-index.json` / `restaurants-details.json`。

如果只想用已有缓存/源数据重建，不联网：

```bash
npm run data:city:update -- --skip-fetch
```

GitHub Actions 已添加 `Update restaurant data` 工作流：

1. 在仓库 `Settings > Secrets and variables > Actions` 添加 Repository secret：`AMAP_KEY`。
2. 进入 `Actions > Update restaurant data`，点击 `Run workflow` 可手动更新。
3. 工作流也会每周自动运行一次；校验通过后只提交生成后的城市数据、质量报告、图片匹配报告和更新清单。

原始高德缓存位于 `data/cache/`，已在 `.gitignore` 中忽略，不会提交到 GitHub。

## 第三方平台入口

美团和大众点评的 H5 页面无法稳定直接唤起对应 App，微信和部分浏览器也会限制非官方 URL Scheme。本项目不再提供美团/大众点评按钮，避免用户点了却没有可靠反馈；餐厅详情、打卡记录、收藏和管理页仍保留打开地图、复制地址和复制店名+地址。

## GitHub Pages

仓库根目录已包含 GitHub Pages 可直接访问的入口文件：

- `index.html`
- `modern.html`
- `restaurants-index.json`
- `restaurants-details.json`
- `cities.json`
- `data/update-manifest.json`
- `data/cities/`
- `restaurants.json`
- `restaurants-quality-additions.json`
- `manifest.webmanifest`
- `scripts/`

在 GitHub 仓库中进入：

```text
Settings > Pages > Build and deployment
```

将 Source 选择为 `Deploy from a branch`，Branch 选择 `main`，目录选择 `/ (root)`，保存后等待部署完成。

线上地址：

```text
https://knight-kevin.github.io/Random-Restaurant/
```

如果旧浏览器仍显示 1300 家或按钮无响应，优先访问带新版参数的入口，例如：

```text
https://knight-kevin.github.io/Random-Restaurant/modern.html?v=20260629-v47
```

`v37` 重点做了首页视觉降噪：保留分类、单一筛选入口、可抽数量、主随机按钮和球体动画，减少控件堆叠、重阴影和过长卡片文字。

`v41` 增加餐厅索引缓存兜底、本地异常删除修复、旧迁移增量清理和细节优化：如果浏览器拿到旧的 1300/2300 家索引，或本地差异误删了大量官方餐厅，会自动恢复当时的杭州单城完整官方库；旧版本迁移残留的系统采集餐厅也会自动清理。打卡记录页去掉重复记录数，地图复制地址提示会显示在弹层上方。

`v43` 基于移动端工具型界面做视觉精修：导航、筛选入口、随机按钮、球体区域和时间轴卡片统一为更轻的白底橙色体系；我的收藏也改为和打卡记录一致的紧凑时间轴。

`v44` 完成一期城市化：新增杭州/台州城市切换，杭州官方库重新按评分 4.0+ 校验为 3272 家，台州新增 1000 家优质餐厅并覆盖椒江、黄岩、路桥、温岭、临海、玉环、天台、仙居、三门。

`v46` 完成二期第一轮：新增餐厅库更新清单、GitHub Actions 高德数据更新工作流、管理页数据更新状态，以及美团/大众点评搜索入口。

`v47` 精简筛选和平台入口：移除美团/大众点评按钮，首页和筛选抽屉只保留位置筛选；修复城市采集脚本乱码和台州 1000 家上限，杭州扩充为 4812 家 4.0+ 餐厅，台州扩充为 7720 家 4.0+ 餐厅。

## 手机端使用建议

- iPhone / iPad：建议用 Safari 打开，可通过分享菜单添加到主屏幕。
- Android：建议用 Chrome 或系统浏览器打开，可添加到主屏幕。
- 定位功能需要浏览器授权当前位置，只用于本机距离估算。
- 点评图片保存在当前浏览器 localStorage 中，清理网站数据会删除这些个人内容。

## 数据修复与缓存刷新

如果某个浏览器显示 0 家、1300 家或控件无响应，通常是旧版本 localStorage 或 GitHub Pages 缓存导致。可以尝试：

1. 打开管理餐厅 > 数据诊断，点击修复餐厅库。
2. 如果误点了不再推荐，点击恢复不再推荐。
3. 访问带最新版本号的页面，或在浏览器中强制刷新。

官方餐厅库不会完整写入 localStorage；本地只保存用户差异数据，因此升级餐厅库时可以保留打卡记录、评价图片和收藏。

## 后续 React/Vite 迁移路线

当前线上入口仍是静态 `modern.html`，这样 GitHub Pages 部署最稳定。后续如果迁回 React/Vite，建议先复用 `scripts/app/` 下的数据层和业务模块，再逐步把导航、筛选面板、结果弹窗、打卡记录、收藏和管理页迁成 React 组件。

## 隐私说明

定位只在当前设备中用于计算餐厅距离，不会上传到服务器。评分、点评、图片、收藏和跳过状态也只保存在当前浏览器的 localStorage 中。
