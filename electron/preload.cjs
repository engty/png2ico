const { contextBridge, ipcRenderer } = require('electron');

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