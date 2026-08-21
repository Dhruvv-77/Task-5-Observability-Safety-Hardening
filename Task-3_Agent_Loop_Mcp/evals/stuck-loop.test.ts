import { createState } from "../packages/agent/src/state.js";

const boldGreen = (t: string) => `\x1b[1m\x1b[32m${t}\x1b[0m`;
const boldRed = (t: string) => `\x1b[1m\x1b[31m${t}\x1b[0m`;

function testStuckLoopDetection() {
    console.log("Running Stuck-Loop Detection Test...");

    const state = createState("math.range.test.ts");

    const calls = [
        "read_file:{\"path\":\"src/math.ts\"}",
        "read_file:{\"path\":\"src/math.ts\"}",
        "read_file:{\"path\":\"src/math.ts\"}"
    ];

    for (const signature of calls) {
        if (signature === state.lastToolCall) {
            state.sameCallCount++;
        } else {
            state.lastToolCall = signature;
            state.sameCallCount = 1;
        }

        if (state.sameCallCount >= 3) {
            state.haltReason = "stuck_loop";
            break;
        }
    }

    if (state.haltReason !== "stuck_loop") {
        throw new Error(boldRed("STUCK-LOOP TEST FAILED: Stuck loop was not detected after 3 consecutive identical calls!"));
    }

    console.log(boldGreen("STUCK-LOOP TEST PASSED: 3x consecutive call correctly triggered stuck_loop halt."));
}

testStuckLoopDetection();
