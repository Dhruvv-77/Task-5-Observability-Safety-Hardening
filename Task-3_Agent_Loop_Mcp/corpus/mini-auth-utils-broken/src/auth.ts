export function getRedirectPath(
    loggedIn: boolean
): string {
    return loggedIn ? "/login" : "/dashboard"; // BUG
}

export function isSessionExpired(
    minutes: number
): boolean {
    return minutes > 30; // BUG
}

export function retryLimitExceeded(
    attempts: number
): boolean {
    return attempts > 5; // BUG
}
