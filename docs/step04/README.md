# Step 04 · Astro + React 运行站

Step 04 将 Step 02 的交互原型与 Step 03 的结构化内容数据连接起来，形成第一套真正的数据驱动静态站。

## 目标路径

- `/` 首页
- `/games` 游戏档案
- `/games/seasons` Seasons 详情
- `/read/seasons/spring-1964` 数据驱动阅读器
- `/timeline` 时间线
- `/characters` 人物档案
- `/lore` 概念档案
- `/progress` 本地游玩进度

## 技术结构

- Astro：静态路由、页面与构建
- React：阅读器交互、档案抽屉、语言切换、游玩进度
- JSON：Step 03 内容源
- localStorage：完成作品与手动剧透解锁
- CSS：延续 Step 02 的“档案纸张”视觉，不引入 Tailwind 依赖

## 数据边界

Astro 页面通过 `src/lib/content.ts` 在构建阶段读取根目录 `content/`，然后把当前章节及实体索引作为序列化 Props 传给 React island。浏览器端不会自行扫描文件系统，也不会维护第二份剧情数据。
