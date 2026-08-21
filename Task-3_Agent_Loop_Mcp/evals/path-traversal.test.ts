import { safePath, SafetyError } from "../packages/agent/src/safety.js";
import { PRISTINE_CORPUS } from "../packages/agent/src/config.js";

const boldGreen = (t: string) => `\x1b[1m\x1b[32m${t}\x1b[0m`;
const boldRed = (t: string) => `\x1b[1m\x1b[31m${t}\x1b[0m`;

function testPathTraversalRejection() {
    console.log("Running Path Traversal & Forbidden Directory Safety Test...");

    const testCases = [
        "../outside.txt",
        "../../package.json",
        "node_modules/vitest/package.json",
        "evals/report.json"
    ];

    for (const relativePath of testCases) {
        let caught = false;
        try {
            safePath(PRISTINE_CORPUS, relativePath);
        } catch (err: any) {
            if (err instanceof SafetyError) {
                caught = true;
            }
        }

        if (!caught) {
            throw new Error(boldRed(`PATH TRAVERSAL TEST FAILED: Allowed forbidden path: ${relativePath}`));
        }
    }

    console.log(boldGreen("PATH TRAVERSAL TEST PASSED: All path traversal and forbidden directory attempts were rejected."));
}

testPathTraversalRejection();
