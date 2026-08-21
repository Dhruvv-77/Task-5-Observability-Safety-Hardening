import { describe, it, expect } from "vitest";
import { normalizePath } from "../src/utils/path.js";

describe("normalizePath", () => {
    it("replaces all backslashes with forward slashes", () => {
        expect(normalizePath("a\\b\\c")).toBe("a/b/c");
    });
});