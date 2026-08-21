import { describe, it, expect } from "vitest";
import { getApiUrl } from "../src/config.js";

describe("getApiUrl", () => {
    it("throws when API_URL is missing", () => {
        delete process.env.API_URL;
        expect(() => getApiUrl()).toThrow();
    });
});