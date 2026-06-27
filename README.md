# 人间寻味记

一个面向手机浏览器的杭州随机餐厅打卡应用。应用不需要后端服务，官方餐厅库由静态 JSON 提供，用户新增、编辑、删除、打卡、评价、收藏和最近想吃等个人数据以增量方式保存在当前浏览器的 localStorage 中。

## 当前功能

- 内置杭州 3300 家餐厅：基础库 1300 家，加上好评优先增量库 2000 家。
- 支持按餐厅分类、行政区、商圈、距离和排序筛选。
- 支持定位附近餐厅和距离优先排序。
- 首页提供情境模式：日常随机、一个人吃、朋友聚餐、约会氛围、想省钱、想吃好的、不想跑远。
- 支持单抽和三选一：三选一会先给出 3 家候选，再进入单店详情。
- 支持最近想吃清单，可在结果弹窗、打卡记录、收藏和管理页加入或移出，并可开启优先最近想吃。
- 球体餐厅动画由快到慢，抽中后弹出结果详情，无需下滑找信息。
- 抽中结果会解释为什么是它，例如匹配当前筛选、情境、高评分、最近想吃、未打卡等。
- 不想吃时可选择今天不想吃、稍后再说或不再推荐，管理页可恢复隐藏餐厅。
- 结果弹窗支持打开地图、复制地址、完成打卡、再抽一次和关闭。
- 地图支持高德、百度、腾讯和 Apple 地图，并按设备调整推荐顺序。
- 打卡记录升级为美食日记，支持统计、筛选、评分、点评、图片预览和收藏。
- 我的收藏为独立二级页面，可随时查看好吃的餐厅。
- 管理餐厅支持新增、编辑、删除、分类修改、打开地图、最近想吃和数据诊断。
- 数据诊断可查看官方库版本、餐厅总数、用户新增/删除/编辑、跳过、不再推荐和最近想吃数量，并可修复异常数据。
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
- `restaurants-index.json`：首屏轻量索引，只包含筛选和抽取必要字段。
- `restaurants-details.json`：完整餐厅详情，按需懒加载。
- `restaurants-quality-report.json`：新增餐厅质量报告。
- `scripts/app/restaurant-store.js`：餐厅库加载、旧数据迁移、用户增量差异和健康检查。
- `scripts/app/restaurant-filter.js`：筛选、排序和结果缓存。
- `scripts/app/restaurant-images.js`：餐厅分类图片匹配。
- `scripts/app/restaurant-availability.js`：今日跳过、稍后再说、不再推荐和近期抽中过。
- `scripts/app/random-reasons.js`：抽中原因生成。
- `scripts/app/pick-modes.js`：情境模式、单抽/三选一和最近想吃优先规则。
- `scripts/app/wish-list.js`：最近想吃本地状态。
- `scripts/app/food-diary.js`：打卡记录统计与筛选。
- `scripts/app/map-links.js`：跨平台地图链接和复制地址。
- `scripts/app/storage.js`：localStorage 读写封装。

## 发布前检查

```bash
npm run test:data
npm run test:e2e
```

`test:data` 会校验 3300 家餐厅数据、生成图片匹配报告并检查文档编码；`test:e2e` 会在移动端视口下检查餐厅加载、旧缓存迁移、异常删除修复、结果弹窗可达性、抽中原因、隐藏恢复、情境模式、最近想吃和三选一流程。

## GitHub Pages

仓库根目录已包含 GitHub Pages 可直接访问的入口文件：

- `index.html`
- `modern.html`
- `restaurants-index.json`
- `restaurants-details.json`
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
https://knight-kevin.github.io/Random-Restaurant/modern.html?v=20260627-v35
```

## 手机端使用建议

- iPhone / iPad：建议用 Safari 打开，可通过分享菜单添加到主屏幕。
- Android：建议用 Chrome 或系统浏览器打开，可添加到主屏幕。
- 定位功能需要浏览器授权当前位置，只用于本机距离估算。
- 点评图片保存在当前浏览器 localStorage 中，清理网站数据会删除这些个人内容。

## 数据修复与缓存刷新

如果某个浏览器显示 0 家、1300 家或控件无响应，通常是旧版本 localStorage 或 GitHub Pages 缓存导致。可以尝试：

1. 打开管理餐厅 > 数据诊断，点击修复餐厅库。
2. 如果误点了不再推荐，点击恢复不再推荐。
3. 如果最近想吃偏好过多，点击清空最近想吃。
4. 访问带最新版本号的页面，或在浏览器中强制刷新。

官方餐厅库不会完整写入 localStorage；本地只保存用户差异数据，因此升级餐厅库时可以保留打卡记录、评价图片、收藏和最近想吃。

## 后续 React/Vite 迁移路线

当前线上入口仍是静态 `modern.html`，这样 GitHub Pages 部署最稳定。后续如果迁回 React/Vite，建议先复用 `scripts/app/` 下的数据层和业务模块，再逐步把导航、筛选面板、结果弹窗、打卡记录、收藏和管理页迁成 React 组件。

## 隐私说明

定位只在当前设备中用于计算餐厅距离，不会上传到服务器。评分、点评、图片、收藏、最近想吃和跳过状态也只保存在当前浏览器的 localStorage 中。
