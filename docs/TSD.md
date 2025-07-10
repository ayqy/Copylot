### **技术规格文档 (Technical Specification Document) - "AI Copilot" V1.1 (最终修订版)**

| **文档版本** | **V1.2 (Revised)** | **状态** | **已确认** |
| :--- | :--- | :--- | :--- |
| **创建日期** | 2023-10-27 | **技术负责人** | [你的名字] |
| **对应PRD** | V1.1 | **项目代号** | Project "MagicCopy" |

---

### **1. 概述 (Overview)**

本文档旨在为 "AI Copilot" V1.1 版本的开发提供全面的技术设计和任务分解方案。核心目标是实现 PRD 中定义的功能，并确保开发过程高效、可控，以缩短交付周期。本文档已根据最终评审意见进行修订。

### **2. 设计决策与澄清 (Design Decisions \u0026 Clarifications)**

1.  **父子元素竞合逻辑 (FR2.1.1):** 交互逻辑明确为：当鼠标悬停时，插件将只分析鼠标指针正下方的DOM元素 (`event.target`)。如果该元素满足“有效内容区块”的条件，则为其显示复制按钮。
2.  **内容清理规则 (FR2.2.1):** 纯文本模式下的清理规则为：合并连续空白为单空格、保留段落间空行、移除首尾空白。
3.  **“反馈与建议”链接 (FR2.3.1):** Popup面板中的链接指向 GitHub Issues: `https://github.com/ayqy/copy/issues/new`。

### **3. 系统架构 (System Architecture)**

我们将采用一个标准的、解耦的浏览器插件架构，由以下几个核心部分组成。

*   **Content Script (`content.js`):** 注入到用户浏览的页面中，作为核心控制器，负责监听事件、编排调用各功能模块、操作DOM。
*   **Popup Script (`popup.js`):** 插件工具栏图标的弹出窗口逻辑，负责配置项的UI展示与持久化。
*   **共享模块 (Shared Modules):** 一系列可被独立开发的纯逻辑JS模块，包括区块识别、内容处理等。

#### **3.1. 第三方库选型**

*   **`turndown.js`**: 为了高质量地实现从HTML到Markdown的转换（PRD FR2.2.2），我们将集成 `turndown` 库。这是本次开发中的核心技术选型，能确保输出的Markdown保留原文的丰富语义。

### **4. 核心模块技术设计 (Module Design)**

#### **4.1. 模块A: 区块识别模块 (`block-identifier.js`)**

*   **职责:** 判断一个给定的DOM元素是否为“有效内容区块”。
*   **接口:** `isViableBlock(element: HTMLElement): boolean`
*   **实现细节:** 严格按照PRD中的黑名单、尺寸、内容密度和元素类型规则进行过滤。

#### **4.2. 模块B: UI注入模块 (`ui-injector.js`)**

*   **职责:** 在指定元素旁创建、定位、显示和移除“复制”按钮。
*   **接口:**
    *   `createCopyButton(): HTMLElement`
    *   `showButton(button: HTMLElement, targetElement: HTMLElement)`
    *   `hideButton(button: HTMLElement)`
    *   `setButtonState(button: HTMLElement, state: \u0027copy\u0027 | \u0027copied\u0027)`
*   **实现细节:** 创建可复用的按钮实例，通过CSS和JS动态计算位置，内联SVG图标以减少依赖。

#### **4.3. 模块C: 内容处理模块 (`content-processor.js`)**

*   **职责:** 根据用户设置，从DOM元素生成最终待复制的字符串。
*   **接口:** `processContent(element: HTMLElement, settings: object): string`
*   **实现细节:**
    *   **Markdown模式:** 获取`element.innerHTML`，并使用`turndown`库进行转换。
    *   **纯文本模式:** 获取`element.innerText`，并执行已确认的文本清理逻辑。
    *   根据设置拼接附加的标题和URL信息。

#### **4.4. 模块D: 设置管理模块 (`settings-manager.js`)**

*   **职责:** 封装对`chrome.storage`的读写，提供统一的配置接口。
*   **接口:**
    *   `getSettings(): Promise\u003cobject\u003e`
    *   `saveSettings(newSettings: object): Promise\u003cvoid\u003e`
*   **实现细节:** 封装`chrome.storage.local` API，并提供默认配置。

### **5. 数据结构与接口定义 (Data \u0026 APIs)**

#### **5.1. `chrome.storage.local` 数据结构**

*   **Key:** `"copilot_settings"`
*   **Value (Object):**
    ```json
    {
      "outputFormat": "markdown", // "markdown" | "plaintext"
      "attachTitle": false,       // boolean
      "attachURL": false          // boolean
    }
    ```
*   **默认值:** 如上所示。

---

### **6. 开发任务拆分 (Development Task Breakdown)**

开发过程将分为三个主要阶段，其中第二阶段包含可并行的开发任务。

1.  **阶段一：项目初始化 (串行)**
    *   **T0 - 项目框架搭建:**
        *   **描述:** 使用标准脚手架（如 Vite + TypeScript）初始化浏览器插件项目。配置 `manifest.json` (V3)，建立基本的项目目录结构（`src/content`, `src/popup`, `src/shared-modules`等），并集成代码格式化与检查工具（ESLint, Prettier）。
        *   **产出:** 一个可供所有开发者克隆并开始工作的、干净的基础项目仓库。
        *   **说明:** 这是所有后续开发任务的基础，必须最先完成。

2.  **阶段二：核心功能开发 (并行)**
    *   **T1 - 核心技术：HTML转Markdown模块:**
        *   **描述:** 独立开发内容处理模块 (`content-processor.js`)。核心任务是集成并精细配置 `turndown.js` 库，确保其能稳定、高质量地将HTML片段转换为Markdown。同时，实现纯文本的清理逻辑。
        *   **产出:** 一个经过充分单元测试的、可靠的内容处理函数，能接收DOM元素和配置，输出格式正确的字符串。
    *   **T2 - 核心功能：内容脚本与区块交互:**
        *   **描述:** 开发 `content.js` 及其依赖的 `block-identifier.js` 和 `ui-injector.js`。此任务包含整个核心交互逻辑：监听鼠标`mousemove`事件（含300ms防抖），调用区块识别算法，在识别成功时注入并定位复制按钮，处理按钮的点击事件（调用内容处理模块、写入剪贴板、更新按钮状态）。
        *   **产出:** 注入到页面后，能够实现完整的悬停识别、按钮显示、点击复制功能。
    *   **T3 - 配置功能：Popup设置面板:**
        *   **描述:** 开发Popup的完整功能，包括 `popup.html`, `popup.css`, `popup.js` 以及其依赖的 `settings-manager.js`。此任务包含UI的构建、从`chrome.storage`读取并渲染用户配置、监听用户操作并实时将新配置写回`storage`。
        *   **产出:** 一个功能完备、可持久化用户设置的弹出式设置面板。
    *   **T4 - 工程化：构建与打包配置:**
        *   **描述:** 完善项目的构建流程。配置`Vite`或`Webpack`，确保能正确处理TypeScript、CSS，并能将`turndown.js`等第三方库正确打包。最终目标是能通过一条命令生成可直接加载到浏览器的、生产环境就绪的插件包。
        *   **产出:** 稳定可靠的`build`脚本和打包流程。

3.  **阶段三：集成验收 (串行)**
    *   **T5 - 技术方案符合度审查 (Code Review) (由技术经理负责):**
        *   **描述:** 在所有开发任务完成后，技术经理将对最终的代码库进行全面的审查。审查内容包括：是否完整实现了PRD和TSD中定义的所有功能和逻辑；代码质量、可读性、可维护性是否达标；非功能性需求（特别是性能）是否得到满足。
        *   **产出:** 最终确认版本或一份包含必要修改意见的审查报告。

---

### **7. 非功能性需求考量 (Non-functional Considerations)**

*   **性能 (Performance):**
    *   **事件监听:** `mousemove` 事件监听严格使用**Debounce**机制（延迟`300ms`），这是确保页面不卡顿的核心。
    *   **`turndown` 性能:** 转换操作将在debounce的回调中执行，避免对主线程的长时间占用。
    *   **资源:** 插件总体积将保持在KB级别。`turndown`库体积小巧，影响可控。所有图标使用内联SVG。

*   **兼容性 (Compatibility):**
    *   **浏览器:** 目标为 Chrome Manifest V3。
    *   **API:** 使用 `navigator.clipboard.writeText()` API。

*   **隐私与安全 (Privacy \u0026 Security):**
    *   **权限:** `manifest.json`中只申请最小权限：`activeTab` 和 `storage`。
    *   **数据:** 严格遵守PRD，所有操作均在客户端本地进行，无任何数据上报服务器。