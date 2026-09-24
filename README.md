# Rusty Lake Archive｜锈湖档案馆

一个面向 Rusty Lake / Cube Escape 系列的非官方互动剧情阅读与世界观整理工具。项目坚持“阅读优先、关联探索、防剧透”，不做逐步攻略站。

当前进入 **Step 09**。已经形成三套完整阅读档案：

- 《逃离方块：四季》 / Cube Escape: Seasons
- 《逃离方块：锈湖湖畔》 / Cube Escape: The Lake
- 《逃离方块：阿尔勒》 / Cube Escape: Arles

## 当前能力

- 数据驱动的游戏、章节、人物、概念、地点、事件与 Relation
- 桌面三栏剧情阅读器；移动端正文优先 + Bottom Sheet
- 全站中文 / English 切换并记住语言偏好
- 中文实体名为主，英文原名作为补充
- 首页继续阅读、阅读百分比、上一章 / 下一章
- Rich Token 实体点击与完整档案抽屉
- 全站结构化搜索，中文与英文可交叉检索
- Lore Network 世界观关系网与反向导航
- localStorage 游玩进度、跨作品防剧透与主动解锁
- 事实 / 解释 / 理论分层，并保留来源 ID
- Seasons 时间线；对缺少可靠年份的作品保持 undated，不用发布日期冒充故事年份
- Cloudflare Workers 静态部署：`npm run build` → `dist`

## 本地运行

    npm install
    npm run dev

完整检查：

    npm test

## 内容与版权原则

正文优先采用原创编辑摘要和必要的结构化事实。不复制完整游戏对白，不提供谜题密码与逐步攻略，不打包未经授权的官方美术、音频或视频。历史人物进入游戏档案时，明确区分“游戏中的改编”与现实人物传记。

## 部署

Production branch: `main`  
Build command: `npm run build`  
Output: `dist`  
Node: 22

Cloudflare 细节仍见 `docs/step05/DEPLOY_CLOUDFLARE.md`。
