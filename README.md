## PNG → ICO 转换器

一个本地运行的 PNG 到 ICO 转换工具，支持批量转换、多尺寸合成与配置持久化。以 TypeScript 构建，强调离线、隐私友好与清晰的模块化架构。

### 功能特性
- 多文件批量转换：将 PNG 转为同名 `.ico` 并输出到源目录
- 多尺寸合成：默认包含 `16, 32, 48, 64, 128, 256`，可自定义并持久化
- 覆盖策略：可配置是否覆盖已存在 `.ico`
- 本地持久化：配置与日志存储于用户目录（无网络）
- 单元/集成/E2E 测试覆盖核心流程

### 环境要求
- macOS（优先验证）
- Node.js 18+（建议 18 或更高，`sharp` 需要较新的 Node 版本）

### 安装
项目已在根目录提供 `.npmrc` 配置镜像与本地缓存路径；请在项目目录内执行安装（不会进行全局安装）。

```bash
npm i
```

常用脚本：
```bash
npm run typecheck   # 类型检查（不输出）
npm run build       # 编译到 dist/
npm test            # 运行测试（unit/integration/e2e）
npm run test:watch  # 监听模式（开发时）
npm run clean       # 清理构建与本地缓存目录
```

### 目录结构
- `src/types/ico.ts`：核心类型定义（`FileInput`、`BatchResult`、`Settings`、`ErrorCode`、`ConvertOptions`）
- `src/config/configStore.ts`：配置持久化（尺寸与覆盖策略）
- `src/services/fsService.ts`：文件系统读写、输出路径推导、可写性检查
- `src/image/imageLib.ts`：图像处理封装（`sharp` 缩放，`png-to-ico` 合成）
- `src/services/convertService.ts`：转换编排、错误聚合与日志
- `src/services/logger.ts`：本地日志写入（按月滚动）
- `ui/`：纯前端演示界面（拖拽区域与设置面板，占位不直接访问 Node 层）
- `tests/`：单元、集成与端到端测试
- `scripts/`：开发运行与构建说明

### 使用说明

- 构建产物位于 `dist/`，在 Node 环境中可直接调用服务接口：
```js
import { convertFiles } from "./dist/services/convertService.js";

const inputs = [
  { sourcePath: "/absolute/path/logo.png", fileName: "logo.png", directory: "/absolute/path" }
];

const result = await convertFiles(inputs, {
  sizes: [16, 32, 48, 64, 128, 256],
  overwrite: true
});

console.log(result);
```

- 预览 UI：直接在浏览器打开 `ui/index.html`（演示占位）。若需完整本地应用体验（含文件系统访问与权限处理），推荐使用 Electron 或 Tauri 将 `dist/` 服务封装到桌面应用中。

### 配置与日志位置（macOS）
- 配置：`~/Library/Application Support/png-to-ico-converter/config.json`
- 日志：`~/Library/Application Support/png-to-ico-converter/logs/YYYY-MM.log`

### 测试
- 单元测试：核心模块契约与默认值回退
- 集成测试：真实 PNG 生成与单文件转换流程
- 端到端测试：多文件实际转换与输出校验

运行：
```bash
npm test
```

### 常见问题（FAQ）
- 运行 `npm` 时出现 `npm warn Unknown project config "store-dir"`：
  - 由于 `.npmrc` 同时兼容 `pnpm` 的 `store-dir` 配置，`npm` 会给出警告；不影响使用，可忽略。
- `sharp` 安装耗时或失败：
  - 请确保使用 Node 18+，网络可访问镜像源。若仍有问题，可参考 `sharp` 官方安装说明。
- 浏览器 UI 无法直接转换：
  - `ui/` 目录仅为演示，占位不直接访问本地文件系统。请使用 Node/Electron/Tauri 集成 `dist/` 服务侧能力。

### 致谢
- 图像处理：`sharp`
- ICO 合成：`png-to-ico`

### 许可证
- 本仓库暂未显式声明许可证。如需开放发布，请在根目录添加 `LICENSE` 并在此处补充说明。
