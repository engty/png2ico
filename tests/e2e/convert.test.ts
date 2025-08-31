import { describe, it, expect, beforeAll, afterAll } from "vitest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { convertFiles } from "../../src/services/convertService";
import type { FileInput } from "../../src/types/ico";

const tmpRoot = path.join(os.tmpdir(), `png-to-ico-e2e-${Date.now()}`);

async function makePng(filePath: string, size: number): Promise<void> {
	const buf = await sharp({ create: { width: size, height: size, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } })
		.png({ compressionLevel: 9 })
		.toBuffer();
	await fs.writeFile(filePath, buf);
}

describe("E2E: convert PNG to ICO", () => {
	const fileA = path.join(tmpRoot, "a.png");
	const fileB = path.join(tmpRoot, "b.png");

	beforeAll(async () => {
		await fs.mkdir(tmpRoot, { recursive: true });
		await makePng(fileA, 128);
		await makePng(fileB, 256);
	});

	afterAll(async () => {
		try { await fs.rm(tmpRoot, { recursive: true, force: true }); } catch {}
	});

	it("should create .ico files next to sources with same basename", async () => {
		const inputs: FileInput[] = [
			{ sourcePath: fileA, fileName: path.basename(fileA), directory: path.dirname(fileA) },
			{ sourcePath: fileB, fileName: path.basename(fileB), directory: path.dirname(fileB) },
		];
		const res = await convertFiles(inputs, { sizes: [16, 32, 64, 128, 256], overwrite: true });
		expect(res.failed).toBe(0);
		expect(res.succeeded).toBe(2);
		for (const item of res.items) {
			expect(item.outputPath).toBeTruthy();
			if (item.outputPath) {
				const stat = await fs.stat(item.outputPath);
				expect(stat.isFile()).toBe(true);
			}
		}
	});
});
