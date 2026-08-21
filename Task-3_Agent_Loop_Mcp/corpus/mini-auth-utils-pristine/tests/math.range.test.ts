import { describe, it, expect } from "vitest";
import { range } from "../src/math.js";

describe("range", () => {
    it("returns an inclusive range", () => {
        expect(range(1, 3)).toEqual([1, 2, 3]);
    });
});
