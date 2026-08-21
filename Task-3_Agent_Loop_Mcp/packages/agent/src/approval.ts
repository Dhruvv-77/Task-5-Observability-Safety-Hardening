import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { validateEditTarget } from "./safety.js";
import type { PatchProposal } from "./tools/proposeEdit.js";

export async function validateEdit(rootDir: string, patch: PatchProposal): Promise<void> {
    // Delegates central path & target validation to safety.ts
    await validateEditTarget(rootDir, patch);
}

export async function requestApproval(
    rootDir: string,
    patch: PatchProposal
): Promise<boolean> {
    // Safety gate MUST run before any approval step (interactive or auto-approve)
    await validateEditTarget(rootDir, patch);

    console.log("\n--- Proposed patch ---");
    console.log(JSON.stringify(patch, null, 2));

    // Auto-approve mode: used by the evaluation harness (pnpm eval).
    // Triggers ONLY after safety validation has passed.
    if (process.env.AUTO_APPROVE === "1") {
        console.log("Apply patch? (y/n): y [auto-approved post-safety]");
        return true;
    }

    const rl = readline.createInterface({ input, output });
    const answer = await rl.question("Apply patch? (y/n): ");
    rl.close();

    return answer.trim().toLowerCase() === "y";
}
