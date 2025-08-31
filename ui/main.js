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

// 设置拖拽区域事件
if (dropzone) {
	let dragCounter = 0; // 用于处理子元素的 dragenter/dragleave
	
	// 拖拽进入
	dropzone.addEventListener('dragenter', (e) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter++;
		dropzone.classList.add('hover');
	});
	
	// 拖拽悬停
	dropzone.addEventListener('dragover', (e) => {
		e.preventDefault();
		e.stopPropagation();
	});
	
	// 拖拽离开
	dropzone.addEventListener('dragleave', (e) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter--;
		if (dragCounter === 0) {
			dropzone.classList.remove('hover');
		}
	});
	
	// 拖拽释放
	dropzone.addEventListener('drop', async (e) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter = 0;
		dropzone.classList.remove('hover');
		
		// 获取拖拽的文件
		const files = e.dataTransfer?.files;
		const paths = [];
		
		if (files && files.length > 0) {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				// 在 Electron 中，File 对象有 path 属性
				if (file.path) {
					console.log('从拖拽获取到文件路径:', file.path);
					paths.push(file.path);
				} else {
					console.warn('文件没有 path 属性:', file.name, '可能不在 Electron 环境中');
				}
			}
		}
		
		if (paths.length > 0) {
			await convert(paths, false);
		} else {
			console.error('无法从拖拽事件中提取文件路径');
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

// 监听主进程转发的拖拽文件路径（处理 Finder 直接拖入窗口的情况）
window.addEventListener('message', (event) => {
	if (event.data?.type === 'dropped-files' && Array.isArray(event.data.paths)) {
		console.log('收到主进程转发的文件路径:', event.data.paths);
		convert(event.data.paths, false);
	}
});

// 防止整个窗口的默认拖拽行为
document.addEventListener('dragover', (e) => {
	e.preventDefault();
	e.dataTransfer.dropEffect = 'copy';
});

document.addEventListener('drop', (e) => {
	e.preventDefault();
});

// 初始化时加载配置
loadConfig();

// 导出供全局使用
window.toastManager = toastManager;