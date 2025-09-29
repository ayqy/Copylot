### **项目开发任务说明：微信公众号文章一键发布至知乎 Chrome 插件**

#### 1. 项目目标

开发一款 Chrome 浏览器插件，实现从用户当前浏览的微信公众号文章页面一键提取内容，并自动发布到知乎专栏文章的功能。

#### 2. 核心功能需求

1.  **内容采集**：
    * 当用户在微信公众号文章页面（`mp.weixin.qq.com` 域名下）时，插件提供一个操作入口（例如，点击插件图标弹出的 Popup 页面中的按钮）。
    * 点击后，插件能自动抓取当前文章的**标题**和**正文内容**（HTML 格式）。

2.  **自动化发布**：
    * 插件自动打开一个新的知乎专栏创作页面 (`https://zhuanlan.zhihu.com/write`)。
    * 在新打开的页面中，自动将采集到的文章标题填充到标题输入框。
    * 自动将采集到的文章正文内容填充到知乎的富文本编辑器中。
    * **（可选，可作为一期目标）** 自动点击“发布”按钮，打开后续的发布设置弹窗。

#### 3. 核心技术约束

* **纯前端实现**：**禁止使用任何后端服务器**。所有的数据处理和自动化操作必须在用户的浏览器中，通过 Chrome 插件自身的能力完成。
* **兼容性**：优先确保在最新版 Chrome 浏览器上稳定运行。

#### 4. 技术架构与实现方案

本项目采用纯粹的 Chrome Extension 架构，主要由三部分协作完成：

1.  **内容脚本 (Content Script - for WeChat)**
    * **职责**：注入到微信公众号文章页面，负责 DOM 解析和数据提取。
    * **实现**：使用标准 Web API (`document.querySelector`, `element.innerHTML`) 即可。定位标题选择器（如 `#activity-name`）和正文容器选择器（如 `#js_content`），提取数据后通过 `chrome.runtime.sendMessage` 发送给后台脚本。

2.  **后台脚本 (Background Script / Service Worker)**
    * **职责**：作为插件的大脑，负责流程调度。
    * **实现**：
        * 监听来自内容脚本的消息。
        * 接收到文章数据后，调用 `chrome.tabs.create` 创建一个新的知乎创作页面标签页。
        * 使用 `chrome.scripting.executeScript` 在新标签页加载完成后，将“自动化发布脚本”注入，并把文章数据传递过去。

3.  **内容脚本 (Content Script - for Zhihu Automation)**
    * **职责**：在知乎创作页面执行核心的自动化操作。这是技术难点所在。
    * **挑战与方案**：
        * **挑战1：动态元素加载**
            * 知乎页面是单页应用（SPA），编辑器等元素是动态加载的，脚本执行时可能还不存在。
            * **解决方案**：使用 `arrive.js` 库来监听并等待目标 DOM 元素的出现，确保在元素存在后再进行交互。
            * **开源库链接**: **[https://github.com/uzairfarooq/arrive](https://github.com/uzairfarooq/arrive)**

        * **挑战2：模拟真实用户交互**
            * 知乎的前端由 React 等现代框架构建，直接修改 `input.value` 或调用 `element.click()` 常常无法触发框架的事件监听和状态更新。
            * **解决方案**：必须模拟更真实的用户事件。开发者需要自行封装 `type` (输入) 和 `click` (点击) 的辅助函数。**强烈建议参考** `user-event` 库的实现原理，例如：
                * **点击**：依次派发 `mousedown`, `mouseup`, `click` 事件。
                * **输入**：设置 `.value` 后，再派发 `input` 和 `change` 事件。
            * **参考学习链接**: **[https://github.com/testing-library/user-event](https://github.com/testing-library/user-event)**

    * **自动化步骤**：
        1.  接收后台脚本传来的文章标题和内容。
        2.  使用 `arrive.js` 或自定义的 `waitForElement` 函数等待“标题输入框”出现。
        3.  使用封装的 `type` 函数填入标题。
        4.  等待“知乎富文本编辑器”（如 `.ProseMirror` 元素）出现。
        5.  与富文本编辑器交互，推荐**模拟粘贴操作** (`document.execCommand('insertHTML', ...)` 或模拟 `paste` 事件) 将文章 HTML 填入。
        6.  等待“发布”按钮出现，并使用封装的 `click` 函数点击。

#### 5. 交付产物

* 一个完整的 Chrome Extension 项目文件夹，包含 `manifest.json`、background 脚本、content 脚本及所有必要的资源。
* 插件需经过测试，能稳定完成从主流微信公众号文章到知乎编辑器的内容填充。
