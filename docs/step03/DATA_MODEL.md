# Step 03 — Content Data Model

## 1. 设计目标

这套模型要同时驱动：剧情阅读器、人物/概念抽屉、时间线、进度防剧透，以及未来的关系图与 AI 检索。内容不能依赖某个具体 React 组件。

## 2. 核心实体

| 实体 | 作用 | 当前样例 |
|---|---|---|
| `game` | 作品元数据与章节索引 | Seasons、The Mill stub |
| `chapter` | 阅读器最小页面单位 | Spring 1964 等 5 章 |
| `storyBlock` | 章节正文组件 | scene / paragraph / image / event / note 等 |
| `character` | 人物档案 + 分级事实 | Laura / Harvey / Corrupted Soul |
| `concept` | 概念/物品词条 | Memory / Memory Cube / Black Cube / Rusty Lake |
| `location` | 地点词条 | Laura's Room / Rusty Lake |
| `event` | 可进入时间线的事件 | 四个季节时间点 |
| `relation` | 知识图谱边 | appears_in / companion_of / precedes 等 |
| `source` | 内容来源与事实追踪 | 官方 press kit / FAQ / 游戏本体 / 编辑层 |

## 3. 双语正文不用 HTML

正文采用 token 数组：

```json
{
  "zhHans": [
    {"kind":"text","text":"1964 年的春天，"},
    {"kind":"entity","entity":{"type":"character","id":"laura-vanderboom"},"label":"Laura"}
  ],
  "en": [
    {"kind":"text","text":"In the spring of 1964, "},
    {"kind":"entity","entity":{"type":"character","id":"laura-vanderboom"},"label":"Laura"}
  ]
}
```

收益：
- 切换语言后实体链接不会丢失；
- 无需 `innerHTML`；
- 搜索、关系图、RAG 都可直接拿到实体 ID；
- QA 可检查中英文实体集合是否一致。

## 4. 防剧透模型

所有可展示内容均可携带 `spoiler`：

```json
{
  "level": "cross-game",
  "requiredCompletedGameIds": ["the-mill"],
  "allowManualReveal": true
}
```

默认判定：

```text
requiredCompletedGameIds 全部包含于 user.completedGameIds
    -> visible
否则
    -> redacted
```

手动展开只记在用户本地 override 中，不修改全局游玩进度。

## 5. 事实与推测分层

档案事实和关系边必须携带：

`claimKind = fact | interpretation | theory`

页面默认可以对三者使用不同标签，避免把编辑解释或社区理论显示成官方事实。

## 6. 时间不是简单日期字符串

事件使用：`year + season + sortKey + certainty`。

`certainty = canonical | editorial | uncertain`

章节可以 `timeline: null`。因此像 Final 这类叙事章节不需要为了排序被硬塞进一个虚构年份。

## 7. 内容版权边界进入 Schema

正文 `provenance.mode`：

- `editorial-summary`：项目原创剧情摘要；
- `short-quote`：必要的短引用；
- `original-note`：产品说明/编辑注；
- `structural-label`：章节标题等结构文本。

校验器会限制 `short-quote` 的长度。默认不录入谜题步骤与长对白。

## 8. UI 映射

### 左侧 Chapter
来自 `game.chapterIds` → `chapter.title / timeline / narrativeOrder`。

### 中间 Story
直接渲染 `chapter.storyBlocks`。

### 右侧 Case Notes
不是单独复制一套文字。由 `chapter.featuredRefs` + story block 中的实体引用生成。

### Timeline
只读取 `event.timeline`，按 `sortKey` 排序。

### 人物 / 概念 Drawer
读取实体 `summary + entries`，逐 entry 做 spoiler resolver。

## 9. 扩展规则

以后增加新游戏：
1. 新建 `game`；
2. 添加章节文件；
3. 添加/复用人物、地点、概念；
4. 添加 timeline events；
5. 补 relations；
6. 把文件加入 manifest。

正常情况下无需修改阅读器页面结构。