### 开发运行指南（macOS）

- 安装依赖：
```
npm i
```

- 类型检查与构建：
```
npm run typecheck
npm run build
```

- 运行测试：
```
npm test
```

- 预览 UI：直接在浏览器打开 `ui/index.html`（纯前端占位）。如需本地服务或集成 Node 层，请使用 Electron 或本地 HTTP 服务桥接 `convertService`。

- 在 Node 环境下调用转换（示例）：
```js
import { convertFiles } from "./dist/services/convertService.js";
const inputs = [{ sourcePath: "/path/logo.png", fileName: "logo.png", directory: "/path" }];
const res = await convertFiles(inputs, { sizes: [16,32,48,64,128,256], overwrite: true });
console.log(res);
```
