import sharp from "sharp";
import pngToIco from "png-to-ico";

export async function resizeTo(buffer: Buffer, size: number): Promise<Buffer> {
	return await sharp(buffer)
		.resize(size, size, { fit: "cover", kernel: sharp.kernel.lanczos3, withoutEnlargement: false })
		.png({ compressionLevel: 9 })
		.toBuffer();
}

export async function generateIcoFromPngBuffers(buffers: Buffer[], sizes: number[]): Promise<Buffer> {
	const resizedBuffers: Buffer[] = [];
	for (const size of sizes) {
		for (const buf of buffers) {
			const resized = await resizeTo(buf, size);
			resizedBuffers.push(resized);
		}
	}
	return await pngToIco(resizedBuffers);
}
