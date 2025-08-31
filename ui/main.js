const dropzone = document.getElementById('dropzone');
const sizesGroup = document.getElementById('sizes-group');
const toastContainer = document.getElementById('toast-container');

// Toast 提示系统
class ToastManager {
	constructor() {
		this.toasts = new Map();
	}
	
	show(message, type = 'info', duration = 3000) {
		const id = Date.now();
		const toast = document.createElement('div');
		toast.className = `toast ${type}`;
		toast.dataset.id = id;
		
		const icons = {
			success: '✅',
			error: '❌',
			warning: '⚠️',
			info: 'ℹ️'
		};
		
		toast.innerHTML = `
			<span class="toast-icon">${icons[type] || icons.info}</span>
			<span class="toast-message">${message}</span>
			<button class="toast-close" onclick="toastManager.close(${id})">×</button>
		`;
		
		toastContainer.appendChild(toast);
		this.toasts.set(id, toast);
		
		// 自动关闭
		if (duration > 0) {
			setTimeout(() => this.close(id), duration);
		}
		
		return id;
	}
	
	close(id) {
		const toast = this.toasts.get(id);
		if (toast) {
			toast.style.animation = 'slide-out 0.3s ease';
			setTimeout(() => {
				toast.remove();
				this.toasts.delete(id);
			}, 300);
		}
	}
	
	clear() {
		this.toasts.forEach((_, id) => this.close(id));
	}
}

const toastManager = new ToastManager();

// 错误代码映射
const ERROR_MESSAGES = {
	INVALID_INPUT: '文件不是 PNG 格式或文件不存在',
	EEXIST: '目标文件已存在（已自动重命名）',
	EACCES: '没有写入权限，请授予目录写入权限后重试',
	RESOURCE_LIMIT: '图片过大或处理超时，建议使用更小的尺寸',
	UNKNOWN: '未知错误，请查看控制台日志',
};

// 获取选中的尺寸
function getCheckedSizes() {
	const checkboxes = sizesGroup.querySelectorAll('input[name="sizeOpt"]:checked');
	const sizes = Array.from(checkboxes)
		.map(cb => Number(cb.value))
		.filter(n => Number.isFinite(n) && n > 0)
		.sort((a, b) => a - b);
	
	return sizes.length ? sizes : [32, 64];
}

// 设置选中的尺寸
function setCheckedSizes(sizes) {
	const sizeSet = new Set(sizes);
	sizesGroup.querySelectorAll('input[name="sizeOpt"]').forEach(checkbox => {
		checkbox.checked = sizeSet.has(Number(checkbox.value));
	});
}

// 加载配置
async function loadConfig() {
	try {
		if (!window.api?.getConfig) {
			setCheckedSizes([32, 64]);
			return;
		}
		
		const config = await window.api.getConfig();
		if (config?.sizes?.length) {
			setCheckedSizes(config.sizes);
		} else {
			setCheckedSizes([32, 64]);
			await saveConfig();
		}
	} catch (error) {
		console.error('加载配置失败:', error);
		setCheckedSizes([32, 64]);
	}
}

// 保存配置
async function saveConfig() {
	try {
		if (!window.api?.setConfig) return;
		await window.api.setConfig({ sizes: getCheckedSizes() });
	} catch (error) {
		console.error('保存配置失败:', error);
	}
}

// 监听尺寸选择变化
sizesGroup.addEventListener('change', saveConfig);

// 处理文件转换
async function convert(paths, promptIfEmpty = true) {
	// 过滤确保只有有效路径
	const validPaths = (paths || []).filter(p => p && p.length > 0);
	
	// 如果没有文件路径，尝试打开文件选择对话框
	if (!validPaths.length) {
		if (promptIfEmpty && window.api?.openPngDialog) {
			const chosen = await window.api.openPngDialog();
			if (chosen?.length) {
				return convert(chosen, false);
			}
		}
		if (!promptIfEmpty) {
			toastManager.show('未识别到拖拽的文件，请确保拖拽的是 PNG 文件', 'warning');
		}
		return;
	}
	
	// 获取选中的尺寸
	const sizes = getCheckedSizes();
	
	// 显示处理中提示
	const processingToast = toastManager.show('正在转换文件...', 'info', 0);
	
	try {
		if (window.api?.convertFiles) {
			const result = await window.api.convertFiles(validPaths, { sizes });
			
			// 关闭处理中提示
			toastManager.close(processingToast);
			
			// 根据结果显示相应提示
			if (result.failed === 0) {
				toastManager.show(`✨ 成功转换 ${result.succeeded} 个文件！`, 'success');
			} else if (result.succeeded === 0) {
				const firstError = result.items.find(item => item.error);
				const errorMsg = firstError?.error && 
					(ERROR_MESSAGES[firstError.error.code] || firstError.error.message) || 
					'转换失败';
				toastManager.show(`转换失败：${errorMsg}`, 'error');
			} else {
				const firstError = result.items.find(item => item.error);
				const errorMsg = firstError?.error && 
					(ERROR_MESSAGES[firstError.error.code] || firstError.error.message) || 
					'未知错误';
				toastManager.show(
					`部分成功：成功 ${result.succeeded} 个，失败 ${result.failed} 个。错误：${errorMsg}`,
					'warning'
				);
			}
		} else {
			toastManager.close(processingToast);
			toastManager.show('当前为浏览器演示模式，未进行本地写入', 'info');
		}
	} catch (error) {
		toastManager.close(processingToast);
		console.error('转换过程出错:', error);
		toastManager.show('转换过程出错，请查看控制台', 'error');
	}
}

// 从拖拽事件获取文件路径的辅助函数
async function getFilePathsFromDragEvent(e) {
	const items = e.dataTransfer.items;
	const files = e.dataTransfer.files;
	const paths = [];
	
	// 方法1: 使用 Electron 的 webUtils API (最可靠)
	if (window.electronAPI && window.electronAPI.getPathForFile) {
		if (files && files.length > 0) {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				try {
					const path = window.electronAPI.getPathForFile(file);
					if (path) {
						console.log('通过 electronAPI 获取到路径:', path);
						paths.push(path);
					}
				} catch (e) {
					console.error('获取文件路径失败:', e);
				}
			}
		}
	}
	
	// 方法2: 尝试从 items 获取
	if (paths.length === 0 && items && items.length > 0) {
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (item.kind === 'file') {
				const file = item.getAsFile();
				if (file) {
					// 在 Electron 环境中，文件对象应该有 path 属性
					if (file.path) {
						console.log('从 item 获取到路径:', file.path);
						paths.push(file.path);
					} else if (window.electronAPI && window.electronAPI.getPathForFile) {
						// 尝试使用 electronAPI
						try {
							const path = window.electronAPI.getPathForFile(file);
							if (path) {
								console.log('从 item 通过 electronAPI 获取到路径:', path);
								paths.push(path);
							}
						} catch (e) {
							console.error('获取文件路径失败:', e);
						}
					} else if (file.name) {
						console.log('文件名:', file.name, '- 需要完整路径');
					}
				}
			}
		}
	}
	
	// 方法3: 如果上面没有获取到，尝试从 files 获取 path 属性
	if (paths.length === 0 && files && files.length > 0) {
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (file.path) {
				console.log('从 files 获取到路径:', file.path);
				paths.push(file.path);
			}
		}
	}
	
	return paths;
}

// 设置拖拽区域事件
if (dropzone) {
	let dragCounter = 0;
	
	// 阻止默认行为
	['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
		dropzone.addEventListener(eventName, (e) => {
			e.preventDefault();
			e.stopPropagation();
		});
		
		document.body.addEventListener(eventName, (e) => {
			e.preventDefault();
			e.stopPropagation();
		});
	});
	
	// 拖拽进入
	dropzone.addEventListener('dragenter', () => {
		dragCounter++;
		dropzone.classList.add('hover');
	});
	
	// 拖拽离开
	dropzone.addEventListener('dragleave', () => {
		dragCounter--;
		if (dragCounter === 0) {
			dropzone.classList.remove('hover');
		}
	});
	
	// 拖拽释放 - 核心处理
	dropzone.addEventListener('drop', async (e) => {
		dragCounter = 0;
		dropzone.classList.remove('hover');
		
		console.log('Drop event:', e.dataTransfer);
		console.log('Files:', e.dataTransfer.files);
		console.log('Items:', e.dataTransfer.items);
		
		// 获取文件路径
		const paths = await getFilePathsFromDragEvent(e);
		
		if (paths.length > 0) {
			console.log('获取到文件路径:', paths);
			
			// 通过主进程验证文件
			if (window.api?.handleFileDrop) {
				try {
					const result = await window.api.handleFileDrop(paths);
					if (result.error) {
						toastManager.show(result.error, 'warning');
					} else if (result.paths && result.paths.length > 0) {
						await convert(result.paths, false);
					}
				} catch (error) {
					console.error('处理拖拽文件出错:', error);
					toastManager.show('处理拖拽文件出错', 'error');
				}
			} else {
				// 直接转换
				await convert(paths, false);
			}
		} else {
			// 尝试另一种方法：获取拖拽的文本（可能包含文件路径）
			const text = e.dataTransfer.getData('text/plain');
			if (text) {
				console.log('拖拽文本:', text);
				// 检查是否是文件路径
				if (text.endsWith('.png') || text.endsWith('.PNG')) {
					const paths = [text];
					if (window.api?.handleFileDrop) {
						const result = await window.api.handleFileDrop(paths);
						if (result.paths && result.paths.length > 0) {
							await convert(result.paths, false);
							return;
						}
					}
				}
			}
			
			console.error('无法获取文件路径');
			toastManager.show('未识别到拖拽的文件，请确保拖拽的是 PNG 文件', 'warning');
		}
	});
	
	// 点击选择文件
	dropzone.addEventListener('click', async () => {
		if (window.api?.openPngDialog) {
			const chosen = await window.api.openPngDialog();
			if (chosen?.length) {
				await convert(chosen, false);
			}
		} else {
			toastManager.show('文件选择功能不可用', 'error');
		}
	});
}

// 初始化时加载配置
loadConfig();

// 导出供全局使用
window.toastManager = toastManager;

// 调试信息
console.log('拖拽处理已初始化');
console.log('window.api:', window.api);
console.log('window.electronAPI:', window.electronAPI);