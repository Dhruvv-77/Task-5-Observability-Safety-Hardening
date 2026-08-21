import { AsyncLocalStorage } from "node:async_hooks";
import * as crypto from "node:crypto";
import { redact } from "./redact.js";

export type SpanType =
  | "orchestrator_run"
  | "agent_step"
  | "planner_call"
  | "executor_call"
  | "critic_review"
  | "llm_call"
  | "tool_call";

export type SpanStatus = "ok" | "error" | "budget_stopped";

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface Span {
  id: string;
  parentId: string | null;
  runId: string;
  type: SpanType;
  name: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  input?: unknown;
  output?: unknown;
  tokenCounts?: TokenUsage;
  costEstimateUsd?: number;
  status: SpanStatus;
  error?: string;
  redactions?: string[];
}

export interface TraceStore {
  runId: string;
  spans: Span[];
}

// Synthetic pricing for cost computation (default standard rate: $2/1M input, $6/1M output)
export const COST_PER_1K_INPUT_TOKENS = 0.002;
export const COST_PER_1K_OUTPUT_TOKENS = 0.006;

export function calculateCost(tokens: TokenUsage): number {
  const inputCost = (tokens.prompt / 1000) * COST_PER_1K_INPUT_TOKENS;
  const outputCost = (tokens.completion / 1000) * COST_PER_1K_OUTPUT_TOKENS;
  return Number((inputCost + outputCost).toFixed(6));
}

interface SpanContext {
  runId: string;
  parentId: string | null;
  activeSpanId?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<SpanContext>();
const activeTraces = new Map<string, Span[]>();
let currentActiveRunId: string | null = null;

/**
 * Initializes a new trace execution run.
 */
export function startRun(runId?: string): string {
  const id = runId || `run-${crypto.randomUUID().slice(0, 8)}`;
  if (!activeTraces.has(id)) {
    activeTraces.set(id, []);
  }
  currentActiveRunId = id;
  return id;
}

/**
 * Executes a function within the context of a given run.
 */
export function runInTraceContext<T>(runId: string, fn: () => T): T {
  startRun(runId);
  return asyncLocalStorage.run({ runId, parentId: null }, fn);
}

/**
 * Wraps an asynchronous operation with an execution span.
 * Automatically nests spans hierarchically using AsyncLocalStorage.
 */
export async function withSpan<T>(
  name: string,
  type: SpanType,
  input: unknown,
  fn: (span: Span) => Promise<T>,
  overrideRunId?: string
): Promise<T> {
  const parentStore = asyncLocalStorage.getStore();
  const runId = overrideRunId || parentStore?.runId || currentActiveRunId || startRun();
  const parentId = parentStore?.activeSpanId ?? parentStore?.parentId ?? null;

  const { sanitized: sanitizedInput, redactions: inputRedactions } = redact(input);

  const span: Span = {
    id: `span-${crypto.randomUUID().slice(0, 8)}`,
    parentId,
    runId,
    type,
    name,
    startTime: new Date().toISOString(),
    input: sanitizedInput,
    status: "ok",
    redactions: inputRedactions.length > 0 ? [...inputRedactions] : undefined,
  };

  const spans = activeTraces.get(runId) || [];
  spans.push(span);
  activeTraces.set(runId, spans);

  const nextContext: SpanContext = {
    runId,
    parentId: span.id,
    activeSpanId: span.id,
  };

  const startMs = Date.now();

  return asyncLocalStorage.run(nextContext, async () => {
    try {
      const result = await fn(span);
      const endMs = Date.now();
      span.endTime = new Date().toISOString();
      span.durationMs = endMs - startMs;

      const { sanitized: sanitizedOutput, redactions: outputRedactions } = redact(result);
      span.output = sanitizedOutput;

      if (outputRedactions.length > 0) {
        span.redactions = span.redactions
          ? Array.from(new Set([...span.redactions, ...outputRedactions]))
          : outputRedactions;
      }

      return result;
    } catch (err: any) {
      const endMs = Date.now();
      span.endTime = new Date().toISOString();
      span.durationMs = endMs - startMs;
      span.status = err?.status === "budget_stopped" ? "budget_stopped" : "error";
      span.error = err?.message || String(err);
      throw err;
    }
  });
}

/**
 * Attaches token usage and computes cost for the active span or a target span.
 */
export function recordSpanTokenUsage(
  span: Span,
  tokenCounts: { prompt?: number; completion?: number; total?: number; inputTokens?: number; outputTokens?: number; totalTokens?: number }
) {
  const prompt = tokenCounts.prompt ?? tokenCounts.inputTokens ?? 0;
  const completion = tokenCounts.completion ?? tokenCounts.outputTokens ?? 0;
  const total = tokenCounts.total ?? tokenCounts.totalTokens ?? prompt + completion;

  const usage: TokenUsage = { prompt, completion, total };
  span.tokenCounts = usage;
  span.costEstimateUsd = calculateCost(usage);
}

/**
 * Retrieves all collected spans for a given runId.
 */
export function getSpansForRun(runId: string): Span[] {
  return activeTraces.get(runId) || [];
}

/**
 * Clears in-memory trace storage.
 */
export function clearTraces(runId?: string) {
  if (runId) {
    activeTraces.delete(runId);
  } else {
    activeTraces.clear();
  }
}
