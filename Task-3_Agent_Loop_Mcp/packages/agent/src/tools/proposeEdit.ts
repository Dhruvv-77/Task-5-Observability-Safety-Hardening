import { BROKEN_CORPUS } from "../config.js";
import { validateEditTarget } from "../safety.js";

export interface PatchProposal {
    file: string;
    before: string;
    after: string;
    reason: string;
}

export async function proposeEditTool(patch: PatchProposal): Promise<{ ok: boolean; proposal: PatchProposal; diff: string }> {
    // Validate target file and presence of before text (throws SafetyError on failure)
    await validateEditTarget(BROKEN_CORPUS, patch);

    const diff = `--- ${patch.file}\n+++ ${patch.file}\n- ${patch.before}\n+ ${patch.after}`;

    return {
        ok: true,
        proposal: patch,
        diff
    };
}
