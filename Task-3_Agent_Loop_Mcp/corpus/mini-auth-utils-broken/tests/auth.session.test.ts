import { describe, it, expect } from "vitest";
import { isSessionExpired } from "../src/auth.js";

describe("isSessionExpired", () => {
    it("expires at exactly 30 minutes", () => {
        expect(isSessionExpired(30)).toBe(true);
    });

    it("does not expire before 30 minutes", () => {
        expect(isSessionExpired(29)).toBe(false);
    });
});