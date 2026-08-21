export function getApiUrl(): string {
    throw new Error('API_URL is missing'); // BUG
}

export function getTimeout(): number {
    return Number(process.env.REQUEST_TIMEOUT ?? 0); // BUG
}
