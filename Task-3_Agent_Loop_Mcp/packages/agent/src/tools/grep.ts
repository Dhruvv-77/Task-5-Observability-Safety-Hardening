import fs from "node:fs/promises";
import path from "node:path";
import { BROKEN_CORPUS } from "../config.js";
import { safePath } from "../safety.js";

async function walk(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === "evals") continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await walk(full)));
        } else {
            files.push(full);
        }
    }
    return files;
}

export async function grepTool(pattern: string): Promise<string> {
    const files = await walk(BROKEN_CORPUS);
    const matches: string[] = [];

    for (const file of files) {
        const text = await fs.readFile(file, "utf8");
        if (text.includes(pattern)) {
            const rel = path.relative(BROKEN_CORPUS, file).replace(/\\/g, "/");
            matches.push(rel);
        }
    }

    return matches.length ? matches.join("\n") : "No matches found";
}
