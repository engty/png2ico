export interface FileInput {
	sourcePath: string;
	fileName: string;
	directory: string;
}

export interface BatchItemResult {
	inputPath: string;
	outputPath?: string;
	error?: { code: ErrorCode; message: string };
}

export interface BatchResult {
	total: number;
	succeeded: number;
	failed: number;
	items: BatchItemResult[];
}

export interface Settings {
	sizes: number[];
	overwrite: boolean;
}

export interface ConvertOptions {
	sizes?: number[];
	overwrite?: boolean;
}

export enum ErrorCode {
	INVALID_INPUT = "INVALID_INPUT",
	EACCES = "EACCES",
	EEXIST = "EEXIST",
	RESOURCE_LIMIT = "RESOURCE_LIMIT",
	UNKNOWN = "UNKNOWN"
}
