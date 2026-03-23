# 反馈收集与处理清单（隐私优先，可复现优先）

目标：把“评论/私信/Issue”快速转成**可复现结论**与**下一步迭代**，同时最大化口碑与商店评价。

配套文档：
- 话术模板：`docs/growth/publish-pack-2026-03-23.md`（第 5 节）
- 指标落盘：`docs/growth/metrics-tracker-2026-03-23.md`（第 2 节反馈记录）

## 1) 处理时效（执行纪律）

- 24 小时内：对每条反馈完成首次回应（哪怕只是确认已看到）
- 48 小时内：给出复现结论（能复现/不能复现/需要更多信息）
- 72 小时内：明确下一步（修复版本/替代方案/不做的理由）

## 2) 反馈分类（最少 5 类）

1. Bug（功能不工作/复制结果错误）
2. 兼容性（特定网站/特定 DOM 结构/表格或代码块异常）
3. 需求（新增能力/更强清洗/批量/导出）
4. 理解成本（不知道怎么触发、以为“坏了”其实是用法问题）
5. 信任/隐私（担心上传内容、权限敏感）

## 3) 复现所需信息（不收集内容）

优先收集（不包含网页内容/复制内容）：
- 设备/系统：macOS/Windows/Linux
- 浏览器：Chrome 版本
- 扩展版本：manifest version（例如 1.1.28）
- 站点域名：例如 `example.com`（不需要具体 URL）
- 触发路径：单击/双击/Shift 追加/表格转 CSV/代码块悬停复制
- 期望 vs 实际（1 句话）

可选（用户自愿）：
- 截图（打码后）
- 扩展 Options 中导出的“本地证据包”（不含内容/URL/标题/复制内容；用于定位事件序列与配置）

## 4) 回复模板（中英文，可直接粘贴）

### 4.1 首次回应（中文）
```text
收到！感谢你反馈。
为了我能快速复现定位：你用的是 mac/Windows？Chrome 版本和 Copylot 版本（例如 1.1.28）是多少？大概在哪个网站域名上遇到的（只要域名即可）？
如果你愿意更快协助：也可以在扩展 Options 里导出/复制“本地证据包”发我（不含任何网页内容/URL/标题/复制内容）。
```

### 4.2 首次回应（EN）
```text
Thanks for the report!
To reproduce quickly: what OS are you on (macOS/Windows)? what Chrome version + Copylot version (e.g. 1.1.28)? and which site domain (domain only is enough)?
If you’re willing to help further, you can also export/copy a local-only evidence pack from Options (no page content/URLs/titles/copied text included).
```

### 4.3 隐私澄清（中文）
```text
隐私口径补充：Copylot 默认本地处理，不收集/不上传你复制的网页内容；
“匿名使用数据”默认关闭，即使开启也仅本地记录少量事件，不含内容/URL/标题，不联网发送，随时可清空。
```

### 4.4 复现结论（中文）
```text
我这边复现结果：
- 结论：能复现 / 不能复现 / 需要更多信息
- 初步判断原因：
- 下一步：我会在 <版本或日期> 修复 / 提供临时绕过方案 / 先记录为后续优化
```

### 4.5 评价引导（中文，谨慎使用）
```text
如果 Copylot 对你有帮助，能否在 Chrome Web Store 留个评价？这对我继续迭代很关键。
（如果你遇到问题也欢迎先在“反馈”里提 issue，我会优先处理。）
```

## 5) 落盘规则（必须做）

每条反馈处理后，至少补齐指标表中的一行：
- 日期、来源（渠道）、链接（Issue/评论）、反馈类型、复现结论、下一步（owner + 截止日）

