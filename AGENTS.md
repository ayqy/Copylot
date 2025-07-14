# AI 开发与维护指南

你好！作为一名协助本项目的 AI 开发者，请遵循以下指南以确保代码质量和项目一致性。

## 核心原则

*   **优先使用中文交流**：在与用户或团队成员沟通时，请始终使用中文。
*   **理解代码库**：在进行任何修改之前，请仔细阅读 `src` 目录下的所有相关代码，以充分理解现有实现。
*   **文档先行**：对于任何新增或修改的功能，请务必更新 `README.md` 和其他相关文档。

## 项目结构

代码库的主要逻辑位于 `src` 目录下：

*   `src/content/`: 内容脚本，负责在网页上注入功能，如显示复制按钮和处理用户交互。
*   `src/background.ts`: 后台服务工作线程，处理上下文菜单、扩展生命周期事件和跨脚本通信。
*   `src/popup/`: 扩展弹出窗口的 UI 和逻辑，用户可在此配置设置。
*   `src/devtools/`: Chrome 开发者工具面板，提供元素检查功能。
*   `src/shared/`: 跨多个组件共享的模块化工具函数。
    *   `block-identifier.ts`: 识别页面上可复制内容块的逻辑。
    *   `content-processor.ts`: 将内容转换为 Markdown 或纯文本的逻辑。
    *   `settings-manager.ts`: 管理用户设置。
    *   `ui-injector.ts`: 负责在页面上注入和管理 UI 元素（如复制按钮）。

## i18n (国际化)

本项目支持多语言，目前包括英语（en）和中文（zh）。

*   **消息文件**：所有面向用户的字符串都必须在 `_locales/[语言]/messages.json` 中定义。
*   **使用 `chrome.i18n.getMessage`**：在代码中，请使用 `chrome.i18n.getMessage("keyName")` 来获取本地化字符串，而不是硬编码文本。
*   **动态语言切换**：弹出窗口的 UI 会根据 `FORCE_UI_LANGUAGE` 或浏览器语言设置动态本地化。请确保新增的 UI 元素也遵循这一原则。

## 重要维护原则

*   **设置管理**：所有用户设置均由 `src/shared/settings-manager.ts` 集中管理。添加新设置时，请更新 `Settings` 接口和 `DEFAULT_SETTINGS` 对象。
*   **功能开关**：核心功能（如“Magic Copy”）应通过 `settings-manager.ts` 中的布尔开关（例如 `isMagicCopyEnabled`）进行控制，以便用户可以完全启用或禁用它们。
*   **代码内联**：内容脚本 `src/content/content.ts` 使用特殊的 `/* INLINE:... */` 注释将共享模块直接内联。这是为了将所有内容脚本逻辑打包到一个文件中，以符合 Chrome 扩展的要求。在构建过程中，`scripts/inline-build.ts` 会处理此内联操作。
*   **无障碍 (A11y)**：在向 UI 添加新元素时，请确保它们具有适当的 ARIA 属性和键盘导航支持。

感谢你的贡献！
