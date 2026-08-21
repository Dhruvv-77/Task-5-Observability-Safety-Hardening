import { describe, it, expect } from "vitest";
import { retryLimitExceeded } from "../src/auth.js";

describe("retryLimitExceeded", () => {
    it("triggers at exactly 5 attempts", () => {
        expect(retryLimitExceeded(5)).toBe(true);
    });
});