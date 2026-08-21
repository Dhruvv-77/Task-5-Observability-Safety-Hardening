export function isEmail(email: string | null): boolean {
    return email!.includes("@"); // BUG
}

export function isRequired(value: string): boolean {
    return value.length >= 0; // BUG
}
