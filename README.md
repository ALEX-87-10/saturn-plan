# 土星计划 · 个人工作台

一个纯前端静态站，把日常最常用的四件事放在同一个界面里：待办清单、笔记、记账、习惯打卡。

## 特点

- **零后端**：不需要服务器、数据库、账号登录，打开网页即用。
- **数据本地化**：全部内容存在浏览器 `localStorage`（键名 `saturn-plan:state:v1`），不上传任何服务器。
- **原生实现**：不依赖任何框架，只有 ECharts 用于支出结构图，走 jsDelivr CDN。
- **响应式**：手机单列、桌面左侧固定导航，宽屏窄屏都能用。

## 目录结构

```
index.html                      入口，含导航与全局动作
assets/css/styles.css           全部样式（窄屏优先）
assets/js/store.js              数据读写与变更通知
assets/js/ui.js                 转义、金额、日期、提示等工具
assets/js/app.js                路由与视图挂载
assets/js/modules/overview.js   概览
assets/js/modules/tasks.js      待办
assets/js/modules/notes.js      笔记
assets/js/modules/money.js      记账（含图表）
assets/js/modules/habits.js     习惯打卡
assets/icon.svg                 站点图标
.github/workflows/pages.yml     自动构建并部署到 GitHub Pages
```

## 本地运行

浏览器的 `file://` 协议也能运行，但建议起一个静态服务器，避免个别浏览器的本地存储隔离问题：

```bash
python3 -m http.server 8080
# 打开 http://localhost:8080
```

## 部署

推送到 `main` 分支后，GitHub Actions 会自动执行 `configure-pages` → `upload-pages-artifact` → `deploy-pages`，站点发布在：

```
https://<用户名>.github.io/<仓库名>/
```

首次部署时 `configure-pages` 的 `enablement: true` 会顺带开启仓库的 Pages 功能，无需手动到设置页操作。

## 数据说明

- 首次打开会写入几条示例数据，可在侧栏底部「载入示例数据 / 清空全部数据」重置。
- 数据不跨设备、不跨浏览器同步；清理浏览器缓存或换设备会丢失，建议用「导出 JSON 备份」定期留档。
- 换新域名或子路径不影响数据，`localStorage` 跟随域名而非路径。

## 已知边界

- 静态托管没有服务端，因此没有账号、云同步、多人协作、提醒推送。
- 图表依赖 CDN；断网时支出结构会自动降级为 CSS 条形图，其余功能不受影响。
