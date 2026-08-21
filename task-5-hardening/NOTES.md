# Agent Observability, Safety Evals, and Cost Budgets
## Engineering Notes & Operational Runbook (`NOTES.md`)

**Package:** `task-5-hardening`

---

## 1. Synthetic Token Pricing Model

Because the local agent runtime uses Ollama (`qwen2.5:7b-instruct`), direct inference has zero financial cost. To simulate real-world production budget enforcement, we define a synthetic per-token pricing schedule configured in `src/tracing/span.ts`:

- **Prompt / Input Tokens:** `$0.002 per 1,000 tokens` ($2.00 / 1M tokens)
- **Completion / Output Tokens:** `$0.006 per 1,000 tokens` ($6.00 / 1M tokens)

### Cost Computation Formula
$$\text{Cost}_{\text{USD}} = \left(\frac{\text{Prompt Tokens}}{1000} \times 0.002\right) + \left(\frac{\text{Completion Tokens}}{1000} \times 0.006\right)$$

This rate matches standard industry foundation models, making cost numbers in traces, the flame-graph viewer, and the circuit breaker directly representative of cloud API deployments.

---

## 2. Redaction Policy Details

Traces are audited artifacts that may be inspected by reviewers or stored in monitoring backends. To prevent credential leakage:
1. **Bearer Tokens:** Any `Bearer <token>` string (15+ chars) is masked as `[REDACTED_BEARER_TOKEN]`.
2. **API / Secret Keys:** Field names or assignments matching `api_key`, `secret_key`, `auth_token`, `access_token`, or `AKIA...` are masked as `apiKey=[REDACTED_SECRET_KEY]` or `[REDACTED_AWS_ACCESS_KEY]`.
3. **Private Keys:** RSA/EC private key blocks are masked as `[REDACTED_PRIVATE_KEY_BLOCK]`.
4. **Audit Transparency:** Every redaction records an entry in the span's `redactions: string[]` list detailing *what* pattern was matched and *why* it was masked.

---

## 3. Review-Gate Verification Walkthrough

The following four steps are verified by hand before merging:

### Gate 1: Trace Viewer & Locating Most Token-Expensive Step
1. Start the viewer:
   ```bash
   cd task-5-hardening
   npx serve -s viewer
   ```
2. Open the browser to `http://localhost:3000` (or open `viewer/trace-viewer.html` directly).
3. Click **"Load Trace JSON"** and select any trace from `traces/` (e.g. `t4-eval-case-07-plausible-mitigated.json`), or click **"⚡ Load Sample Task 4 Trace"**.
4. The top highlight banner immediately displays the **"🔥 Most Expensive Step"** with token count and cost. Clicking **"Locate Step"** scrolls directly to and inspects the span in the flame-graph tree.

### Gate 2: Live Blunt & Plausible Injection Demos
Run the automated red-team eval suite to verify both blunt and plausible injection resilience:
```bash
npm run redteam
```
- **Blunt Case (`case-01-blunt`):** Quarantined inside `<untrusted_data>`, secret exfiltration ignored.
- **Plausible Case (`case-07-plausible`):** Critic ignores fake SecOps ticket #4920 annotation and enforces genuine quality validation.

### Gate 3: Live Cost Circuit Breaker Trigger
Run the circuit breaker unit tests or the live Task 4 Orchestrator budget watchdog demo:
```bash
# Automated verification
npx vitest run src/budget/circuitBreaker.test.ts

# Live interactive Task 4 Orchestrator pipeline demo
pnpm breaker:demo          # Default task
pnpm breaker:demo well-1   # Task 4 Rate-Limiting task
pnpm breaker:demo well-5   # Task 4 Grep Sanitization task
```
Confirms that breaching `maxCostUsd` ($0.0025) or `maxWallClockMs` halts immediately with status `budget_stopped` and logs:
`Cost budget breached: accumulated cost $0.002720 exceeded ceiling $0.002500.`

### Gate 4: Fresh-Clone Reproducibility
From a fresh clone:
```bash
cd task-5-hardening
pnpm install
pnpm test
pnpm redteam
```
All unit tests pass and all 48 traces re-generate deterministically into `traces/`.
