const { contextBridge, ipcRenderer, webUtils } = require('electron');

// 暴露文件路径获取功能
contextBridge.exposeInMainWorld('electronAPI', {
	getPathForFile: (file) => {
		// 使用 webUtils.getPathForFile 获取文件路径
		try {
			if (webUtils && webUtils.getPathForFile) {
				return webUtils.getPathForFile(file);
			}
		} catch (e) {
			console.error('获取文件路径失败:', e);
		}
		return null;
	}
});

contextBridge.exposeInMainWorld('api', {
	convertFiles: (paths, options) => ipcRenderer.invoke('convert-files', {
		paths,
		sizes: options && options.sizes,
	}),
	openPngDialog: () => ipcRenderer.invoke('dialog-open'),
	getConfig: () => ipcRenderer.invoke('get-config'),
	setConfig: (cfg) => ipcRenderer.invoke('set-config', cfg),
	handleFileDrop: (paths) => ipcRenderer.invoke('handle-file-drop', paths),
});