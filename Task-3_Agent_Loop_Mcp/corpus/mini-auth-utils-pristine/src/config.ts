export function getApiUrl(): string {
    return process.env.API_URL ?? "http://localhost:3000"; // BUG
}

export function getTimeout(): number {
    return Number(process.env.REQUEST_TIMEOUT ?? 0); // BUG
}
