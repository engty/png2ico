import { describe, it, expect } from "vitest";
import { convertFiles } from "../../src/services/convertService";

describe("convertService", () => {
	it("should export convertFiles", async () => {
		expect(typeof convertFiles).toBe("function");
	});
});
