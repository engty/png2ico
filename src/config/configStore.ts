import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import type { Settings } from "../types/ico.js";

const APP_DIR_NAME = "png-to-ico-converter";
const CONFIG_FILE_NAME = "config.json";
const DEFAULT_SIZES: number[] = [16, 32, 48, 64, 128, 256];
const DEFAULT_OVERWRITE = true;

function getConfigDir(): string {
	if (process.platform === "darwin") {
		return path.join(os.homedir(), "Library", "Application Support", APP_DIR_NAME);
	}
	// 非 macOS 情况下仍提供合理默认
	return path.join(os.homedir(), `.${APP_DIR_NAME}`);
}

function getConfigPath(): string {
	return path.join(getConfigDir(), CONFIG_FILE_NAME);
}

async function ensureDir(dirPath: string): Promise<void> {
	await fs.mkdir(dirPath, { recursive: true });
}

function sanitizeSettings(raw: Partial<Settings> | undefined): Settings | undefined {
	if (!raw) return undefined;
	const sizes = Array.isArray(raw.sizes)
		? Array.from(new Set(raw.sizes))
				.filter((n) => Number.isFinite(n) && n > 0)
				.sort((a, b) => a - b)
		: undefined;
	const overwrite = typeof raw.overwrite === "boolean" ? raw.overwrite : undefined;

	if (!sizes && typeof overwrite !== "boolean") return undefined;
	return {
		sizes: sizes ?? DEFAULT_SIZES,
		overwrite: overwrite ?? DEFAULT_OVERWRITE,
	};
}

async function readConfig(): Promise<Settings | undefined> {
	const configPath = getConfigPath();
	try {
		const content = await fs.readFile(configPath, "utf8");
		const parsed = JSON.parse(content) as Partial<Settings>;
		return sanitizeSettings(parsed) ?? { sizes: DEFAULT_SIZES, overwrite: DEFAULT_OVERWRITE };
	} catch (err: any) {
		if (err && err.code === "ENOENT") {
			return undefined;
		}
		throw err;
	}
}

async function writeConfig(next: Settings): Promise<void> {
	const dir = getConfigDir();
	await ensureDir(dir);
	const configPath = getConfigPath();
	const tmpPath = `${configPath}.tmp-${Date.now()}`;
	const payload = JSON.stringify(next, null, 2);
	await fs.writeFile(tmpPath, payload, "utf8");
	await fs.rename(tmpPath, configPath);
}

export async function getLastSizes(): Promise<number[]> {
	const cfg = await readConfig();
	return cfg?.sizes?.length ? cfg.sizes : DEFAULT_SIZES;
}

export async function saveSizes(sizes: number[]): Promise<void> {
	const sanitized = Array.from(new Set(sizes))
		.filter((n) => Number.isFinite(n) && n > 0)
		.sort((a, b) => a - b);
	const prev = (await readConfig()) ?? { sizes: DEFAULT_SIZES, overwrite: DEFAULT_OVERWRITE };
	await writeConfig({ ...prev, sizes: sanitized });
}

export async function getOverwriteDefault(): Promise<boolean> {
	const cfg = await readConfig();
	return typeof cfg?.overwrite === "boolean" ? cfg.overwrite : DEFAULT_OVERWRITE;
}

export async function setOverwriteDefault(value: boolean): Promise<void> {
	const prev = (await readConfig()) ?? { sizes: DEFAULT_SIZES, overwrite: DEFAULT_OVERWRITE };
	await writeConfig({ ...prev, overwrite: Boolean(value) });
}

export function getConfigFilePath(): string {
	return getConfigPath();
}
