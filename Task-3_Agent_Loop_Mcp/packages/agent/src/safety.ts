import fs from "node:fs/promises";
import path from "node:path";

export class SafetyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SafetyError";
    }
}

export class SafetyViolationError extends SafetyError {
    constructor(message: string) {
        super(message);
        this.name = "SafetyViolationError";
    }
}

export class FileNotFoundError extends SafetyError {
    constructor(message: string) {
        super(message);
        this.name = "FileNotFoundError";
    }
}

export class SnippetNotFoundError extends SafetyError {
    constructor(message: string) {
        super(message);
        this.name = "SnippetNotFoundError";
    }
}

/**
 * Safely resolves a relative path within the allowed root directory.
 * Rejects path traversal (../), absolute paths outside root, node_modules, and evals.
 */
export function safePath(rootDir: string, relativePath: string): string {
    const normalizedRelative = relativePath.replace(/\\/g, "/");

    // Check forbidden segments
    if (
        normalizedRelative.includes("../") ||
        normalizedRelative.startsWith("../") ||
        normalizedRelative.includes("/..") ||
        normalizedRelative === ".."
    ) {
        throw new SafetyViolationError(`Path traversal rejected: ${relativePath}`);
    }

    if (
        normalizedRelative.includes("node_modules") ||
        normalizedRelative.includes("evals")
    ) {
        throw new SafetyViolationError(`Access to forbidden directory rejected: ${relativePath}`);
    }

    const resolved = path.resolve(rootDir, relativePath);
    const normalizedRoot = path.resolve(rootDir);

    if (!resolved.startsWith(normalizedRoot)) {
        throw new SafetyViolationError(`Path outside allowed corpus root rejected: ${relativePath}`);
    }

    return resolved;
}

/**
 * Validates that an edit target is safe and that the before string exists in the file.
 */
export async function validateEditTarget(
    rootDir: string,
    patch: { file: string; before: string; after: string; reason?: string }
): Promise<string> {
    const filePath = safePath(rootDir, patch.file);

    let current: string;
    try {
        current = await fs.readFile(filePath, "utf8");
    } catch {
        throw new FileNotFoundError(`Target file not found: '${patch.file}'. Source files are located in 'src/' (e.g. 'src/math.ts').`);
    }

    if (!current.includes(patch.before)) {
        throw new SnippetNotFoundError(
            `Patch target text not found in file '${patch.file}'. Expected exact line: ${JSON.stringify(patch.before)}`
        );
    }

    return filePath;
}
