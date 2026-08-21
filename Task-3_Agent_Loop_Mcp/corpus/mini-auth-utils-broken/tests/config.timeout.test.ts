import { describe, it, expect } from "vitest";
import { getTimeout } from "../src/config.js";

describe("getTimeout", () => {
    it("defaults to 3000 ms", () => {
        delete process.env.REQUEST_TIMEOUT;
        expect(getTimeout()).toBe(3000);
    });
});