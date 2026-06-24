# 人间寻味记

一个面向手机浏览器的杭州随机餐厅打卡应用。无需后端，餐厅库、筛选状态和打卡记录均保存在浏览器 `localStorage` 中。

## 当前功能

- 内置杭州 13 个区县共 1300 家餐厅，每个区域 100 家
- 按餐厅分类、行政区、商圈、距离和排序条件筛选
- 支持定位附近餐厅及“距离优先”
- 球体餐厅动画，随机过程由快到慢并配有音效
- 最终餐厅展示地址、分类、评分、人均、商圈和推荐菜
- 可跳转地图查看餐厅位置
- 餐厅添加、编辑、删除和分类管理
- 打卡后可选择保留或移除餐厅
- 从口味、服务、性价比、环境四方面评分
- 支持文字点评和最多 3 张本地图片
- 打卡图片支持全屏预览
- 数据使用 `localStorage` 持久保存
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

- `restaurants.json`：1300 家餐厅数据
- `scripts/categories.js`：餐厅分类与筛选规则
- `scripts/location-fixed.js`：定位、距离计算和人均解析
- `scripts/validate-restaurants.cjs`：餐厅数据校验

运行数据校验：

```bash
node scripts/validate-restaurants.cjs
```

## GitHub Pages

仓库根目录已经包含 GitHub Pages 可直接访问的入口文件：

- `index.html`
- `modern.html`
- `restaurants.json`
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

## iPhone 使用

使用 Safari 打开线上地址，点击“分享”，选择“添加到主屏幕”。定位功能需要允许 Safari 访问当前位置。

## 隐私说明

定位只在当前设备中用于计算餐厅距离，不会上传到服务器。评分、点评和图片也只保存在当前浏览器的 `localStorage` 中；清理浏览器网站数据后这些内容会被删除。
