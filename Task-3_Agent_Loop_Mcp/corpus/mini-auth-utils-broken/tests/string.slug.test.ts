import { describe, it, expect } from "vitest";
import { slugify } from "../src/string.js";

describe("slugify", () => {
    it("replaces spaces with hyphens", () => {
        expect(slugify("Hello World")).toBe("hello-world");
    });
});