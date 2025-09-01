# Chrome商店生产环境构建

本文档说明如何创建适合Chrome Web Store提交的Copylot生产环境构建。

## 背景

Chrome Web Store对扩展有严格的政策要求，禁止：
1. 加载在线资源
2. 包含最终用户可访问的测试/开发功能
3. 可能被认为是隐藏功能的彩蛋特性

## 构建命令

### 开发版本构建（包含测试代码和彩蛋入口）

```bash
npm run build
```

此命令构建包含以下功能的完整版本：
- 包含测试运行器和测试文件
- 包含版本号三次点击彩蛋功能
- 包含开发和调试相关的所有资源

### 生产版本构建（Chrome商店上架用）

```bash
npm run build:prod
```

此命令构建符合Chrome Web Store政策的干净版本：
- 不包含任何测试相关文件和功能
- 移除版本号三次点击彩蛋功能
- 生成可直接提交Chrome商店的构建包

## 生产环境构建的差异

### 1. 移除测试功能
- 构建输出中不包含`test/`目录或文件
- 不包含`test-manifest.json`文件
- 不包含通过web_accessible_resources访问的测试运行器
- 不包含可能被认为是"在线资源加载"的测试相关fetch()调用

### 2. 移除彩蛋功能
- 完全移除版本号三次点击彩蛋功能
- 用户无法通过弹窗界面访问测试运行器

### 3. 清洁的Manifest文件
生产环境的manifest.json只包含：
- 必要的扩展资源（`src/assets/*`）
- 不包含测试相关的web_accessible_resources
- 不包含测试文件的引用

## 构建流程

生产环境构建过程：
1. 创建临时目录（`.tmp_build_prod`）
2. 只复制必要的项目文件（排除`test/`目录）
3. 通过环境变量控制差异化逻辑
4. 排除所有测试相关资源的Vite构建
5. 生成可直接提交Chrome Web Store的干净`dist/`目录

## 技术实现

本项目使用环境变量`BUILD_TARGET`来控制构建行为：
- `BUILD_TARGET=development`：包含测试代码和彩蛋功能
- `BUILD_TARGET=production`：排除测试代码和彩蛋功能

所有差异化逻辑都通过这个环境变量在构建时决定，无需维护重复的配置文件。

## 构建验证

运行生产环境构建后，可以通过以下命令验证构建是否干净：

```bash
# 应该返回空结果
find dist -name "*test*" -o -name "*runner*"

# 检查manifest不包含测试文件引用
grep -i test dist/manifest.json

# 验证彩蛋功能已移除
grep -i "clickCount\|easter\|test/index.html" dist/src/popup/popup.js
```

## 日常开发

日常开发继续使用：
- `npm run dev` - 开发模式构建（带监听）
- `npm run build` - 完整构建（包含测试）

只有在准备提交Chrome Web Store时才使用`npm run build:prod`。

## 文件结构

优化后的项目只维护一套配置文件：
- `manifest.json` - 主manifest文件
- `vite.config.ts` - 主Vite配置文件  
- `src/popup/popup.ts` - 主popup脚本文件
- `scripts/inline-build.ts` - 主构建脚本

所有差异化逻辑通过`BUILD_TARGET`环境变量控制，避免了维护重复配置文件的负担。