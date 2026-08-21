# agent-loop-mcp

An autonomous single-tool-per-step code repair agent built with TypeScript, Vitest, MCP, and local Ollama (`qwen2.5:7b-instruct`).

The agent executes a loop: it runs a failing test, queries the LLM for a tool action (`read_file`, `list_dir`, `grep`, `propose_edit`, `run_test`), validates path safety, requests human/eval approval for edits, applies safe edits to disk, and re-runs tests until passing or halted by budget/stuck-loop limits.

---

## Quick Start

### 1. Prerequisites
- Node.js 20+
- pnpm 10+
- Local Ollama running with `qwen2.5:7b-instruct`:
  ```bash
  ollama pull qwen2.5:7b-instruct
  ```

### 2. Installation
```bash
pnpm install
```

### 3. Verification Commands

#### TypeScript Typecheck
```bash
pnpm exec tsc --noEmit
```

#### Run All Safety & Canary Test Suites
```bash
pnpm test
```

#### Individual Canary & Guardrail Tests
```bash
pnpm test:canary      # Verifies safety & approval gate violation handling
pnpm test:stuck       # Verifies 3x consecutive call stuck-loop detection
pnpm test:traversal   # Verifies path traversal & forbidden directory rejection
pnpm test:outside     # Verifies unfixable outside tool surface reporting
```

#### Run Full Unattended Evaluation Harness
```bash
pnpm agent eval
```

#### Run Single Interactive Fix
```bash
pnpm agent fix --test math.range.test.ts
```

#### Start MCP Stdio JSON-RPC Server
```bash
pnpm mcp
```

---

## Architecture & Safety Guardrails

- **LLM Agent Loop**: Driven by `qwen2.5:7b-instruct` (or `qwen2.5:3b-instruct` via `OLLAMA_MODEL` env var) via Ollama at `http://127.0.0.1:11434`. Requests exactly one tool call per turn.
- **5 MCP Tools**: `read_file`, `list_dir`, `grep`, `propose_edit`, `run_test`.
- **Path Safety**: `packages/agent/src/safety.ts` enforces strict boundary checks (blocks `../`, `node_modules`, `evals`).
- **Non-LLM Approval Gate**: `packages/agent/src/approval.ts` validates paths and exact `before` snippet presence before prompting (`y/n`) or auto-approving (`AUTO_APPROVE=1`).
- **Stuck-Loop Detection**: Halts execution if 3 consecutive identical tool calls + arguments are detected.
- **Explicit Halting Reasons**: `test_passed`, `step_budget_exhausted`, `wall_clock_exhausted`, `stuck_loop`, `approval_gate_violation`, `unfixable_reported`, `ollama_error`.

---

## Scenarios & Results

See [RESULTS.md](RESULTS.md) for full benchmark results across 15 golden scenarios (6 Easy, 6 Medium, 3 Hard).
See [DESIGN.md](DESIGN.md) for detailed architecture diagrams and component specs.
See [NOTES.md](NOTES.md) for developer findings and MCP rationale.
See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for full directory & file structure documentation.
