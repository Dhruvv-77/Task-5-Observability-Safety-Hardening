export type HaltReason =
    | "test_passed"
    | "step_budget_exhausted"
    | "wall_clock_exhausted"
    | "stuck_loop"
    | "approval_gate_violation"
    | "ollama_error"
    | "unfixable_reported";

export interface AgentState {
    testFile: string;
    step: number;
    startedAt: number;
    filesRead: string[];
    transcript: { role: string; content: string }[];
    lastToolCall: string | null;
    sameCallCount: number;
    solved: boolean;
    haltReason: HaltReason | null;
}

export function createState(testFile: string): AgentState {
    return {
        testFile,
        step: 0,
        startedAt: Date.now(),
        filesRead: [],
        transcript: [],
        lastToolCall: null,
        sameCallCount: 0,
        solved: false,
        haltReason: null
    };
}

export function hasReadFile(state: AgentState, file: string): boolean {
    return state.filesRead.includes(file);
}

export function markFileRead(state: AgentState, file: string): void {
    if (!hasReadFile(state, file)) {
        state.filesRead.push(file);
    }
}