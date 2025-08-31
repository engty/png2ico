### 构建与打包说明

- 构建 TypeScript：
```
npm run build
```

- 产物位置：`dist/`

- 打包应用：本项目暂不直接提供打包脚本。推荐后续接入 Electron 或 Tauri，并在对应项目内直接依赖此库（`dist/`）以实现本地 GUI 与文件系统权限控制。

- 镜像与缓存：`.npmrc` 已设置 `registry=https://registry.npmmirror.com`、`cache=./.npm-cache`。如使用 pnpm，已配置 `store-dir=./.pnpm-store`。
