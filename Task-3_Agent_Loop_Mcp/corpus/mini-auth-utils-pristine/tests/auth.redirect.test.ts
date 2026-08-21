import { describe, it, expect } from "vitest";
import { getRedirectPath } from "../src/auth.js";

describe("getRedirectPath", () => {
    it("sends logged-in users to dashboard", () => {
        expect(getRedirectPath(true)).toBe("/dashboard");
    });

    it("sends logged-out users to login", () => {
        expect(getRedirectPath(false)).toBe("/login");
    });
});