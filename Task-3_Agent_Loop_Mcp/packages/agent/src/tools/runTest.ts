import { execSync } from "node:child_process";
import { BROKEN_CORPUS } from "../config.js";
import { safePath } from "../safety.js";

export function runTest(testFile: string): { success: boolean; output: string } {
    // Basic test name sanitize to prevent shell injection
    const cleanTestFile = testFile.replace(/^tests\//, "").replace(/[^a-zA-Z0-9._-]/g, "");

    const cwd = BROKEN_CORPUS;
    try {
        const output = execSync(
            `pnpm exec vitest run tests/${cleanTestFile}`,
            {
                cwd,
                encoding: "utf8",
                stdio: "pipe",
            }
        );
        return { success: true, output };
    } catch (err: any) {
        return {
            success: false,
            output: err.stderr?.toString() || err.stdout?.toString() || err.message,
        };
    }
}
