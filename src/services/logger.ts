import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

const APP_DIR_NAME = "png-to-ico-converter";

function getLogDir(): string {
	return path.join(os.homedir(), "Library", "Application Support", APP_DIR_NAME, "logs");
}

function getLogFilePath(): string {
	const date = new Date();
	const yyyy = String(date.getFullYear());
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	return path.join(getLogDir(), `${yyyy}-${mm}.log`);
}

async function ensureDir(dirPath: string): Promise<void> {
	await fs.mkdir(dirPath, { recursive: true });
}

async function append(line: string): Promise<void> {
	const dir = getLogDir();
	await ensureDir(dir);
	const filePath = getLogFilePath();
	await fs.appendFile(filePath, line + "\n", "utf8");
}

export function getLogPath(): string {
	return getLogFilePath();
}

export async function info(message: string, meta?: any): Promise<void> {
	const ts = new Date().toISOString();
	const payload = meta ? `${message} | ${JSON.stringify(meta)}` : message;
	await append(`[${ts}] [INFO] ${payload}`);
}

export async function error(message: string, meta?: any): Promise<void> {
	const ts = new Date().toISOString();
	const payload = meta ? `${message} | ${JSON.stringify(meta)}` : message;
	await append(`[${ts}] [ERROR] ${payload}`);
}
