# 随机餐厅打卡

一个使用 React + Vite + TypeScript 编写的单页小程序。餐厅库和打卡历史都保存在浏览器 `localStorage` 中，不需要后端服务。

## 安装

```bash
npm install
```

如果在 Windows PowerShell 中遇到 `npm.ps1 cannot be loaded`，可以改用：

```bash
npm.cmd install
```

## 启动

```bash
npm run dev
```

Windows PowerShell 中也可以使用：

```bash
npm.cmd run dev
```

启动后在浏览器打开终端提示的本地地址，通常是：

```text
http://localhost:5173
```

## 免安装临时启动

如果依赖还没有安装，或者 `vite` 命令不可用，可以先用项目内置的静态服务器打开单文件版：

```bash
node server.mjs
```

然后打开：

```text
http://localhost:5173
```

这个方式会加载 `standalone.html`，功能和主应用一致，也使用浏览器 `localStorage` 保存数据。

## 构建

```bash
npm run build
```

## 功能

- 初始预置 99 家餐厅，名称为“餐厅 001”到“餐厅 099”
- 随机抽取当前待打卡餐厅
- 完成打卡后生成历史记录，并可选择移除或保留餐厅
- 添加、编辑、删除餐厅
- 查看、删除、清空打卡历史
- 所有数据刷新后仍保留在 `localStorage`
