# Step 03 自检与修正记录

## 目标核对

- [x] 内容与 UI 分离：章节与实体均由 JSON 数据驱动。
- [x] Game / Chapter / StoryBlock / Character / Event / Concept / Location / Relation / Source 均有数据契约。
- [x] StoryBlock 支持 8 种 MVP 类型。
- [x] 双语正文使用 token，不使用 HTML 字符串。
- [x] 中英文 entity ID 集合自动校验一致。
- [x] Case Notes 可由 featuredRefs + StoryBlock entity refs 生成。
- [x] 防剧透支持跨游戏 requiredCompletedGameIds 与手动 reveal。
- [x] 人物档案允许同一人物的不同事实分别设置剧透级别。
- [x] fact / interpretation / theory 已进入数据结构。
- [x] Timeline 支持 canonical / editorial / uncertain。
- [x] Final 可 timeline=null，不伪造日期。
- [x] 内容来源单独建模并检查引用完整性。
- [x] 图片样例为 placeholder，不打包官方素材。
- [x] 样例无游戏长对白、谜题步骤或完整文本搬运。
- [x] 生成了 Spring 1964 阅读器 ViewModel，证明可驱动 Step 02 三栏结构。

## 第一轮发现的问题

### The Mill 精确发布日期的证据链不完整

问题：stub 中写了 `2015-09-05`，但最初只引用官方 FAQ；FAQ 支撑推荐游玩顺序，却不支撑精确发布日期。

修正：新增 `official-the-mill-presskit` Source，并挂到 The Mill 游戏条目。

## 第二轮结果

`python tools/validate_content.py`：通过。

`python tools/build_reader_view.py`：通过，生成 6 个 StoryBlock、4 个 Case Notes 实体引用。

`python tools/qa_check.py`：15/15 通过。

`python -m unittest discover -s tests -v`：4/4 通过。

`tsc -p tsconfig.json`：strict 编译通过。

## 结论

Step 03 数据层已经稳定，可以进入 Step 04：把 Step 02 原型改造成真正读取这些内容文件的 Astro / React 页面。