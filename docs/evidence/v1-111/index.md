# v1-111 第一次干净复制承接证据索引

## 本轮目标

- 统一 Popup 首屏、Chrome Web Store 说明、截图顺序与官网首页承接规范。
- 让安装后的第一条主路径稳定指向“第一次干净复制”。
- 为安装 -> 首次 Popup 打开 -> 首次 `copy_success` 建立可复核证据。

## 证据清单

- `official-links.json`
  - 四类固定官方入口的 UTM 样例与固定口径。
- `screenshot-sequence.md`
  - 商店与官网首页共用的截图顺序、标题与前三个卖点。
- `homepage-alignment-spec.md`
  - 可直接交给官网仓实现的首页承接规范。
- `first-copy-install-guide.md`
  - 给安装后用户使用的三步上手指引。
- `funnel-audit-spec.md`
  - 安装 -> Popup -> `copy_success` 的导出路径、对账方式与人工复核步骤。

## 商业化判断

本轮不是整理文案而已，而是把“能安装”推进成“安装后更容易立刻成功一次”：

- 评审人可以直接比对 Popup 首屏、商店说明、官网首页规范与截图顺序是否同口径。
- 评审人可以按 `funnel-audit-spec.md` 从本地增长字段复核首次成功链路。
- 评审人可以用 `first-copy-install-guide.md` 复现真实用户第一次干净复制。
