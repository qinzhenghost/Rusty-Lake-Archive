# Rusty Lake Archive

Rusty Lake Archive（锈湖档案馆）是一个面向 Rusty Lake / Cube Escape 系列的非官方互动剧情阅读与世界观整理工具。

当前已进入 **Step 04**：Step 02 的低保真原型与 Step 03 的结构化内容已经连接成 Astro + React 静态站。

## 当前能力

- 数据驱动首页、游戏档案与 Seasons 章节路由
- 三栏剧情阅读器（移动端正文优先 + Bottom Sheet）
- 中文 / English / 中英对照切换
- Rich Token 人物 / 概念点击，不使用 HTML 字符串注入
- 人物 / 概念档案抽屉
- 基于 `content/events` 自动生成故事时间线
- `localStorage` 游玩进度与跨作品防剧透
- `fact / interpretation / theory` 内容层分离

## 本地运行

```bash
npm install
npm run dev
```

完整检查：

```bash
npm test
python tools/qa_step04.py
```

## 目录

```text
src/pages/              Astro 页面与静态路由
src/components/         React 交互岛
src/lib/                内容读取与页面模型
src/content/            Step 03 类型与防剧透 helper
src/styles/             全局视觉系统
content/                游戏、章节、人㉩、概念、事件等 JSON 数据
schema/                 JSON Schema
prototype/              Step 02 原型留档
docs/step02/            原型 IA / QA
docs/step03/            数据模型 / 内容规范 / QA
docs/step04/            运行站设计与 QA
tools/                  数据、构建辅助和 QA 脚本
tests/                  数据层回归测试
```

## MVP 核心路径

`首页 → Seasons → Spring 1964 → 点击人物/概念 → 档案抽屉 → 时间线 → 防剧透进度`

## 内容与版权原则

本项目定位为非官方 Lore Explorer。内容优先使用原创编辑摘要与必要短引用，不打包完整游戏文本、谜题攻略或未经授权的官方美术 / 音频；事实、解释与玩家理论在数据层明确区分。
