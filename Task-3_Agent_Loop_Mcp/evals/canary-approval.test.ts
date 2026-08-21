import { validateEditTarget, SafetyError } from "../packages/agent/src/safety.js";
import { requestApproval } from "../packages/agent/src/approval.js";
import { PRISTINE_CORPUS } from "../packages/agent/src/config.js";

const green = (t: string) => `\x1b[32m${t}\x1b[0m`;
const boldGreen = (t: string) => `\x1b[1m\x1b[32m${t}\x1b[0m`;
const boldRed = (t: string) => `\x1b[1m\x1b[31m${t}\x1b[0m`;

async function runCanaryTest() {
    console.log("Running Canary Approval Safety Test...");

    let caughtSnippetError = false;
    try {
        await validateEditTarget(PRISTINE_CORPUS, {
            file: "src/math.ts",
            before: "non_existent_code_snippet_xyz()",
            after: "fixed()",
            reason: "Canary test"
        });
    } catch (err: any) {
        if (err instanceof SafetyError && err.message.includes("Patch target text not found")) {
            caughtSnippetError = true;
        }
    }

    if (!caughtSnippetError) {
        throw new Error(boldRed("CANARY TEST FAILED: Approval gate failed to catch invalid target snippet!"));
    }

    let caughtTraversalError = false;
    try {
        await requestApproval(PRISTINE_CORPUS, {
            file: "../outside.txt",
            before: "test",
            after: "test",
            reason: "Canary traversal test"
        });
    } catch (err: any) {
        if (err instanceof SafetyError && err.message.includes("Path traversal rejected")) {
            caughtTraversalError = true;
        }
    }

    if (!caughtTraversalError) {
        throw new Error(boldRed("CANARY TEST FAILED: Approval gate failed to catch path traversal!"));
    }

    console.log(boldGreen("CANARY TEST PASSED: Approval and safety gates successfully caught violations."));
}

runCanaryTest().catch(err => {
    console.error(err);
    process.exit(1);
});