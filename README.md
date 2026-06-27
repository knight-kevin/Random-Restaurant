# 人间寻味记

一个面向手机浏览器的杭州随机餐厅打卡应用。无需后端，内置餐厅库由静态 JSON 提供，用户修改、打卡记录和收藏以增量方式保存在浏览器 `localStorage` 中。

## 当前功能

- 内置杭州 3300 家餐厅：原有 13 个区县均衡库 1300 家，加上好评优先增量库 2000 家
- 按餐厅分类、行政区、商圈、距离和排序条件筛选
- 支持定位附近餐厅及“距离优先”
- 球体餐厅动画，随机过程由快到慢并配有音效
- 最终餐厅展示地址、分类、评分、人均、商圈和推荐菜
- 抽中结果会解释“为什么是它”，例如分类、区域、评分、距离和未打卡原因
- 不想吃时可选择“今天不想吃”“稍后再说”或“不再推荐”，管理页可恢复隐藏餐厅
- 可选择高德、百度、腾讯或 Apple 地图查看餐厅位置，并支持复制地址
- 餐厅添加、编辑、删除和分类管理
- 打卡后可选择保留或移除餐厅
- 从口味、服务、性价比、环境四方面评分
- 支持文字点评和最多 3 张本地图片
- 打卡图片支持全屏预览
- 打卡历史支持收藏餐厅，可在“我的收藏”中随时查看
- 打卡记录升级为美食日记，提供本月打卡、常吃分类、常去区域、最高评分等统计和筛选
- 收藏餐厅可直接打开高德地图，且不受历史记录删除影响
- 用户新增、编辑、删除、打卡和收藏使用 `localStorage` 持久保存，不重复存储完整内置餐厅库
- 管理页提供数据诊断与修复入口，可恢复旧缓存导致的餐厅数量异常
- 数据诊断可查看今日跳过、稍后再说和不再推荐数量，并一键恢复“不再推荐”列表
- 适配 iPhone、移动端浏览器和桌面浏览器
- 支持添加到 iPhone 主屏幕

## 本地运行

项目主页面是 `modern.html`，可以使用内置静态服务器运行：

```bash
node server.mjs
```

然后访问：

```text
http://localhost:5173/
```

也可以安装依赖后使用 Vite：

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

- `restaurants.json`：原有 1300 家基础餐厅
- `restaurants-quality-additions.json`：2000 家好评优先增量餐厅，评分最低 4.4
- `restaurants-index.json`：首屏加载用轻量索引，优先保证手机端快速进入
- `restaurants-details.json`：完整餐厅详情，抽中结果、地图、管理页按需加载
- `restaurants-quality-report.json`：新增餐厅评分、区域、分类、完整度和淘汰原因报告
- `scripts/categories.js`：餐厅分类与筛选规则
- `scripts/location-fixed.js`：定位、距离计算和人均解析
- `scripts/app/restaurant-store.js`：餐厅库加载、旧数据迁移、用户增量差异和健康检查
- `scripts/app/restaurant-filter.js`：筛选、排序与候选结果缓存
- `scripts/app/restaurant-images.js`：餐厅分类图片池、关键词匹配和图片抽样报告
- `scripts/app/restaurant-availability.js`：今日跳过、稍后再说、不再推荐和近期抽中过状态
- `scripts/app/random-reasons.js`：抽中餐厅的原因解释生成
- `scripts/app/food-diary.js`：打卡记录统计与筛选
- `scripts/app/map-links.js`：跨平台地图链接、地图应用顺序和地址复制文本
- `scripts/app/storage.js`：`localStorage` 读写封装
- `scripts/build-quality-additions.cjs`：从本地高德 POI 缓存筛选好评增量餐厅
- `scripts/build-restaurant-index.cjs`：由完整餐厅数据生成轻量索引与详情文件
- `scripts/validate-expanded-restaurants.cjs`：合并数据的评分、坐标、分类和重复校验
- `scripts/report-image-matches.cjs`：按分类输出图片匹配抽样报告
- `scripts/check-doc-encoding.cjs`：检查 README、HTML 和脚本中的中文编码异常
- `tests/mobile-smoke.mjs`：移动端核心流程烟测

运行数据校验：

```bash
node scripts/validate-expanded-restaurants.cjs
node scripts/build-restaurant-index.cjs
```

运行发布前检查：

```bash
npm run test:data
npm run test:e2e
```

`test:data` 会校验 3300 家餐厅数据、生成 `image-match-report.json` 并检查文档编码；`test:e2e` 会在移动端视口下检查 3300 家加载、旧 1300 缓存迁移、异常删除修复、结果弹窗按钮可达性、抽中原因和“不再推荐”恢复。

重新生成好评增量库时，默认评分门槛为 4.0、最多选取 2000 家：

```bash
node scripts/fetch-amap-quality-candidates.cjs
node scripts/build-quality-additions.cjs
```

补采脚本会优先检查本地缓存，候选已充足时不会消耗高德 API 配额；不足时才需要临时设置 `AMAP_KEY`，并支持缓存、断点续采、限流退避和达到目标后提前停止。筛选按评分、搜索出现次数、搜索位置和字段完整度排序；同一品牌全杭州最多 12 家、同一区最多 3 家。当前候选池在严格去重后仍选出了 2000 家，实际最低评分为 4.4、平均评分约 4.525。

## GitHub Pages

仓库根目录已经包含 GitHub Pages 可直接访问的入口文件：

- `index.html`
- `modern.html`
- `restaurants.json`
- `restaurants-index.json`
- `restaurants-details.json`
- `restaurants-quality-additions.json`
- `manifest.webmanifest`
- `scripts/`

在 GitHub 仓库中进入：

```text
Settings > Pages > Build and deployment
```

将 Source 选择为 **Deploy from a branch**，Branch 选择 `main`，目录选择 `/ (root)`，保存后等待部署完成。

线上地址：

```text
https://knight-kevin.github.io/Random-Restaurant/
```

## 跨平台使用

- iPhone / iPad：使用 Safari 打开，可通过“分享 > 添加到主屏幕”安装
- Android / 鸿蒙：使用系统浏览器或 Chrome 打开，可添加到主屏幕
- Windows / macOS / Linux：使用 Chrome、Edge、Safari 或 Firefox 直接访问

定位功能需要浏览器授权访问当前位置。地图按钮会根据设备尝试打开高德地图 App；电脑端或无法识别的平台会打开高德地图网页版。

## 数据修复与缓存刷新

如果某个浏览器显示 1300 家、0 家或按钮无响应，通常是旧版本 `localStorage` 或 GitHub Pages 缓存导致。可以先尝试：

1. 打开“管理餐厅 > 数据诊断”，点击“修复餐厅库”。
2. 如果误点了“不再推荐”，点击“恢复不再推荐”。
3. 线上页面可访问带版本号的地址，或在浏览器中强制刷新。

应用只把用户新增、编辑、删除、跳过、不再推荐、打卡记录、评价图片和收藏保存在本地；官方 3300 家餐厅库来自静态 JSON，不会完整写入 `localStorage`。

## 后续 React/Vite 迁移路线

当前线上入口仍是静态 `modern.html`，这是为了保证 GitHub Pages 稳定可用。后续如果迁回 React/Vite，建议先复用 `scripts/app/` 下的数据层、筛选、图片、地图、日记和随机原因模块，再逐步把导航、筛选面板、结果弹窗、历史记录等 UI 迁成 React 组件。

## 隐私说明

定位只在当前设备中用于计算餐厅距离，不会上传到服务器。评分、点评和图片也只保存在当前浏览器的 `localStorage` 中；清理浏览器网站数据后这些内容会被删除。
