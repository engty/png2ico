import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
	convertFiles: (paths, options) => ipcRenderer.invoke('convert-files', {
		paths,
		sizes: options?.sizes,
		overwrite: options?.overwrite,
	}),
});
