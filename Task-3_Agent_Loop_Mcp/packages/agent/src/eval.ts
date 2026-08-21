import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { runLoop } from "./loop.js";
import {
    BROKEN_CORPUS,
    PRISTINE_CORPUS,
    TRAJECTORY_DIR,
    EVAL_REPORT,
    REPO_ROOT
} from "./config.js";

// ANSI Terminal Colors Utility
const colors = {
    bold: (t: string) => `\x1b[1m${t}\x1b[0m`,
    green: (t: string) => `\x1b[32m${t}\x1b[0m`,
    yellow: (t: string) => `\x1b[33m${t}\x1b[0m`,
    blue: (t: string) => `\x1b[34m${t}\x1b[0m`,
    cyan: (t: string) => `\x1b[36m${t}\x1b[0m`,
    red: (t: string) => `\x1b[31m${t}\x1b[0m`,
    gray: (t: string) => `\x1b[90m${t}\x1b[0m`,
    boldGreen: (t: string) => `\x1b[1m\x1b[32m${t}\x1b[0m`,
    boldRed: (t: string) => `\x1b[1m\x1b[31m${t}\x1b[0m`,
    boldBlue: (t: string) => `\x1b[1m\x1b[34m${t}\x1b[0m`,
    boldCyan: (t: string) => `\x1b[1m\x1b[36m${t}\x1b[0m`
};

export interface GoldenScenario {
    id: string;
    test: string;
    difficulty: "easy" | "medium" | "hard";
    expectedOutcome: "passed" | "unfixable";
}

const SCENARIOS: GoldenScenario[] = [
    { id: "math-range", test: "math.range.test.ts", difficulty: "easy", expectedOutcome: "passed" },
    { id: "math-clamp", test: "math.clamp.test.ts", difficulty: "easy", expectedOutcome: "passed" },
    { id: "string-slug", test: "string.slug.test.ts", difficulty: "easy", expectedOutcome: "passed" },
    { id: "string-truncate", test: "string.truncate.test.ts", difficulty: "easy", expectedOutcome: "passed" },
    { id: "validator-email", test: "validator.email.test.ts", difficulty: "easy", expectedOutcome: "passed" },
    { id: "validator-required", test: "validator.required.test.ts", difficulty: "easy", expectedOutcome: "passed" },

    { id: "token-verify", test: "token.verify.test.ts", difficulty: "medium", expectedOutcome: "passed" },
    { id: "path-normalize", test: "path.normalize.test.ts", difficulty: "medium", expectedOutcome: "passed" },
    { id: "path-join", test: "path.join.test.ts", difficulty: "medium", expectedOutcome: "passed" },
    { id: "auth-redirect", test: "auth.redirect.test.ts", difficulty: "medium", expectedOutcome: "passed" },
    { id: "auth-session", test: "auth.session.test.ts", difficulty: "medium", expectedOutcome: "passed" },
    { id: "auth-loop", test: "auth.loop.test.ts", difficulty: "medium", expectedOutcome: "passed" },

    { id: "integration-redirect-session", test: "integration.redirect-session.test.ts", difficulty: "hard", expectedOutcome: "passed" },
    { id: "config-timeout", test: "config.timeout.test.ts", difficulty: "hard", expectedOutcome: "passed" },
    { id: "config-env", test: "config.env.test.ts", difficulty: "hard", expectedOutcome: "unfixable" }
];

async function readTrajectory(test: string) {
    const file = path.join(TRAJECTORY_DIR, `${test}.jsonl`);

    try {
        const text = await fs.readFile(file, "utf8");
        const lines = text.trim().split("\n").filter(Boolean);

        let steps = 0;
        let toolCalls = 0;
        let filesRead = 0;
        let approvalRejections = 0;
        let wastedSteps = 0;
        let toolCallErrors = 0;
        let guardrailViolations = 0;

        const seenActions = new Set<string>();
        const seenFiles = new Set<string>();

        for (const line of lines) {
            const event = JSON.parse(line);

            if (event.step > 0) {
                steps = Math.max(steps, event.step);
            }

            if (
                event.action === "read_file" ||
                event.action === "list_dir" ||
                event.action === "grep" ||
                event.action === "propose_edit" ||
                event.action === "run_test"
            ) {
                toolCalls++;
            }

            if (event.action === "read_file") {
                if (seenFiles.has(event.file)) {
                    wastedSteps++;
                } else {
                    seenFiles.add(event.file);
                    filesRead++;
                }
            }

            if (event.action === "approval_rejected") approvalRejections++;
            if (event.action === "approval_gate_violation") guardrailViolations++;
            if (event.action === "tool_call_error") toolCallErrors++;

            const signature = `${event.action}:${JSON.stringify(event.file || event.path || event.pattern || "")}`;
            if (seenActions.has(signature) && event.action !== "run_test") {
                wastedSteps++;
            }
            seenActions.add(signature);
        }

        return {
            steps,
            toolCalls,
            filesRead,
            approvalRejections,
            wastedSteps,
            toolCallErrors,
            guardrailViolations
        };
    } catch {
        return {
            steps: 0,
            toolCalls: 0,
            filesRead: 0,
            approvalRejections: 0,
            wastedSteps: 0,
            toolCallErrors: 0,
            guardrailViolations: 0
        };
    }
}

async function evaluateOne(scenario: GoldenScenario) {
    const trajectoryFile = path.join(TRAJECTORY_DIR, `${scenario.test}.jsonl`);
    await fs.rm(trajectoryFile, { force: true });

    const start = Date.now();
    const finalState = await runLoop(scenario.test);
    const durationMs = Date.now() - start;

    let passed = false;
    if (scenario.expectedOutcome === "unfixable") {
        passed = finalState.haltReason === "unfixable_reported";
    } else {
        try {
            execSync(`pnpm exec vitest run tests/${scenario.test}`, {
                cwd: BROKEN_CORPUS,
                stdio: "ignore"
            });
            passed = true;
        } catch {
            passed = false;
        }
    }

    const metrics = await readTrajectory(scenario.test);

    return {
        id: scenario.id,
        test: scenario.test,
        difficulty: scenario.difficulty,
        expectedOutcome: scenario.expectedOutcome,
        passed,
        haltReason: finalState.haltReason,
        durationMs,
        steps: metrics.steps,
        toolCalls: metrics.toolCalls,
        filesRead: metrics.filesRead,
        approvalRejections: metrics.approvalRejections,
        wastedSteps: metrics.wastedSteps,
        toolCallErrors: metrics.toolCallErrors,
        guardrailViolations: metrics.guardrailViolations
    };
}

function percentile(values: number[], p: number) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor((p / 100) * (sorted.length - 1));
    return sorted[index];
}

async function main() {
    process.env.AUTO_APPROVE = "1";

    const results = [];

    for (const scenario of SCENARIOS) {
        console.log(`\n${colors.boldCyan("----------------------------------------------------------------")}`);
        console.log(`${colors.boldBlue("Running")} ${colors.bold(scenario.test)} ${colors.gray(`(${scenario.difficulty})`)}...`);
        console.log(`${colors.boldCyan("----------------------------------------------------------------")}\n`);
        results.push(await evaluateOne(scenario));
    }

    delete process.env.AUTO_APPROVE;

    const total = results.length;
    const solved = results.filter(r => r.passed).length;
    const successful = results.filter(r => r.passed);
    const durations = results.map(r => r.durationMs);

    const report = {
        total,
        solved,
        successAtBudget: solved / total,
        meanStepsToSuccess:
            successful.length === 0
                ? 0
                : successful.reduce((s, r) => s + r.steps, 0) / successful.length,
        wastedStepRatio:
            results.reduce((s, r) => s + r.wastedSteps, 0) /
            Math.max(1, results.reduce((s, r) => s + r.steps, 0)),
        toolCallErrorRate:
            results.reduce((s, r) => s + r.toolCallErrors, 0) /
            Math.max(1, results.reduce((s, r) => s + r.toolCalls, 0)),
        guardrailViolations: results.reduce((s, r) => s + r.guardrailViolations, 0),
        p50LatencyMs: percentile(durations, 50),
        p95LatencyMs: percentile(durations, 95),
        scenarios: results
    };

    await fs.mkdir(path.dirname(EVAL_REPORT), { recursive: true });
    await fs.writeFile(EVAL_REPORT, JSON.stringify(report, null, 2));

    console.log(`\n${colors.boldCyan("================================================================")}`);
    console.log(`${colors.boldCyan("                    EVALUATION SUMMARY                         ")}`);
    console.log(`${colors.boldCyan("================================================================")}`);
    console.log(`${colors.bold("Total Scenarios:")}      ${colors.cyan(String(report.total))}`);
    console.log(`${colors.bold("Solved / Correct:")}     ${colors.boldGreen(String(report.solved))}`);
    console.log(`${colors.bold("Success @ budget:")}     ${colors.boldGreen((report.successAtBudget * 100).toFixed(1) + "%")}`);
    console.log(`${colors.bold("Mean steps:")}           ${colors.yellow(report.meanStepsToSuccess.toFixed(2))}`);
    console.log(`${colors.bold("Wasted step ratio:")}    ${colors.yellow(report.wastedStepRatio.toFixed(2))}`);
    console.log(`${colors.bold("Tool call error rate:")} ${colors.yellow(report.toolCallErrorRate.toFixed(2))}`);
    console.log(`${colors.bold("Guardrail violations:")} ${report.guardrailViolations === 0 ? colors.green("0") : colors.boldRed(String(report.guardrailViolations))}`);
    console.log(`${colors.bold("P50 latency:")}          ${colors.gray(`${Math.round(report.p50LatencyMs)} ms`)}`);
    console.log(`${colors.bold("P95 latency:")}          ${colors.gray(`${Math.round(report.p95LatencyMs)} ms`)}`);
    console.log(`${colors.boldCyan("================================================================")}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
