import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// packages/agent/src -> packages/agent -> packages -> repo root
export const REPO_ROOT = path.resolve(__dirname, "../../..");

// Corpus directories
export const CORPUS_ROOT = path.join(REPO_ROOT, "corpus");
export const BROKEN_CORPUS = path.join(
    CORPUS_ROOT,
    "mini-auth-utils-broken"
);
export const PRISTINE_CORPUS = path.join(
    CORPUS_ROOT,
    "mini-auth-utils-pristine"
);

// Keep ROOT for compatibility with the rest of the project
export const ROOT = BROKEN_CORPUS;

// Output locations
export const TRAJECTORY_DIR = path.join(
    REPO_ROOT,
    "packages",
    "agent",
    "trajectories"
);

export const EVAL_REPORT = path.join(
    REPO_ROOT,
    "evals",
    "report.json"
);

// Budgets
export const MAX_STEPS = Number(process.env.MAX_STEPS) || 12;
export const WALL_CLOCK_MS = Number(process.env.WALL_CLOCK_MS) || 120_000;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function resetCorpus() {
    for (let attempt = 1; attempt <= 10; attempt++) {
        try {
            await fs.rm(BROKEN_CORPUS, { recursive: true, force: true });
            break;
        } catch (err: any) {
            if ((err.code === "EBUSY" || err.code === "EPERM") && attempt < 10) {
                await sleep(500);
            } else {
                throw err;
            }
        }
    }

    await fs.cp(PRISTINE_CORPUS, BROKEN_CORPUS, {
        recursive: true,
        verbatimSymlinks: false,
        filter: (src) => path.basename(src) !== "node_modules"
    });

    execSync("pnpm install", { cwd: REPO_ROOT, stdio: "ignore" });
}

