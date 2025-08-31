# Tasks Document

- [x] 1. 定义核心类型与契约（types）
  - File: `src/types/ico.ts`
  - 定义 `FileInput`、`BatchResult`、`Settings`、错误码枚举与 `ConvertOptions`。
  - Purpose: 确立跨层通信的结构化契约。
  - _Requirements: R1, R2, R3, R5_

- [x] 2. 配置存储模块（configStore）
  - File: `src/config/configStore.ts`
  - 方法：`getLastSizes`、`saveSizes`、`getOverwriteDefault`、`setOverwriteDefault`。
  - 本地持久化到 macOS 用户目录（无网络）。
  - _Requirements: R2_

- [x] 3. 文件系统服务（fsService）
  - File: `src/services/fsService.ts`
  - 方法：`readPng`、`writeIco`、`deriveOutPath`、`ensureDirWritable`。
  - 处理覆盖策略与异常包装。
  - _Requirements: R1, R3, R4_

- [x] 4. 图像库封装（imageLib）
  - File: `src/image/imageLib.ts`
  - 方法：`resizeTo`、`generateIcoFromPngBuffers`。
  - 实现多尺寸合成与高质量缩放；暴露纯函数接口。
  - _Requirements: R1, R2_

- [x] 5. 转换服务（convertService）
  - File: `src/services/convertService.ts`
  - 方法：`convertFiles(inputs, options)`；内部并发/队列、错误聚合、统计汇总。
  - 依赖：`imageLib`、`fsService`、`configStore`、`logger`。
  - _Requirements: R1, R2, R3, R5_

- [x] 6. 日志模块（logger）
  - File: `src/services/logger.ts`
  - 方法：`info`、`error`、`getLogPath`；写入本地日志文件，支持查看/清理。
  - _Requirements: R5_

- [x] 7. UI 拖拽与设置面板
  - Files: `ui/index.html`, `ui/main.ts`, `ui/styles.css`
  - 拖拽接收文件、调用 `convertService`；设置多尺寸与覆盖策略、保存配置。
  - _Requirements: R1, R2, R3_

- [x] 8. 首次启动引导与权限处理
  - File: `ui/first-run.ts`（或合并至 `main.ts`）
  - 引导推荐默认尺寸；写权限失败时的用户引导。
  - _Requirements: R4_

- [x] 9. 集成测试（端到端）
  - Files: `tests/e2e/convert.e2e.ts`, `tests/fixtures/*.png`
  - 验证单/多文件拖拽、输出路径/命名、覆盖策略与结果摘要。
  - _Requirements: R1, R2, R3, R4, R5_

- [x] 10. 单元与集成测试（服务与库）
  - Files: `tests/unit/imageLib.test.ts`, `tests/unit/configStore.test.ts`, `tests/unit/convertService.test.ts`
  - 覆盖尺寸回退逻辑、错误码、并发/队列可靠性。
  - _Requirements: R2, R5_

- [x] 11. 打包与运行脚本（本地应用）
  - File: `scripts/dev-run.md`、`scripts/build.md`
  - 提供开发/运行/构建指引；不直接实现打包。
  - _Requirements: R4_
