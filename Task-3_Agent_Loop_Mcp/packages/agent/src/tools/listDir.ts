import fs from "node:fs/promises";
import path from "node:path";
import { BROKEN_CORPUS } from "../config.js";
import { safePath } from "../safety.js";

export async function listDirTool(relativePath: string = ""): Promise<string> {
    const dirPath = safePath(BROKEN_CORPUS, relativePath);
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    const items = entries
        .filter(entry => entry.name !== "node_modules")
        .map(entry => `${entry.isDirectory() ? "[DIR] " : "[FILE] "} ${entry.name}`);

    return items.length ? items.join("\n") : "Directory is empty";
}
