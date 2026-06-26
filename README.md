# 人间寻味记

一个面向手机浏览器的杭州随机餐厅打卡应用。无需后端，内置餐厅库由静态 JSON 提供，用户修改、打卡记录和收藏以增量方式保存在浏览器 `localStorage` 中。

## 当前功能

- 内置杭州 3300 家餐厅：原有 13 个区县均衡库 1300 家，加上好评优先增量库 2000 家
- 按餐厅分类、行政区、商圈、距离和排序条件筛选
- 支持定位附近餐厅及“距离优先”
- 球体餐厅动画，随机过程由快到慢并配有音效
- 最终餐厅展示地址、分类、评分、人均、商圈和推荐菜
- 可选择高德、百度、腾讯或 Apple 地图查看餐厅位置
- 餐厅添加、编辑、删除和分类管理
- 打卡后可选择保留或移除餐厅
- 从口味、服务、性价比、环境四方面评分
- 支持文字点评和最多 3 张本地图片
- 打卡图片支持全屏预览
- 打卡历史支持收藏餐厅，可在“我的收藏”中随时查看
- 收藏餐厅可直接打开高德地图，且不受历史记录删除影响
- 用户新增、编辑、删除、打卡和收藏使用 `localStorage` 持久保存，不重复存储完整内置餐厅库
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
- `scripts/build-quality-additions.cjs`：从本地高德 POI 缓存筛选好评增量餐厅
- `scripts/build-restaurant-index.cjs`：由完整餐厅数据生成轻量索引与详情文件
- `scripts/validate-expanded-restaurants.cjs`：合并数据的评分、坐标、分类和重复校验

运行数据校验：

```bash
node scripts/validate-expanded-restaurants.cjs
node scripts/build-restaurant-index.cjs
```

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

## 隐私说明

定位只在当前设备中用于计算餐厅距离，不会上传到服务器。评分、点评和图片也只保存在当前浏览器的 `localStorage` 中；清理浏览器网站数据后这些内容会被删除。
