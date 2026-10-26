# 上海及周边地区半马赛事

沪苏杭大约 2 小时车程内的半程。`content/races.md` 写每场的开跑时间和报名起止（上海时间），`node build.mjs` 生成两个静态页：

- `index.html` 近期赛事：按开跑日排列，已截止、待抽签、已出签、取消、不办都在这页。
- `open.html` 还能报名：只留报名截止晚于当前上海时间的场次。有 `entry` 才显示「还能报名」和报名入口；窗口还开着但没有报名链接，标「待公布」并链到 `source` 官方页。

状态不用手写标签。构建时用当前上海时间比较 `reg_start` / `reg_end`。更早的有效关窗写 `closed_at`（例如额满）。有 `draw` 时，过了报名截止、还没到抽签时刻是「待抽签」，到点之后是「抽签已出」。`outcome: cancel` 或 `off` 固定为取消 / 不办。

本地复现某一天：`BRIEFING_DATE=2026-10-26 node build.mjs`（只给日期时按当天 12:00）。精确到分钟：`BRIEFING_DATE=2026-11-03T18:01`。

推到 `main` 后，`.github/workflows/pages.yml` 构建并把 `dist/` 推到 `gh-pages`。Pages 来源是 Deploy from a branch：`gh-pages` / `/ (root)`。
