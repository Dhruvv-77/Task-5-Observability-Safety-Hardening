import fs from "node:fs/promises";
import path from "node:path";
import { ROOT } from "../config.js";

export async function writeFileTool(
    relativePath: string,
    content: string
) {
    const fullPath = path.join(ROOT, relativePath);
    await fs.writeFile(fullPath, content);
}