# Step 05 QA

自动检查入口：

    python tools/qa_step05.py
    npm test

检查维度包括：

- 五章内容深度与占位内容清零
- Blue Cube 与 Winter 关联
- Final 不虚构新年份
- 无长对白 / transcript 型 quote
- 语言偏好、本地继续阅读、阅读进度、上下章
- 档案来源标签、Esc 关闭
- 五季视觉变量与 reduced-motion
- 移动端全站菜单
- manifest / robots / 安全 headers / 原创 SVG icon
- Cloudflare Pages 构建参数
- production build

最终结果以 GitHub Actions 远端 CI 为准。
