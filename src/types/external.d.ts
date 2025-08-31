declare module "png-to-ico" {
	const fn: (buffers: Buffer[]) => Promise<Buffer>;
	export default fn;
}
