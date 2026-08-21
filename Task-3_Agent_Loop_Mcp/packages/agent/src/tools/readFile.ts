import fs from "node:fs/promises";
import { BROKEN_CORPUS } from "../config.js";
import { safePath } from "../safety.js";

export async function readFileTool(relativePath: string): Promise<string> {
    const filePath = safePath(BROKEN_CORPUS, relativePath);
    return await fs.readFile(filePath, "utf8");
}
