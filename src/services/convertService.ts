import { type FileInput, type BatchResult, type ConvertOptions, ErrorCode } from "../types/ico.js";
import { getLastSizes } from "../config/configStore.js";
import { readPng, writeIco, deriveOutPath } from "./fsService.js";
import { generateIcoFromPngBuffers } from "../image/imageLib.js";
import * as logger from "./logger.js";

export async function convertFiles(inputs: FileInput[], options: ConvertOptions = {}): Promise<BatchResult> {
	const sizes = options.sizes && options.sizes.length ? options.sizes : await getLastSizes();

	const items: BatchResult["items"] = [];
	let succeeded = 0;
	let failed = 0;

	for (const input of inputs) {
		const inputPath = input.sourcePath;
		try {
			const pngBuf = await readPng(inputPath);
			const icoBuf = await generateIcoFromPngBuffers([pngBuf], sizes);
			const outPath = deriveOutPath(inputPath);
			const finalPath = await writeIco(outPath, icoBuf);
			items.push({ inputPath, outputPath: finalPath });
			succeeded += 1;
			await logger.info("convert:success", { inputPath, outPath: finalPath, sizes });
		} catch (err: any) {
			failed += 1;
			const code: ErrorCode = err?.code && typeof err.code === "string" ? err.code as ErrorCode : ErrorCode.UNKNOWN;
			items.push({ inputPath, error: { code, message: err?.message ?? String(err) } });
			await logger.error("convert:failure", { inputPath, code, message: err?.message });
		}
	}

	return { total: inputs.length, succeeded, failed, items };
}
