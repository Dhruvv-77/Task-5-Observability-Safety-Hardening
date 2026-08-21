import { describe, it, expect } from "vitest";
import { isEmail } from "../src/utils/validator.js";

describe("isEmail", () => {
    it("accepts a valid email", () => {
        expect(isEmail("a@example.com")).toBe(true);
    });

    it("returns false for null", () => {
        expect(isEmail(null)).toBe(false);
    });
});