# v1-96 小红书手动发布清单（network_blocked 降级路径）

目标：在外网受限或自动化不可用时，依然能完成“分发 -> 转化入口点击 -> 意向沉淀”的最小闭环。

## 1) 发布前准备（必做）

1. 素材与文案准备：
   - 图片目录：`docs/growth/assets/social/xhs/v1-96/`
   - 素材索引：`docs/growth/assets/social/xhs/v1-96/asset-index.md`
   - 发布文案：`docs/growth/assets/social/xhs/v1-96/xhs-post-copy.md`
   - CTA 链接：`docs/growth/assets/social/xhs/v1-96/cta-links.md`
2. 阻塞与降级记录：
   - 执行记录：`docs/growth/executions/v1-96-growth-regression.md`
   - 阻塞留痕：`docs/growth/blocked.md`
   - TODO 队列：`docs/growth/todo.md`
3. 确认参数一致：
   - `utm_source=xhs`
   - `utm_medium=organic_social`
   - `utm_campaign=v1_96_growth_regression`

## 2) 发帖操作（逐项勾选）

- [ ] 登录小红书发布后台（若触发验证码/风控，立刻写入 `docs/growth/blocked.md` 并保留截图）。
- [ ] 新建图文帖并按顺序上传图片：
  1) `01-cover.png`
  2) `03-pain-point.png`
  3) `04-feature-stack.png`
  4) `05-three-steps.png`
  5) `06-proof.png`
  6) `07-privacy.png`
  7) `08-cta.png`
- [ ] 标题与正文直接复制 `xhs-post-copy.md`，只允许做平台风格微调，不新增能力承诺。
- [ ] 末尾保留三条 CTA（官网/CWS/Pro 候补）且链接参数一致。
- [ ] 发布后复制帖子 URL 与截图存档路径。

## 3) 发布后回填（转化证据）

- [ ] 将帖子 URL、发布时间、曝光/点击/评论、私信关键词记录到执行记录补充段。
- [ ] 在 `docs/growth/assets/social/xhs/v1-96/conversion-evidence-index.json` 对照核验：
  - `campaign/source/medium` 是否一致；
  - `channel/postUrl/targetUrl/campaign/source/intentSignal/evidencePath` 是否齐全；
  - 入口链接是否完整可点，且每条记录都能追溯到证据文件。
- [ ] 发布完成后回填 `conversionEntries[*].postUrl`，并同步更新 `auditChainSamples[*].postUrl`。
- [ ] 如出现账号/权限阻塞，执行：
  1) 更新 `docs/growth/blocked.md`（触发环节、影响范围、替代动作、恢复条件）；
  2) 执行 `make todo` 刷新 `docs/growth/todo.md`。

## 4) 完成判定（PASS 条件）

- 已发布或已准备可直接发布的成套图文（封面 + 第 3-8 页）。
- 三个转化入口（官网/CWS/Pro）均存在且 UTM 统一。
- 阻塞记录、TODO 队列、执行记录三方一致，可审计、可复盘。
