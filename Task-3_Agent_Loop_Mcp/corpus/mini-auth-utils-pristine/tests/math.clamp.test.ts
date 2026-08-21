import { describe, it, expect } from "vitest";
import { clamp } from "../src/math.js";

describe("clamp", () => {
    it("clamps values above the maximum", () => {
        expect(clamp(10, 0, 5)).toBe(5);
    });
});