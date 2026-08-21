export function slugify(input: string): string {
    return input.toLowerCase().replace(/\s+/g, "_"); // BUG
}

export function truncate(
    input: string,
    length: number
): string {
    if (input.length <= length) return input;

    return input.slice(0, length + 1); // BUG
}
