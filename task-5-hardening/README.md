# 🛡️ Task 5 Hardening Package (`task-5-hardening`)

> This package contains the core implementations, evaluation harness, and deliverables for **Task 5: Agent Observability, Safety Evals, and Cost Budgets**.

For the complete architecture overview, execution guides, and full evaluation results, please see the **[Master Repository README](../README.md)**.

---

## ⚡ Quick Package Commands

```bash
# 1. Run all 8 unit and integration tests (100% passing)
pnpm test

# 2. Run the 12-case adversarial prompt injection red team (48 eval passes)
pnpm redteam

# 3. Run the live Task 4 Orchestrator budget circuit breaker demo
pnpm breaker:demo          # Default task
pnpm breaker:demo well-1   # Task 4 Rate-Limiting task
pnpm breaker:demo well-5   # Task 4 Grep Sanitization task

# 4. Launch the Flame-Graph Trace Visualizer
pnpm viewer
# Or open viewer/index.html in your browser
```

---

## 📚 Deliverable Files in this Package

* 📐 **[DESIGN.md](./DESIGN.md)** — System architecture, span schema, failure modes, and non-goals.
* 📈 **[RESULTS.md](./RESULTS.md)** — Complete comparative results matrix and mitigation analysis.
* 🔒 **[SECURITY.md](./SECURITY.md)** — All 12 adversarial test cases verbatim with root-cause analysis.
* 📝 **[NOTES.md](./NOTES.md)** — Synthetic token pricing schedule ($0.002 / $0.006) and reproducibility guide.
* 🌐 **[Flame-Graph Trace Viewer](./viewer/index.html)** — Interactive HTML trace visualizer.
* 📁 **[`evals/injection-redteam.jsonl`](./evals/injection-redteam.jsonl)** — 12-case prompt injection dataset.
* 📁 **[`traces/`](./traces/)** — Exported execution trace trees (48 JSON files).
