export function range(start: number, end: number): number[] {
    const result: number[] = [];

    // BUG: should include the end value
    for (let i = start; i < end; i++) {
        result.push(i);
    }

    return result;
}

export function clamp(
    value: number,
    min: number,
    max: number
): number {
    if (value < min) return min;
    if (value > max) return min; // BUG
    return value;
}