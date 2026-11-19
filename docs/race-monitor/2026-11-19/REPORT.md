# 2026-11-19赛事巡检研究交付

判断时间：2026-11-19 13:40（上海时间）。本资料只写bot电脑/workspace/race-monitor-20261119，不触及仓库/网站/例行；由父级接力发布。

## 结论
- 对照11/16版34场，确认新增三场：西岸10K、NB上海10K、2027元旦嘉定半马；并非只围绕三场搜索：目录、新闻、全国当届详情与网络补漏快照共112页，范围及失败见日志。
- 额外实质修正两项：总裁10K官方移动端已满员截止；西山漾增加无包10K60元选项，标准120元保留。
- 太仓/西山漾/嘉定入口读到报名中；西岸分批放号，仅报名期内不保证实时余量；NB抽签已公布但候补截止图片待父级读，不编时间。
- 十组来源均已处理，但上马JS、有迈故障、大丰刷新及汇跑第6页/部分图片仍有缺口。不能把“读到页面”说成完整全网覆盖。发布可先补已证实内容，说明未核项；若要宣称本轮完整结束，须先完成browser_tasks.md。

## 每源检查范围
|来源|实际检查范围|结果|
|---|---|---|
|huipao|目录1-30页（第6页首次200无链接保留缺口），新闻1-6页；翻至2024；NB在目录第10页；初始只看首页确会漏|partial_one_page_and_images|
|guolong|赛事目录1-4页全部（至2018）；新闻/公告各首页，已跨至2025/2024；总裁PC/移动状态差异核实|readable_current_catalog|
|xuanda|新闻、当届规程、报名须知；当前2026站已读，报名JS余量未核|readable_rules_live_inventory_unknown|
|donghao|HTTP200纯JS；未渲染；不可记无新增|browser_required|
|xempower|公司全国首页/新闻及5个链接赛事站；佘山2026、南京2026；阳澄湖/苏马/天目湖链接站仍2025，未把旧站当2026|partial_stale_sites|
|umay|已确认官网504/SSL，嘉兴官方站500；采用地方官方发布会公告补证嘉兴，不冒称全国目录已扫|failed_catalog|
|borun|目录1-8页翻至2025；从图片卡href下钻24个2026赛事详情，其中2个详情SSL失败；新闻首页；本地两场诸暨/象山已过，未见新增符合范围未来条目|partial_with_failed_snapshots|
|rtt|新闻1-3页翻至2023；2027规程/regnotice已核；/registration和gole查询页2026旧版；平台86950报名中|readable_current_event|
|shengba|黄浦赛事首页及2026规程；无2027新公告证据；独立公司目录未找到|readable_single_event_only|
|dafeng|先前公司新闻可读但最新2025，本轮快照SSL；金漪湖官方当届规程先前可读、本轮采集500；保留故障，不能宣布完整|partial_failed_refresh|

## 网络补漏与排除
读了浙江官方赛事日历、江浙沪最酷100条一页、黑练上海/江苏/浙江全国型地区目录；另做2026末/2027上海苏杭及周边10K/半马关键词补漏。沿公司全国目录先采候选再筛地区，未设置未来三个月限制。无依据的未来2027春赛预测仍只作候选。
- 新见同日嘉定5.4K趣跑排除，不重复算半马。
- 全国目录中的外省/南京/扬州等超原约2小时范围不擅自扩圈；象山、舟山、玉环、金漪湖维持现站既有排除。
- 汇跑张家港联赛第三站10/17、长兴彩虹10K5/4、渣打上海10K5/16等历史线索记录为基线，不列当前还能报名，不以这些样本宣称已重建全年历史赛历。
- 太湖1号当前页面还写“拟定/敬请期待”；搜索摘要把日期过了便说已结束不可信，未采纳。
- 最酷目录截止与详情经常不同（WSE等），以当届主办/具体报名页为先，不把页尾推荐赛事截止套给主赛事。

## 新增来源待父级写入例行
详见new_sources_for_routine.json：
1. 苏奥体育：当届太仓完整规程明确运营单位，原十组缺这一家；纳入QueenRun/坤悦健康赛事线。公共可查深链81804/32366/56761先固定，但它们是报名平台，不冒充公司总目录。官方xishanmls当前500，下一轮仍需找可读公司总目录或官方小程序公开列表。
2. 渣打上海10K：已读品牌官方赛事站sc.chinarun.com，可放品牌固定赛事层监测下一届；实际运营公司未确认，不臆造。
3. 既有嘉定源修正入口：用/regnotice和2027报名86950；/registration、gole/gsTf是2026旧届，不应再作为2027窗口来源。

## 下一轮比较办法
source_registry.json保存现有十组、候选增补及盲点；baseline.json保存本轮每源URL、标题/链接、正文指纹和已知赛事；source_checks.json记每请求时间/状态。下轮先比规范赛事ID/URL与标题，发现新条目才深入；正文hash只作辅助（倒计时/浏览量会变）。逐页翻到上轮已知条目，未知新增追回举办/运营方并提议加入来源。失败来源单列，不写“无新增”。

## 文件
- EDIT_BRIEF.md：给编码代理的精简内容编辑清单。
- changes.json：三新增、两修改、关键重查、排除与证据。
- evidence_snapshots.json：公开正文及链接快照（非全部图片内容）。
- source_checks.json / source_registry.json / baseline.json：检查日志/来源表/后续基线。
- new_sources_for_routine.json：待父级加入例行的具体来源。
- browser_tasks.md：父级只读浏览器补核事项。
- site_20261116.txt：本轮比较的线上旧版快照。

## 真实失败（包含已有成功页面的后续保存失败，未抹去）
- https://gw.iborun.cn/products/：failed，SSLError: HTTPSConnectionPool(host='gw.iborun.cn', port=443): Max retries exceeded with url: /products/ (Caused by SSLError(SSLEOFError(8, '[SSL: UNEXPECTED_EOF_WHILE_READING] EOF occurred in violation of protocol (_ssl.c:1029)')))
- https://www.runthetrack.com/registration/reginfo：failed，SSLError: HTTPSConnectionPool(host='www.runthetrack.com', port=443): Max retries exceeded with url: /registration/reginfo (Caused by SSLError(SSLEOFError(8, '[SSL: UNEXPECTED_EOF_WHILE_READING] EOF occurred in violation of protocol (_ssl.c:1029)')))
- http://www.jdim.org/p/hzim/match/textrule.jsf：failed_or_empty，HTTP/正文异常
- https://reg.zuicool.com/57267：failed，SSLError: HTTPSConnectionPool(host='reg.zuicool.com', port=443): Max retries exceeded with url: /57267 (Caused by SSLError(SSLEOFError(8, '[SSL: UNEXPECTED_EOF_WHILE_READING] EOF occurred in violation of protocol (_ssl.c:1029)')))
- https://gw.iborun.cn/2026-p00166p1.html：failed，SSLError: HTTPSConnectionPool(host='gw.iborun.cn', port=443): Max retries exceeded with url: /2026-p00166p1.html (Caused by SSLError(SSLEOFError(8, '[SSL: UNEXPECTED_EOF_WHILE_READING] EOF occurred in violation of protocol (_ssl.c:1029)')))
- https://gw.iborun.cn/2026-p00179p1.html：failed，SSLError: HTTPSConnectionPool(host='gw.iborun.cn', port=443): Max retries exceeded with url: /2026-p00179p1.html (Caused by SSLError(SSLEOFError(8, '[SSL: UNEXPECTED_EOF_WHILE_READING] EOF occurred in violation of protocol (_ssl.c:1029)')))
- https://static.shang-ma.com/web/index.html：browser_required，已读原始页200但无赛事正文；无浏览器，交父级，不记成功
- https://www.umaysports.cn/：failed，WebFetch504，公开直接请求SSL错误；停止重复请求
- http://jiaxingmarathon.umaysports.cn/：failed，公开直接请求500，使用嘉兴官方地方公告补证但目录未完成
- https://dafengsports.saihuitong.com/articles?mid=76061：partial_prior_snapshot，先前WebFetch可读2025/2024新闻，后续公开请求SSL错误，未再盲重试；公司目录不算本轮完整
- https://www.ihuipao.com/race?page=6：failed_or_empty，首次请求200但无赛事链接，保留分页缺口，未偷偷视为成功
- https://chinamarathon.com/events/16673：failed，WebFetch超时；改用已链接最酷页/政府公告核实，不重复此路径
- https://sh.bendibao.com/news/20261119/310483.shtm：failed，公开直接请求403；未绕过，2027官方/regnotice现可读，已不用本地宝作核心证据
- https://www.xishanmls.com/about/instructions.html：failed，HTTP500；未重复重试
- https://sj.qq.com/appdetail/com.whllzx.queue：failed，HTTP404；不推荐作固定源
- https://wuxi.marathon.org.cn/post-3400.html：image_browser_required，正文图片https://stor.ihuipao.com/image/436d33192fa5ae9c381d8772c65eb2c1.png
- https://wuxi.marathon.org.cn/post-3401.html：image_browser_required，正文图片https://stor.ihuipao.com/image/15c7e253cd6737f8188625ddd5ac3f68.jpg
- https://wuxi.marathon.org.cn/post-3416.html：image_browser_required，2026NB出签公告正文图https://stor.ihuipao.com/image/01919736fe2a2099ce33615e6a340130.jpg；不能拿2024/2025同名稿填2026候补时间

- 收尾重取新华网上海2026-06-07西岸预告链接超时：https://sh.news.cn/20260607/58f5b79e925b477dac2c786a2d4299af/c.html 。不记本次成功，不影响已读现行西岸官方规程。

## 发现时间与历史归因界限
本轮三新增统一记录2026-11-19首次确认（仅本轮建基线，不是历史首次）。NB官方列表在10/28已有预告、11/16已有出签公告，现站11/16仍缺，能证明现有发现源覆盖不足；无法据此虚构过去例行具体搜索过哪些站。嘉定本轮已见11/19开报稿，晚于11/16站版，不把本次新增错误说成11/16应该已录的历史漏项。
