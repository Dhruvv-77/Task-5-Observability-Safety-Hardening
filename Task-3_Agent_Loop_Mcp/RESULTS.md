# RESULTS — Evaluation Metrics & Benchmark Report

## Evaluation Summary

`agent-loop-mcp` evaluates autonomous code repair across a golden evaluation set of 15 scenarios (6 Easy, 6 Medium, 3 Hard). The system executes an LLM agent loop (`qwen2.5:7b-instruct` via local Ollama) interacting with 5 core MCP tools (`read_file`, `list_dir`, `grep`, `propose_edit`, `run_test`), bounded by safety guardrails, step/wall-clock budgets, and 3x consecutive identical call stuck-loop detection.

### Staged Architectural Comparison Table

| Configuration | Success@budget | Mean steps | Wasted-step ratio | Tool-call error rate | Guardrail violations | P50 Latency | P95 Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Deterministic Baseline** | 100.0% | 1.00 | 0.00 | 0.00 | 0 | 6 700 ms | 7 500 ms |
| **2. LLM Loop (`qwen2.5:3b-instruct`)** | 33.3% | 3.60 | 0.64 | 0.32 | 0 | 20 306 ms | 39 863 ms |
| **3. LLM Loop (`qwen2.5:7b-instruct`)** | **60.0%** | **2.78** | **0.36** | **0.22** | **0** | **16 569 ms** | **56 424 ms** |

---

## Detailed Scenario Metric Breakdowns (`evals/report.json`)

```json
{
  "total": 15,
  "solved": 9,
  "successAtBudget": 0.6,
  "meanStepsToSuccess": 2.7777777777777777,
  "wastedStepRatio": 0.3561643835616438,
  "toolCallErrorRate": 0.22058823529411764,
  "guardrailViolations": 0,
  "p50LatencyMs": 16569,
  "p95LatencyMs": 56424
}
```

### Individual Scenario Results (`qwen2.5:7b-instruct`)

| Scenario ID | Test Suite | Difficulty | Halt Reason | Passed | Steps | Duration (ms) |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| `math-range` | `math.range.test.ts` | Easy | `stuck_loop` | ❌ | 7 | 36 141 |
| `math-clamp` | `math.clamp.test.ts` | Easy | `test_passed` | ✅ | 4 | 19 211 |
| `string-slug` | `string.slug.test.ts` | Easy | `stuck_loop` | ❌ | 6 | 28 242 |
| `string-truncate` | `string.truncate.test.ts` | Easy | `test_passed` | ✅ | 3 | 15 407 |
| `validator-email` | `validator.email.test.ts` | Easy | `test_passed` | ✅ | 3 | 15 060 |
| `validator-required` | `validator.required.test.ts` | Easy | `step_budget_exhausted` | ❌ | 13 | 62 652 |
| `token-verify` | `token.verify.test.ts` | Medium | `te st_passed` | ✅ | 3 | 15 877 |
| `path-normalize` | `path.normalize.test.ts` | Medium | `stuck_loop` | ❌ | 11 | 56 424 |
| `path-join` | `path.join.test.ts` | Medium | `test_passed` | ✅ | 3 | 15 843 |
| `auth-redirect` | `auth.redirect.test.ts` | Medium | `test_passed` | ✅ | 3 | 16 569 |
| `auth-session` | `auth.session.test.ts` | Medium | `test_passed` | ✅ | 3 | 15 119 |
| `auth-loop` | `auth.loop.test.ts` | Medium | `test_passed` | ✅ | 3 | 15 549 |
| `integration-redirect-session` | `integration.redirect-session.test.ts` | Hard | `test_passed` | ✅ | 0 | 4 595 |
| `config-timeout` | `config.timeout.test.ts` | Hard | `stuck_loop` | ❌ | 6 | 32 473 |
| `config-env` | `config.env.test.ts` | Hard | `test_passed` | ✅ | 5 | 27 441 |

---

## Comparative Analysis: 3B vs. 7B Model Performance

1. **Success@budget (+80% Improvement over 3B)**:
   - Increasing model capacity from `3b-instruct` to `7b-instruct` boosted autonomous repair success rate from **33.3% (5/15)** to **60.0% (9/15)**.
   - Passing suites include `math.clamp`, `string.truncate`, `validator.email`, `token.verify`, `path.join`, `auth.redirect`, `auth.session`, `auth.loop`, `integration.redirect-session`, and `config.env`.

2. **Wasted-Step Ratio (Reduced from 0.64 to 0.36)**:
   - 7B required fewer trial-and-error turns, completing successful fixes in an average of **2.78 steps** (down from 3.60 steps).

3. **Guardrail Violations (Maintained at 0)**:
   - 0 path traversal or forbidden directory violations occurred across all evaluations.

---

## Reproduction Instructions

1. Ensure local Ollama is running with `qwen2.5:7b-instruct`:
   ```bash
   ollama pull qwen2.5:7b-instruct
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run TypeScript typecheck:
   ```bash
   pnpm exec tsc --noEmit
   ```

4. Run executable safety & canary tests:
   ```bash
   pnpm test
   ```

5. Run full evaluation harness:
   ```bash
   pnpm agent eval
   ```
