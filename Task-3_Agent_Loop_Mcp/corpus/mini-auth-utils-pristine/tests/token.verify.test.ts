import { describe, it, expect } from "vitest";
import { verifyToken } from "../src/utils/token.js";

describe("verifyToken", () => {
    it("accepts tokens with tok_ prefix", () => {
        expect(verifyToken("tok_123")).toBe(true);
    });

    it("rejects tokens without tok_ prefix", () => {
        expect(verifyToken("123")).toBe(false);
    });
});