import { app, BrowserWindow, ipcMain, dialog, protocol } from 'electron';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
import { convertFiles } from '../dist/services/convertService.js';
import { getLastSizes, saveSizes } from '../dist/config/configStore.js';

// 启用文件协议支持
app.commandLine.appendSwitch('disable-web-security');

const createWindow = () => {
	const win = new BrowserWindow({
		width: 520,
		height: 520,
		resizable: false,
		webPreferences: {
			preload: path.join(process.cwd(), 'electron', 'preload.cjs'),
			contextIsolation: true,
			nodeIntegration: false,
			webSecurity: false,
		},
		titleBarStyle: 'default',
		center: true,
		// 启用拖拽文件
		acceptFirstMouse: true,
		webPreferences: {
			preload: path.join(process.cwd(), 'electron', 'preload.cjs'),
			contextIsolation: true,
			nodeIntegration: false,
			webSecurity: false,
			// 允许拖拽文件
			experimentalFeatures: true,
		},
	});

	const indexPath = url.pathToFileURL(path.join(process.cwd(), 'ui', 'index.html')).toString();
	win.loadURL(indexPath);

	// 处理拖拽文件 - 监听 DOM 的 drop 事件
	win.webContents.on('dom-ready', () => {
		// 注入拖拽处理脚本
		win.webContents.executeJavaScript(`
			// 覆盖默认的拖拽行为
			document.addEventListener('dragover', (e) => {
				e.preventDefault();
				e.stopPropagation();
			}, false);

			document.addEventListener('drop', (e) => {
				e.preventDefault();
				e.stopPropagation();
			}, false);
		`);
	});

	// 阻止文件拖拽导致的页面导航
	win.webContents.on('will-navigate', (e, url) => {
		e.preventDefault();
	});

	// 开发者工具（调试用）
	// win.webContents.openDevTools();
};

app.whenReady().then(() => {
	// 注册文件协议
	protocol.registerFileProtocol('file', (request, callback) => {
		const pathname = decodeURI(request.url.replace('file:///', ''));
		callback(pathname);
	});

	createWindow();
	
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

// 处理文件拖拽 - 新的处理方式
ipcMain.handle('handle-file-drop', async (_evt, filePaths) => {
	console.log('主进程收到拖拽文件:', filePaths);
	
	// 过滤出 PNG 文件
	const pngFiles = filePaths.filter(p => {
		return p && p.toLowerCase().endsWith('.png') && fs.existsSync(p);
	});
	
	if (pngFiles.length === 0) {
		return { error: '没有找到有效的 PNG 文件' };
	}
	
	return { paths: pngFiles };
});

ipcMain.handle('convert-files', async (_evt, payload) => {
	try {
		const { paths, sizes } = payload || {};
		console.log('开始转换文件:', paths);
		
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