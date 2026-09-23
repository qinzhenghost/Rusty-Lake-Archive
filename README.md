# Rusty Lake Archive

Rusty Lake Archive（锈湖档案馆）是一个面向 Rusty Lake / Cube Escape 系列的互动剧情阅读与世界观整理工具。

当前仓库处于 MVP 早期阶段，已完成：

- Step 02：页面信息架构与可点击低保真原型
- Step 03：内容数据 Schema、Seasons 样例数据、防剧透规则、校验与测试

## 当前目录

```text
prototype/              Step 02 可点击 HTML 原型
docs/step02/            页面信息架构与原型 QA
docs/step03/            数据模型、录入规范与数据层 QA
content/                游戏、章节、人物、概念、地点、事件、关系、来源
schema/                 JSON Schema
src/content/            TypeScript 内容类型与 helper
tools/                  内容校验与 ViewModel 构建脚本
tests/                  数据层回归测试
generated/              已生成的阅读器 ViewModel 示例
```

## MVP 核心目标

构建一个“阅读优先、关联探索、防剧透”的 Rusty Lake 剧情档案馆：

1. 按作品与章节阅读剧情摘要
2. 阅读中打开人物 / 概念档案而不中断正文
3. 按故事时间线重新理解跨作品事件
4. 根据用户游玩进度隐藏后续剧透
5. 内容与 UI 完全分离，方便持续新增游戏

## 当前内容范围

第一套结构化样例围绕 `Cube Escape: Seasons`。Spring 1964 已有可渲染的阅读器示例，其余章节仍为明确标注的占位内容。

## 数据层自检

```bash
python tools/validate_content.py
python tools/build_reader_view.py
python tools/qa_check.py
python -m unittest discover -s tests -v
tsc -p tsconfig.json
```

Step 03 当前结果：15/15 目标 QA、4/4 回归测试及 TypeScript strict 编译均通过。

## 下一阶段

Step 04：建立 Astro + React + TypeScript 前端，将 `prototype/` 的交互原型改为真正读取 `content/` 数据运行的网站。

## 内容与版权原则

本项目定位为非官方的剧情整理 / Lore Explorer。内容层优先使用编辑性摘要与必要的短引用，不打包游戏完整文本、谜题攻略或未经授权的官方素材；事实、解释与玩家理论在数据层明确区分。
