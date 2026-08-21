import { describe, it, expect } from "vitest";
import { isRequired } from "../src/utils/validator.js";

describe("isRequired", () => {
    it("returns false for empty string", () => {
        expect(isRequired("")).toBe(false);
    });
});