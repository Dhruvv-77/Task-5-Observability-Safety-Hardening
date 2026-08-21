import { describe, it, expect } from "vitest";
import { getRedirectPath, isSessionExpired } from "../src/auth.js";

describe("integration.redirect-session", () => {
    it("expired sessions redirect to login", () => {
        const expired = isSessionExpired(30);
        expect(getRedirectPath(!expired)).toBe("/login");
    });
});