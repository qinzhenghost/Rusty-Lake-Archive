# Step 04 QA

## 本地检查结果

- `python tools/validate_content.py`：通过，26 files / 25 entities / 6 relations。
- `python tools/qa_check.py`：通过，15/15。
- `python -m unittest discover -s tests -v`：通过，4/4。
- `tsc -p tsconfig.content.json --noEmit`：通过。
- `python tools/qa_step04.py`：通过，28/28。
- Reader TSX 静态类型检查：通过。
- 路由 / featured refs / rich-token refs 完整性检查：通过。
- 未打包官方图片、音频或视频资源。

## 已发现并修复的问题

1. Reader 使用 `React.ReactNode` 但未导入 React namespace：改为显式导入 `type ReactNode`。
2. Timeline 使用 `Object.groupBy`，对部分 Node / TS lib 兼容性不稳：改为 typed `reduce`。
3. 动态 Astro 页面 props 的类型推导存在隐式 any 风险：已增加显式 props 类型。
4. GitHub Actions 缺少 Python `jsonschema` 依赖：增加 `requirements-dev.txt` 并在 CI 中显式安装。

## 构建说明

本地执行环境无法连接 npm registry，因此无法把“本地 npm install 成功”作为构建证据。仓库内已加入 GitHub Actions CI，在可联网的远端环境执行 Python 数据校验、Astro/TypeScript 检查和 production build。
