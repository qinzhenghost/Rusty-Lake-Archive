# Step 05 · 阅读体验、Seasons 内容补全与上线准备

## 目标

Step 05 把 Step 04 的“可运行 MVP”推进到可公开测试的阅读器：

- Seasons 五章都具备原创剧情摘要，不再存在内容占位页。
- Spring / Summer / Fall / Winter / Final 使用同一阅读深度和数据结构。
- 新增 Blue Cube 概念与跨季节关系。
- 阅读器支持语言偏好记忆、继续阅读、阅读百分比、上/下一章、实体来源标记。
- 移动端拥有全站导航以及阅读器 Bottom Sheet。
- 视觉仍保持 Archive / Paper / Memory，但增加季节级色彩变量，不模拟官方游戏 UI。
- 增加 manifest、原创 SVG 图标、robots 与 Cloudflare Pages _headers。
- GitHub Actions 同时运行 Step03、Step04、Step05 QA、Astro/TypeScript check 和 production build。

## 内容边界

剧情文本是项目原创摘要。保留关键人物、事件、时间与意象之间的关系，但不复制完整对白、不输出逐步谜题攻略、不打包官方截图、音频或视频。

## 下一步候选

Step 06 可以从两条路线选择：

1. 扩充第二部作品 Cube Escape: The Lake，验证跨作品剧透与关联。
2. 先做关系图 / 搜索，把现有结构化数据的探索价值做出来。
