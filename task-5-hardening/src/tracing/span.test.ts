import { describe, it, expect, beforeEach } from "vitest";
import { withSpan, startRun, recordSpanTokenUsage, getSpansForRun, clearTraces } from "./span.js";
import { computeTraceSummary } from "./export.js";
import { redact } from "./redact.js";

describe("Tracing & Span Infrastructure", () => {
  beforeEach(() => {
    clearTraces();
  });

  it("creates root and child spans with correct parent-child relationship", async () => {
    const runId = "test-run-001";
    startRun(runId);

    await withSpan(
      "orchestrator.runTask",
      "orchestrator_run",
      { task: "Refactor auth" },
      async (orchSpan) => {
        // Child span 1: Planner
        await withSpan("planner.call", "planner_call", { prompt: "Plan steps" }, async (plannerSpan) => {
          recordSpanTokenUsage(plannerSpan, { prompt: 100, completion: 50 });
          return { step: 1 };
        });

        // Child span 2: Critic (Must be child of Orchestrator, not sibling)
        await withSpan("critic.review", "critic_review", { patch: "code" }, async (criticSpan) => {
          recordSpanTokenUsage(criticSpan, { prompt: 80, completion: 40 });
          return { verdict: "approve" };
        });

        recordSpanTokenUsage(orchSpan, { prompt: 180, completion: 90 });
      }
    );

    const spans = getSpansForRun(runId);
    expect(spans.length).toBe(3);

    const orch = spans.find((s) => s.type === "orchestrator_run")!;
    const planner = spans.find((s) => s.type === "planner_call")!;
    const critic = spans.find((s) => s.type === "critic_review")!;

    expect(orch.parentId).toBeNull();
    expect(planner.parentId).toBe(orch.id);
    expect(critic.parentId).toBe(orch.id);

    const summary = computeTraceSummary(runId, spans);
    expect(summary.completeness).toBe(1.0);
    expect(summary.totalTokens.total).toBe(540);
  });

  it("redacts bearer tokens and API keys and logs explanation", () => {
    const rawInput = {
      header: "Bearer secret_jwt_token_value_xyz12345",
      apiKey: "sk-live-super-secret-key-abcdef",
    };

    const { sanitized, redactions } = redact(rawInput);
    const sanitizedObj = sanitized as Record<string, unknown>;

    expect(sanitizedObj.header).toBe("[REDACTED_BEARER_TOKEN]");
    expect(sanitizedObj.apiKey).toBe("[REDACTED_SENSITIVE_FIELD]");
    expect(redactions.length).toBeGreaterThanOrEqual(2);
  });
});
