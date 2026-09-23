# Cloudflare Pages 部署

本项目当前是纯静态 Astro 站点，不使用 SSR，因此不需要 Cloudflare Astro adapter。

## Git 集成设置

在 Cloudflare Dashboard：

1. Workers & Pages → Create application → Pages。
2. 选择 Import an existing Git repository。
3. 连接 GitHub 仓库 qinzhenghost/Rusty-Lake-Archive。
4. Production branch：main。
5. Root directory：仓库根目录（留空即可）。
6. Build command：npm run build。
7. Build output directory：dist。
8. 如构建环境没有自动选中 Node 22，可设置环境变量 NODE_VERSION=22。
9. 保存并部署。

部署成功后 Cloudflare Pages 会提供 pages.dev 地址；之后 main 分支 push 会自动触发生产构建，其他分支 / PR 可获得 Preview Deployment。

## 仓库已准备

- .nvmrc：22
- 静态输出：dist
- public/_headers：安全头 + Astro hashed assets 长缓存
- public/robots.txt
- public/site.webmanifest
- public/icon.svg
- 自定义 src/pages/404.astro

## 部署前检查

    npm install
    npm test

只有 CI 全绿后再连接 Pages。
