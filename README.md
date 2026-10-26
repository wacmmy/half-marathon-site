# 半马简报

沪苏杭半程马拉松报名状态。每期一个 markdown 放在 `content/`，`node build.mjs` 生成 `dist/`（零依赖，Node 18+）。

文件名：`content/YYYY-MM-DD.md`。frontmatter：`date`、`headline`、`lead`。正文固定四段：`要点`、`侧栏`、`赛事`、`来源`，可选 `附注`。赛事按日期分组，未知的报名费、名额、抽签日写「待公布」。

GitHub Pages 由 `.github/workflows/pages.yml` 在推送到 `main` 后构建，并把 `dist/` 推到 `gh-pages` 分支。仓库 Settings → Pages 的来源是 Deploy from a branch：`gh-pages` / `/ (root)`。这个流程不使用 `github-pages` environment。
