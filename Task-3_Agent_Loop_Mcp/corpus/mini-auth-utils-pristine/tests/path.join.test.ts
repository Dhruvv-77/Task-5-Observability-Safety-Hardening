import { describe, it, expect } from "vitest";
import { joinPath } from "../src/utils/path.js";

describe("joinPath", () => {
    it("joins two path segments with a slash", () => {
        expect(joinPath("/home", "user")).toBe("/home/user");
    });
});