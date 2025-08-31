// 注意：本示例 UI 在纯浏览器环境中演示，不直接调用 Node 层。
// 如果在 Electron/本地服务器环境中运行，可在此处桥接到 convertService。
const output = document.getElementById("output") as HTMLPreElement;
const dropzone = document.getElementById("dropzone") as HTMLElement;
const picker = document.getElementById("filePicker") as HTMLInputElement;
const sizesInput = document.getElementById("sizes") as HTMLInputElement;
const overwriteInput = document.getElementById("overwrite") as HTMLInputElement;
const saveBtn = document.getElementById("saveSettings") as HTMLButtonElement;

function log(msg: string, data?: any){
	output.textContent += `\n${msg}${data?"\n"+JSON.stringify(data,null,2):""}`;
}

function parseSizes(raw: string): number[]{
	return raw.split(",").map(s=>Number(s.trim())).filter(n=>Number.isFinite(n)&&n>0).sort((a,b)=>a-b);
}

function onFiles(files: FileList|File[]){
	const sizes = parseSizes(sizesInput.value || "16,32,48,64,128,256");
	const overwrite = overwriteInput.checked;
	const names = Array.from(files).map(f=>f.name);
	log("接收到文件（演示占位，不执行本地写入）", { names, sizes, overwrite });
}

dropzone.addEventListener("dragover", e=>{ e.preventDefault(); dropzone.classList.add("hover"); });
dropzone.addEventListener("dragleave", ()=> dropzone.classList.remove("hover"));
dropzone.addEventListener("drop", e=>{ e.preventDefault(); dropzone.classList.remove("hover"); onFiles((e.dataTransfer?.files)!); });

picker.addEventListener("change", ()=>{ if(picker.files) onFiles(picker.files); });

saveBtn.addEventListener("click", ()=>{
	log("设置已保存（演示占位，实际保存由本地服务处理）", { sizes: sizesInput.value, overwrite: overwriteInput.checked });
});
