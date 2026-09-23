# Rusty Lake Archive

Rusty Lake Archive（锈湖档案馆）是一个面向 Rusty Lake / Cube Escape 系列的非官方互动剧情阅读与世界观整理工具。

当前进入 Step 05：Seasons 五章剧情阅读、档案联动、防剧透、阅读状态与上线准备已经形成一套可公开测试的静态站。

## 当前能力

- Cube Escape: Seasons 五章原创剧情摘要：Spring 1964 / Summer 1971 / Fall 1971 / Winter 1981 / Final
- 数据驱动游戏、章节、人物、概念、地点与事件页面
- 桌面三栏剧情阅读器；移动端正文优先 + Bottom Sheet
- 中文 / English / 中英对照，并记住语言偏好
- 首页“继续阅读”，自动返回上次章节
- 阅读百分比与上 / 下一章导航
- Rich Token 人物 / 概念点击，不使用 HTML 字符串注入
- 人物 / 概念档案抽屉，显示 fact / interpretation / theory 与来源 ID
- 基于 content/events 自动生成故事时间线
- localStorage 游玩进度、跨作品防剧透与主动解锁记录
- Spring / Summer / Fall / Winter / Final 季节视觉变量
- Cloudflare Pages 静态部署准备：npm run build → dist

## 本地运行

    npm install
    npm run dev

完整检查：

    npm test

## Cloudflare Pages

部署参数：

- Production branch: main
- Build command: npm run build
- Build output directory: dist
- Node: 22

详细步骤见 docs/step05/DEPLOY_CLOUDFLARE.md。

## 内容与版权原则

本项目定位为非官方 Lore Explorer。正文优先使用原创编辑摘要与必要的结构化事实，不复制完整游戏文本、不提供逐步谜题攻略、不打包未经授权的官方美术 / 音频 / 视频；事实、解释与玩家理论在数据层明确区分。
