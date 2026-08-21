import fs from "node:fs/promises";
import { BROKEN_CORPUS } from "../config.js";
import { validateEditTarget } from "../safety.js";
import type { PatchProposal } from "./proposeEdit.js";

export async function applyEdit(patch: PatchProposal): Promise<void> {
    const filePath = await validateEditTarget(BROKEN_CORPUS, patch);
    const content = await fs.readFile(filePath, "utf8");
    const updated = content.replace(patch.before, patch.after);
    await fs.writeFile(filePath, updated, "utf8");
}
