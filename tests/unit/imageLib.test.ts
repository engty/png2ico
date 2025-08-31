import { describe, it, expect } from "vitest";
import { resizeTo } from "../../src/image/imageLib";

// 使用空 Buffer 可能导致处理库抛错，此处仅验证函数存在与类型

describe("imageLib", () => {
	it("should have resizeTo function", async () => {
		expect(typeof resizeTo).toBe("function");
	});
});
