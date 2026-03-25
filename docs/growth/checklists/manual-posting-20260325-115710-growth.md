# 手动发布清单（20260325-115710-growth）

> 适用条件：`network_blocked=true` 或渠道登录态不可用  
> 节奏参数：`max_posts_per_cycle=6`、`cooldown_sec=900`

## A. 发布前准备（一次性）

1. 打开文案包：`docs/growth/assets/generated/20260325-115710-growth/channel-posts.md`
2. 打开 xhs 文案：`docs/growth/assets/generated/20260325-115710-growth/xhs-copy.md`
3. 先渲染 xhs 图：`docs/growth/assets/generated/20260325-115710-growth/xhs-manual-rendering-checklist.md`
4. 确认 7 渠道账号可登录：`x/linkedin/reddit/hn/producthunt/indiehackers/xhs`
5. 若遇验证码/滑块，先人工通过一次并保持会话

## B. 本轮发布顺序（最多 6 条）

### T0（立即）- x

- 粘贴 `x` 版本 A 或 B
- 带链接：`utm_source=x`
- 回填帖子 URL 到 `docs/growth/metrics.md`

### T0 + 15 分钟 - linkedin

- 粘贴 `linkedin` 文案
- 带链接：`utm_source=linkedin`
- 回填 URL 与首小时曝光/点击

### T0 + 30 分钟 - reddit

- 先核对子版规则再发帖
- 带链接：`utm_source=reddit`
- 回填 URL 与评论数

### T0 + 45 分钟 - hn

- 发布 `Show HN` 标题与正文
- 带链接：`utm_source=hn`
- 回填 URL、points、comments

### T0 + 60 分钟 - indiehackers

- 粘贴 `indiehackers` 文案
- 带链接：`utm_source=indiehackers`
- 回填 URL 与有效反馈数

### T0 + 75 分钟 - xhs（必选）

- 上传 6 张竖版图（封面 + 4 内页 + CTA）
- 选用 `xhs-copy.md` 标题与正文
- 带链接：`utm_source=xhs`
- 回填笔记 URL 与互动数据

## C. 本轮顺延（超出 6 条上限）

### producthunt

- 本轮只做预热，不做正式 Launch
- 下一轮第 1 条优先补发（Maker Comment + 资产齐套后）

## D. 指标回填字段

- `channel`
- `post_url`
- `publish_time`
- `impressions`
- `clicks`
- `installs`
- `activated_users`
- `feedback_count`
- `notes`（是否触发验证码/风控）
