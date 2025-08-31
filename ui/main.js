const dropzone = document.getElementById('dropzone');
const sizesGroup = document.getElementById('sizes-group');

function toast(message){
	alert(message);
}

const codeToZh = {
	INVALID_INPUT: '文件不是 PNG 或文件不存在',
	EEXIST: '目标已存在（已自动重命名）',
	EACCES: '没有写入权限，请授予目录写入权限后重试',
	RESOURCE_LIMIT: '图片过大或超时，建议使用更小尺寸',
	UNKNOWN: '未知错误，请查看日志',
};

function getCheckedSizes(){
	const boxes = sizesGroup.querySelectorAll('input[name="sizeOpt"]');
	const sizes = Array.from(boxes)
		.filter(b => b.checked)
		.map(b => Number(b.value))
		.filter(n => Number.isFinite(n) && n>0)
		.sort((a,b)=>a-b);
	return sizes.length ? sizes : [32,64];
}

function setCheckedSizes(sizes){
	const set = new Set(sizes);
	sizesGroup.querySelectorAll('input[name="sizeOpt"]').forEach(b=>{
		b.checked = set.has(Number(b.value));
	});
}

async function loadConfig(){
	try{
		if (!window.api || !window.api.getConfig) {
			setCheckedSizes([32,64]);
			return;
		}
		const cfg = await window.api.getConfig();
		if (cfg && Array.isArray(cfg.sizes) && cfg.sizes.length){
			setCheckedSizes(cfg.sizes);
		}else{
			setCheckedSizes([32,64]);
			await saveConfig();
		}
	}catch{}
}

async function saveConfig(){
	try{
		if (!window.api || !window.api.setConfig) return;
		await window.api.setConfig({ sizes: getCheckedSizes() });
	}catch{}
}

sizesGroup.addEventListener('change', saveConfig);

function extractPathsFromDropEvent(e){
	const out = [];
	const files = e.dataTransfer && e.dataTransfer.files;
	if (files && files.length){
		for (const f of files){
			if (f && f.path) out.push(f.path);
		}
	}
	if (!out.length && e.dataTransfer){
		const uriList = e.dataTransfer.getData && e.dataTransfer.getData('text/uri-list');
		if (uriList){
			for (const line of uriList.split('\n')){
				if (!line || line.startsWith('#')) continue;
				try{ const u = new URL(line.trim()); if (u.protocol === 'file:') out.push(decodeURIComponent(u.pathname)); }catch{}
			}
		}
		if (!out.length){
			const plain = e.dataTransfer.getData && e.dataTransfer.getData('text/plain');
			if (plain && plain.includes('file://')){
				for (const token of plain.split(/\s+/)){
					if (!token.startsWith('file://')) continue;
					try{ const u = new URL(token.trim()); if (u.protocol === 'file:') out.push(decodeURIComponent(u.pathname)); }catch{}
				}
			}
		}
	}
	return out;
}

async function convert(paths, promptIfEmpty = true){
	if (!paths || paths.length === 0){
		if (promptIfEmpty && window.api && typeof window.api.openPngDialog === 'function'){
			const chosen = await window.api.openPngDialog();
			if (chosen && chosen.length) return convert(chosen, false);
		}
		if (!promptIfEmpty) toast('未识别到拖拽的文件，请再试或点击选择。');
		return;
	}
	const sizes = getCheckedSizes();
	if (window.api && typeof window.api.convertFiles === 'function'){
		const res = await window.api.convertFiles(paths, { sizes });
		if (res.failed === 0){
			toast('转换成功');
		}else if (res.succeeded === 0){
			const first = res.items.find(i=>i.error);
			const msg = first && first.error && (codeToZh[first.error.code] || first.error.message) || '转换失败';
			toast(`转换失败：共 ${res.total} 个，全部失败。示例错误：${msg}`);
		}else{
			const first = res.items.find(i=>i.error);
			const msg = first && first.error && (codeToZh[first.error.code] || first.error.message) || '未知错误';
			toast(`部分失败：成功 ${res.succeeded}，失败 ${res.failed}。示例错误：${msg}`);
		}
	} else {
		toast('当前为浏览器演示模式，未进行本地写入。');
	}
}

if (dropzone){
	dropzone.addEventListener('dragover', e=>{ e.preventDefault(); dropzone.classList.add('hover'); });
	dropzone.addEventListener('dragleave', ()=> dropzone.classList.remove('hover'));
	dropzone.addEventListener('drop', e=>{
		e.preventDefault();
		dropzone.classList.remove('hover');
		const paths = extractPathsFromDropEvent(e);
		convert(paths, false);
	});
	dropzone.addEventListener('click', async ()=>{
		if (window.api && typeof window.api.openPngDialog === 'function'){
			const chosen = await window.api.openPngDialog();
			if (chosen && chosen.length) await convert(chosen, false);
		}
	});
}

loadConfig();
