import { runLoop } from "./loop.js";

const args = process.argv.slice(2);

if (args.length === 0) {
    console.error("Usage: pnpm agent <command> [options]");
    console.error("Supported commands:");
    console.error("  fix --test <test-file>");
    console.error("  eval");
    process.exit(1);
}

const command = args[0];

if (command === "eval") {
    await import("./eval.js");
} else if (command === "fix") {
    const testFlagIndex = args.indexOf("--test");

    if (testFlagIndex === -1 || !args[testFlagIndex + 1]) {
        console.error("Missing --test <test-file> argument.");
        process.exit(1);
    }

    const testFile = args[testFlagIndex + 1];

    await runLoop(testFile);
} else {
    console.error("Usage: pnpm agent <command> [options]");
    console.error("Supported commands:");
    console.error("  fix --test <test-file>");
    console.error("  eval");
    process.exit(1);
}

