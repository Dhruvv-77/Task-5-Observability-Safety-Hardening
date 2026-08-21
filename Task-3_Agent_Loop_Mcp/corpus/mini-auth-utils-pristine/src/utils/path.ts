export function normalizePath(p: string): string {
    return p.replace("\\", "/"); // BUG
}

export function joinPath(a: string, b: string): string {
    return a + b; // BUG
}
