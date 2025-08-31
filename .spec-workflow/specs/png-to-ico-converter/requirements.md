# Requirements Document

## Introduction

一个基于 HTML 的本地应用，用于将 PNG 图片（单个或多个拖拽输入）自动转换为 ICO 图标，并在源文件目录下输出生成的 .ico 文件。应用支持配置多尺寸图标，记忆用户最近一次的尺寸配置作为默认值，以实现“设置一次，拖拽即用”的极简流程。

## Alignment with Product Vision

- 降低图标转换的心智负担，简化开发者与设计师从 PNG 到 ICO 的常见工作流。
- 优先本地运行、隐私友好、零外部依赖，适合在 macOS 环境中快速使用。

## Requirements

### Requirement 1: 拖拽转换（单个/多个）

**User Story:** 作为一名设计师/开发者，我希望可以将一个或多个 PNG 文件拖入应用界面，系统自动在源目录输出同名 .ico 文件，以便快速生成站点或应用所需图标。

#### Acceptance Criteria

1. WHEN 用户拖入一个 PNG 文件 THEN 系统 SHALL 在源 PNG 同级目录生成同名 .ico 文件（如 logo.png → logo.ico）。
2. WHEN 用户拖入多个 PNG 文件 THEN 系统 SHALL 逐个转换并分别输出到各自的源目录；当目录不同也应各就各位输出。
3. IF 文件不是 PNG THEN 系统 SHALL 明确提示并跳过该文件，不阻塞其他文件处理。
4. WHEN 转换完成 THEN 系统 SHALL 在界面显示成功/失败摘要（文件名、输出路径、错误原因等）。

### Requirement 2: 多尺寸配置与持久化默认

**User Story:** 作为一名频繁生成图标的用户，我希望可以设置 ICO 内包含的多种尺寸（如 16/32/48/64/128/256），并且系统记住我最近一次配置，默认按该设置执行，从而避免重复设置。

#### Acceptance Criteria

1. WHEN 用户在设置中选择一个或多个尺寸 THEN 系统 SHALL 使用该配置生成包含多尺寸的 .ico 文件。
2. WHEN 用户未进行设置 THEN 系统 SHALL 使用上一次保存的尺寸配置；若无历史记录，则使用推荐默认（16, 32, 48, 64, 128, 256）。
3. WHEN 用户更新尺寸配置并点击保存 THEN 系统 SHALL 在本地持久化配置（无网络依赖），并在后续会话中自动加载。
4. IF 某个尺寸超过或小于源 PNG 可合理缩放范围 THEN 系统 SHALL 进行高质量缩放与去锯齿处理；若明显失真，应提示用户源图不足。

### Requirement 3: 输出与命名策略

**User Story:** 作为一名讲求可读性的用户，我希望输出文件与输入文件名一致（仅扩展名从 .png → .ico），并写入到输入文件所在目录。

#### Acceptance Criteria

1. WHEN 生成 .ico THEN 系统 SHALL 使用与源文件相同的文件名并写入源目录。
2. IF 输出文件已存在 THEN 系统 SHALL 提供覆盖选项（默认覆盖可配置）；在批量模式中为每个文件应用同一策略。
3. WHEN 批量处理 THEN 系统 SHALL 尽可能并行或队列化处理，并保证 UI 不冻结。

### Requirement 4: 运行与兼容性（macOS 优先）

**User Story:** 作为 macOS 用户，我希望该应用可以在本地直接运行，具备拖放交互、文件系统访问能力，并兼容常见 macOS 版本。

#### Acceptance Criteria

1. WHEN 在 macOS 14+ 运行 THEN 系统 SHALL 支持拖拽文件到应用窗口并触发转换。
2. IF 因权限导致无法写入源目录 THEN 系统 SHALL 进行权限提示与一次性授权流程指引。
3. WHEN 应用首次启动 THEN 系统 SHALL 引导用户设置尺寸并可一键使用推荐默认。

### Requirement 5: 错误处理与可观测性

**User Story:** 作为希望快速定位问题的用户，我希望应用能清晰提示失败原因并记录简要日志。

#### Acceptance Criteria

1. WHEN 某个文件转换失败 THEN 系统 SHALL 在结果列表中显示该文件的错误类型与建议（如文件损坏/非 PNG/无写权限等）。
2. WHEN 批量处理中 THEN 系统 SHALL 在完成后提供成功/失败统计与可复制的摘要。
3. WHEN 出现无法预期的异常 THEN 系统 SHALL 记录本地日志（可在设置中查看/清理）。

## Non-Functional Requirements

### Code Architecture and Modularity
- 单一职责：UI、图像处理、文件系统访问、配置持久化各自独立。
- 模块化：图像处理库封装统一接口；设置与转换流程解耦。
- 依赖管理：尽量减少对平台特定 API 的耦合，便于未来迁移。
- 清晰接口：任务队列、进度事件、结果结构体有明确契约。

### Performance
- 单个文件转换在常见尺寸组合下应于 300ms~1.5s 内完成（取决于源图尺寸与硬件）。
- 批量转换对 UI 无明显卡顿，进度可见。

### Security
- 全本地处理，不上传任何图像或配置数据到网络。
- 权限最小化：仅在需要时请求目录写入权限。

### Reliability
- 在大文件/超高分辨率情况下应有超时与内存保护策略。
- 出错时保持应用稳定，其他文件继续处理。

### Usability
- 拖拽区域清晰、空状态有指引，结果反馈明确。
- 设置项简洁且可一键恢复推荐默认。
