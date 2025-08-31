export function showFirstRunGuide(container: HTMLElement){
	container.innerHTML = `
		<h2>首次启动</h2>
		<ol>
			<li>设置推荐尺寸：16,32,48,64,128,256</li>
			<li>如提示目录写入权限，请按系统指引授权</li>
			<li>拖拽 PNG 文件到界面即可开始转换</li>
		</ol>
	`;
}
