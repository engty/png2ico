import { describe, it, expect } from "vitest";
import { getLastSizes, saveSizes, getOverwriteDefault, setOverwriteDefault } from "../../src/config/configStore";

// 简化测试：仅调用 API，不断言文件系统副作用路径

describe("configStore", () => {
	it("should return defaults when no config present", async () => {
		const sizes = await getLastSizes();
		expect(Array.isArray(sizes)).toBe(true);
		const overwrite = await getOverwriteDefault();
		expect(typeof overwrite).toBe("boolean");
	});

	it("should save and read sizes/overwrite", async () => {
		await saveSizes([64, 32]);
		const sizes = await getLastSizes();
		expect(sizes[0]).toBe(32);
		await setOverwriteDefault(false);
		expect(await getOverwriteDefault()).toBe(false);
	});
});
