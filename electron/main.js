import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import url from 'node:url';
import { convertFiles } from '../dist/services/convertService.js';
import { getLastSizes, saveSizes } from '../dist/config/configStore.js';

const createWindow = () => {
	const win = new BrowserWindow({
		width: 900,
		height: 560,
		resizable: false,
		webPreferences: {
			preload: path.join(process.cwd(), 'electron', 'preload.cjs'),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	const indexPath = url.pathToFileURL(path.join(process.cwd(), 'ui', 'index.html')).toString();
	win.loadURL(indexPath);
};

app.whenReady().then(() => {
	createWindow();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('convert-files', async (_evt, payload) => {
	try {
		const { paths, sizes } = payload || {};
		const inputs = (paths || []).map((p) => ({
			sourcePath: p,
			fileName: path.basename(p),
			directory: path.dirname(p),
		}));
		const result = await convertFiles(inputs, { sizes });
		return result;
	} catch (err) {
		console.error('convert-files error', err);
		throw err;
	}
});

ipcMain.handle('dialog-open', async () => {
	const res = await dialog.showOpenDialog({
		properties: ['openFile', 'multiSelections'],
		filters: [{ name: 'PNG Images', extensions: ['png'] }],
	});
	return res.canceled ? [] : res.filePaths;
});

ipcMain.handle('get-config', async () => {
	const sizes = await getLastSizes();
	return { sizes };
});

ipcMain.handle('set-config', async (_e, payload) => {
	const { sizes } = payload || {};
	if (Array.isArray(sizes)) await saveSizes(sizes);
	return true;
});
