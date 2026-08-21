import fs from "node:fs/promises";
import path from "node:path";
import { TRAJECTORY_DIR } from "./config.js";

let currentLog = path.join(TRAJECTORY_DIR, "run.jsonl");

export function setTrajectoryFile(test: string): void {
    currentLog = path.join(TRAJECTORY_DIR, `${test}.jsonl`);
}

export async function clearLog(): Promise<void> {
    await fs.mkdir(TRAJECTORY_DIR, { recursive: true });
    await fs.writeFile(currentLog, "");
}

export async function log(entry: Record<string, unknown>): Promise<void> {
    await fs.mkdir(TRAJECTORY_DIR, { recursive: true });


    await fs.appendFile(
        currentLog,
        JSON.stringify({
            timestamp: new Date().toISOString(),
            ...entry,
        }) + "\n"
    );


}

export function getCurrentLogPath(): string {
    return currentLog;
}
