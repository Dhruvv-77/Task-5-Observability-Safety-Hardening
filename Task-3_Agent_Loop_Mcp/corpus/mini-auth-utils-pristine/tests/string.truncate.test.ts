import { describe, it, expect } from "vitest";
import { truncate } from "../src/string.js";

describe("truncate", () => {
    it("truncates to exact length", () => {
        expect(truncate("abcdef", 3)).toBe("abc");
    });
});