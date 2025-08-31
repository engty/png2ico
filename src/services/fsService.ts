import path from "node:path";
import fs from "node:fs/promises";
import { ErrorCode } from "../types/ico.js";

async function statSafe(p: string): Promise<import("node:fs").Stats | undefined> {
	try {
		return await fs.stat(p);
	} catch (err: any) {
		if (err && err.code === "ENOENT") return undefined;
		throw err;
	}
}

export function deriveOutPath(pngPath: string): string {
	const dir = path.dirname(pngPath);
	const base = path.basename(pngPath, path.extname(pngPath));
	return path.join(dir, `${base}.ico`);
}

export async function ensureDirWritable(dirPath: string): Promise<void> {
	try {
		await fs.access(dirPath, (fs as any).constants?.W_OK ?? 2);
	} catch (err: any) {
		if (err && (err.code === "EACCES" || err.code === "EPERM")) {
			const e: any = new Error("Directory not writable");
			e.code = ErrorCode.EACCES;
			throw e;
		}
		throw err;
	}
}

export async function readPng(filePath: string): Promise<Buffer> {
	try {
		const data = await fs.readFile(filePath);
		// 简单的 PNG 魔数检查 (\x89PNG\r\n\x1A\n)
		if (data.length < 8 || data.readUInt32BE(0) !== 0x89504e47) {
			const e: any = new Error("Invalid PNG file");
			e.code = ErrorCode.INVALID_INPUT;
			throw e;
		}
		return data;
	} catch (err: any) {
		if (err && err.code === ErrorCode.INVALID_INPUT) throw err;
		if (err && err.code === "ENOENT") {
			const e: any = new Error("PNG file not found");
			e.code = ErrorCode.INVALID_INPUT;
			throw e;
		}
		throw err;
	}
}

async function findAvailableName(targetPath: string): Promise<string> {
	const dir = path.dirname(targetPath);
	const base = path.basename(targetPath, ".ico");
	let idx = 1;
	let candidate = targetPath;
	while (await statSafe(candidate)) {
		candidate = path.join(dir, `${base}_${idx}.ico`);
		idx += 1;
	}
	return candidate;
}

export async function writeIco(filePath: string, data: Buffer): Promise<string> {
	const dir = path.dirname(filePath);
	await ensureDirWritable(dir);
	const finalPath = (await statSafe(filePath)) ? await findAvailableName(filePath) : filePath;
	const tmp = `${finalPath}.tmp-${Date.now()}`;
	await fs.writeFile(tmp, new Uint8Array(data));
	await fs.rename(tmp, finalPath);
	return finalPath;
}
