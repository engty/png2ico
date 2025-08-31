import { describe, it, expect, beforeAll, afterAll } from "vitest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { convertFiles } from "../../src/services/convertService";
import type { FileInput } from "../../src/types/ico";

const tmpRoot = path.join(os.tmpdir(), `png-to-ico-it-${Date.now()}`);

async function makePng(filePath: string, size: number): Promise<void> {
	const buf = await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 128, b: 255, alpha: 1 } } })
		.png({ compressionLevel: 9 })
		.toBuffer();
	await fs.writeFile(filePath, buf);
}

describe("IT: convert single PNG", () => {
	const fileA = path.join(tmpRoot, "single.png");

	beforeAll(async () => {
		await fs.mkdir(tmpRoot, { recursive: true });
		await makePng(fileA, 128);
	});

	afterAll(async () => {
		try { await fs.rm(tmpRoot, { recursive: true, force: true }); } catch {}
	});

	it("should create a .ico for the input", async () => {
		const inputs: FileInput[] = [
			{ sourcePath: fileA, fileName: path.basename(fileA), directory: path.dirname(fileA) },
		];
		const res = await convertFiles(inputs, { sizes: [16, 32, 64, 128], overwrite: true });
		expect(res.failed).toBe(0);
		expect(res.succeeded).toBe(1);
		const out = res.items[0].outputPath!;
		const st = await fs.stat(out);
		expect(st.isFile()).toBe(true);
	});
});
