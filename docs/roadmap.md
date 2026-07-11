# Copylot 商业化 Roadmap

一句话结论：先把 Copylot 做成“安装后直接完成第一次干净复制”的免费浏览器插件增长闭环，再用真实复用与分享行为决定 Pro 的增强方向。

## 经营原则

- Chrome Web Store 已公开可安装，官网、商店、扩展内入口与分享包可以并行承担获客承接。
- 当前阶段的北极星是安装后的首次 `copy_success` 与后续复用，不是表单、问卷、候补或支付承接。
- Pro 当前只保留路线说明与增强方向承接，不做留资、问卷、候补或收款链路。
- 所有工作都要回到同一条增长循环：`官网 / 商店 -> 安装 -> 首次成功复制 -> 再次复用 -> 分享 / 评价 -> 新安装`。

## 阶段路线

- [x] S0 安装与激活面重构
  进度：6/6（100%）
  - [x] 回退 Popup 中“你最想先解决什么”与相关预填问卷链路。
  - [x] 将 Options Pro 页收敛为“路线说明 + 分享工具”，不再承接表单或候补收集。
  - [x] 清理扩展内剩余显性表单、问卷、候补入口与旧命名，避免任何主路径偏离复制任务。
  - [x] 当官网首页源码不在当前仓库时，先同步扩展仓安装承接基线，把主 CTA 统一为 Chrome Web Store 安装、上手、隐私与分享。
  - [x] 当 `/pricing` 与 `/privacy` 源码不在当前仓库时，先在扩展仓维护 Pro 路线说明页与隐私信任页所需的统一链接、文案与证据基线。
  - [x] 统一测试口径、增长投放包、截图基线与漏斗证据导出路径为“无表单增长闭环版”。

- [x] S1 安装与首次成功
  进度：4/4（100%）
  - [x] 对齐官网承接规范、商店说明、Popup 的价值主张、截图顺序与安装指引，确保都围绕“第一次干净复制”。
  - [x] 打磨 Popup 首屏、上手说明与快捷路径，降低安装后的首次成功门槛。
  - [x] 固化安装 -> `copy_success` 的事件口径、可导出证据与对账方式。
  - [x] 为首次成功路径补齐自动化回归与手工用例，保证上架版本可重复验证。

- [x] S2 第二次复用与口碑循环
  进度：4/4（100%）
  - [x] 在 Popup / Onboarding 强化快捷 Prompt 槽位与模板复用，让成功用户有明确的第二次打开理由，并形成“复制网页内容 + 套用 Prompt + 粘贴到 AI”的默认复用路径。
  - [x] 先针对代码块场景完成“复制后无需返工”的稳定性专项，优先修掉缩进、行号和复制按钮噪声残留问题，并沉淀可回归证据；随后再扩展到长文与表格。
  - [x] 强化 Shift 追加模式与多段收集工作流，补齐扩展内对追加收集状态的承接、清理与复用动作，并以隐私安全前提形成高频复用理由。
  - [x] 在低打扰前提下推进分享与评价提示，并保留可追踪的口碑证据。

- [ ] S3 Pro 路线验证
  进度：1/4（25%）
  - [x] 仅围绕高级页面清洗设计 Pro 路线说明与验证素材。
  - [ ] 仅围绕批量采集与整理设计 Pro 路线说明与验证素材。
  - [ ] 仅围绕结构化导出与下游工作流设计 Pro 路线说明与验证素材。
  - [ ] 只有在激活、复用与口碑信号成立后，才评估支付与收款链路。

## 指标口径

- 首次激活：新安装用户首次 `copy_success` 转化率。
- 复用：首次 `copy_success` 后再次发生 `copy_success` 的用户占比。
- 口碑：`wom_share_copied`、`wom_rate_opened`、商店评分与评价数量。
- Pro 观察项：Pro 路线入口打开、Pro 路线说明页打开、分发素材复制，仅用于路线说明与分发素材效果判断。

## 来源与依据

- Chrome Web Store Discovery
  - https://developer.chrome.com/docs/webstore/discovery
- Copylot Chrome Web Store 页面
  - https://chromewebstore.google.com/detail/copylot/ehfglnbhoefcdedpkcdnainiifpflbic
- Glasp Chrome Web Store 页面
  - https://chromewebstore.google.com/detail/glasp-web-highlighter-pdf/blillmbchncajnhkjfdnincfndboieik
- Glasp Pricing
  - https://glasp.co/pricing
- Just Read Chrome Web Store 页面
  - https://chromewebstore.google.com/detail/just-read/dgmanlpmmkibanfdgjocnabmcaclkmod
