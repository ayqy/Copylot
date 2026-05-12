# 真实 UI 测试经验

## 核心定义
“真实 UI 测试”指的是自动化脚本严格模拟人工 QA 的实际入口和点击过程，而不是只验证功能逻辑。

判断标准很简单：人工 QA 是怎么打开功能的，脚本就必须怎么打开。

## 必须满足的入口标准
- 从最新打包并加载的扩展开始
- 真实打开浏览器扩展入口
- 真实点击浏览器中的扩展 icon
- 真实打开浏览器原生右键菜单
- 真实进入扩展子菜单
- 真实触发 Prompt 或 Convert Page

如果做不到这些，就只能算功能回归，不算真实入口回归。

## 本轮最重要的失败教训
### 1. 直接打开 popup 页面不等于真实 toolbar 入口
- 这只能证明 popup 页面本身可用
- 不能证明浏览器原生扩展入口可点击、可见、可打开、可绑定当前 tab

### 2. 直接调用 background handler 不等于真实右键入口
- 这只能证明业务逻辑可执行
- 不能证明浏览器原生上下文菜单和子菜单路径可达

### 3. 原生菜单 OCR 非常脆弱，不能只靠单一字符串
- `AI` 会被识别成 `Al` 或 `A1`
- 中文菜单项也可能有局部误识别
- 解决方式是：
  - 做模糊命中
  - 保留多组 query
  - 对首项用 `Right -> Enter` 这类键盘导航兜底，减少坐标漂移

### 4. 不要把系统剪贴板当成唯一真相
- 在 native-ui 场景里，系统剪贴板最容易受桌面环境影响
- 更稳定的断言是：
  - `usageCount`
  - growth stats
  - telemetry
  - 打开的 URL
  - settings / storage

### 5. onboarding、弹层、浏览器焦点都会干扰真实入口
- popup 自动弹层可能遮挡按钮
- 浏览器焦点可能导致右键和键盘导航落空
- 真实 UI 测试必须先处理环境噪音，再做主断言

## 成功做法
### 1. 把功能覆盖和真实入口覆盖拆成两个 project
- `main` 负责广度
- `native-ui` 负责真实性
- 这样既不会因为 native-ui 太慢拖垮整体回归，也不会因为只跑 `main` 而误以为真实入口没问题

### 2. 始终基于最新测试产物
- 扩展必须来自 `.tmp_e2e/extension`
- 不能拿历史构建产物继续做 native-ui 回归

### 3. 真实 UI 测试必须 headed
- `native-ui` 不应该尝试 headless
- 需要可见窗口、桌面会话、系统权限

### 4. 优先使用“状态断言”而不是“视觉断言”
- 真正关键的是功能是否完成
- 截图和 OCR 只用于定位入口，不应该成为最终业务成功与否的唯一判据

## 当前环境前提
- macOS
- Accessibility 权限
- 可见桌面会话
- `Google Chrome for Testing`
- Playwright `chromium` channel

## 后续新增真实 UI 用例时的 Checklist
- [ ] 是否从最新构建产物启动扩展
- [ ] 是否真实经过浏览器原生入口
- [ ] 是否避免把 driver bridge 当成入口验证
- [ ] 是否把断言落在 storage / telemetry / growth stats / opened URL
- [ ] 是否考虑了 OCR 误识别和键盘兜底
- [ ] 是否明确该用例属于 `main` 还是 `native-ui`

## 什么时候放进 `main`
- 功能链路本身重要，但不依赖真实浏览器原生入口
- 更关注产品逻辑正确性和回归速度

## 什么时候放进 `native-ui`
- 需求明确强调“模拟人工 QA”
- 要验证 toolbar icon、原生右键、子菜单、系统级交互
- 失败成本高，必须真实覆盖

## 相关文档
- [技术经验总览](./README.md)
- [工程约束](./constraints.md)
- [统一测试入口与执行模型](./unified-test-pipeline.md)
- [测试排障手册](./debug-playbook.md)
