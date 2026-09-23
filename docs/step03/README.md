# Rusty Lake Archive — Step 03 数据层

本包把 Step 02 的静态原型转换为可维护的数据契约。

## 目录

```text
schema/content-item.schema.json   JSON Schema 2020-12
content/manifest.json             内容入口
content/games/                    游戏
content/chapters/                 阅读章节
content/characters/               人物档案
content/concepts/                 概念
content/locations/                地点
content/events/                   时间线事件
content/relations/                关系边
content/sources/                  来源
src/content/schema.ts             前端 TypeScript 类型
src/content/spoiler.ts            防剧透 resolver
src/content/richtext.ts           双语 rich text helper
tools/validate_content.py         Schema + 语义校验
tools/build_reader_view.py        生成阅读器 ViewModel
tests/test_content.py             回归测试
generated/                        校验后生成的 UI 数据
```

## 自检

```bash
python tools/validate_content.py
python tools/build_reader_view.py
python tools/qa_check.py
python -m unittest discover -s tests -v
tsc -p tsconfig.json
```

## 当前内容范围

`Cube Escape: Seasons` 为结构化样例；Spring 1964 有可渲染示例正文，其余章节目前是明确标注的内容占位，不伪装成完整剧情。

正式录入前请阅读 `AUTHORING_GUIDE.md`。