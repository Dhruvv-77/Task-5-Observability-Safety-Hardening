# DESIGN — agent-loop-mcp

## Architecture Overview

`agent-loop-mcp` is a lightweight, single-tool-per-turn autonomous code repair agent. The architecture decouples model decision-making from tool execution and safety enforcement.

```text
                  +--------------------------------+
                  |         Ollama LLM             |
                  |     qwen2.5:7b-instruct        |
                  +---------------+----------------+
                                  |
                        Single Tool Call (JSON)
                                  v
                  +---------------+----------------+
                  |         Agent Loop             |
                  |   Budget & Stuck-Loop Check    |
                  +---------------+----------------+
                                  |
          +-----------------------+-----------------------+
          |                       |                       |
          v                       v                       v
+------------------+    +-------------------+    +------------------+
|    MCP Server    |    |   Safety Gate     |    |   Approval Gate  |
|  5 Core Tools    |    |   (safety.ts)     |    |   (approval.ts)  |
+------------------+    +-------------------+    +------------------+
          |                       |                       |
          +-----------------------+-----------------------+
                                  |
                           Tool Execution
                                  v
                  +---------------+----------------+
                  |    JSONL Trajectory Logger     |
                  +--------------------------------+
```

---

## Component Interfaces & Contracts

### 1. Model Client (`packages/agent/src/model.ts`)
- Communicates with local Ollama (`http://127.0.0.1:11434`, default `qwen2.5:7b-instruct`).
- Requests exactly **one** JSON tool call per model turn.
- Validates returned tool name and arguments.

### 2. MCP Server & Tool Surface (`packages/agent/src/mcp/server.ts`)
Exposes 5 core tools over stdio JSON-RPC:
- `read_file({ path: string })`: Reads file contents inside corpus root.
- `list_dir({ path: string })`: Lists directory contents skipping `node_modules`.
- `grep({ pattern: string })`: Searches pattern inside corpus root skipping `node_modules`.
- `propose_edit({ file, before, after, reason })`: Validates edit snippet and creates diff preview. **Does NOT modify files directly.**
- `run_test({ testFile: string })`: Executes Vitest test suite in corpus.

### 3. Central Safety & Path Protection (`packages/agent/src/safety.ts`)
- `safePath(rootDir, relativePath)`: Ensures target path remains strictly inside the benchmark corpus root. Rejects path traversal (`../`, `../../`), `node_modules`, and `evals`.
- `validateEditTarget(rootDir, patch)`: Ensures target file exists and contains the exact `before` snippet. Throws `SafetyError` on failure.

### 4. Non-LLM Approval & Edit Application (`packages/agent/src/approval.ts` & `applyEdit.ts`)
- Safety check executes **before** any approval prompt or auto-approval (`AUTO_APPROVE=1`).
- `applyEdit(patch)` performs the actual disk replacement after safety & approval validation pass.

### 5. Loop, State & Halting Logic (`packages/agent/src/loop.ts`)
Monitors agent iterations and enforces explicit halting conditions:
- `test_passed`: Target test execution succeeds.
- `step_budget_exhausted`: Step count exceeds `MAX_STEPS` (12).
- `wall_clock_exhausted`: Duration exceeds `WALL_CLOCK_MS` (120,000 ms).
- `stuck_loop`: Model issues identical tool call + arguments 3 times consecutively.
- `approval_gate_violation`: Safety gate detects invalid path or missing target snippet.
- `unfixable_reported`: Model identifies environment problem outside tool surface.

---

## Deliberate Non-Goals
- No heavy agent frameworks (LangGraph, AutoGen, CrewAI).
- No arbitrary shell access or execution tools.
- No direct file modification inside `propose_edit`.
