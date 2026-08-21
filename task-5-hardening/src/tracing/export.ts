import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Span, getSpansForRun } from "./span.js";

export interface TraceSummary {
  runId: string;
  totalSpans: number;
  totalDurationMs: number;
  totalTokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  totalCostUsd: number;
  completeness: number; // Fraction of non-root spans with valid existing parentId
  rootSpans: string[];
  spans: Span[];
}

export function computeTraceSummary(runId: string, spans: Span[]): TraceSummary {
  const spanIds = new Set(spans.map((s) => s.id));
  let nonRootCount = 0;
  let validParentCount = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let totalCost = 0;
  let totalDuration = 0;
  const rootSpans: string[] = [];

  for (const span of spans) {
    if (span.parentId === null) {
      rootSpans.push(span.id);
    } else {
      nonRootCount++;
      if (spanIds.has(span.parentId)) {
        validParentCount++;
      }
    }

    if (span.tokenCounts) {
      promptTokens += span.tokenCounts.prompt;
      completionTokens += span.tokenCounts.completion;
    }

    if (span.costEstimateUsd) {
      totalCost += span.costEstimateUsd;
    }

    if (span.durationMs && span.parentId === null) {
      totalDuration += span.durationMs;
    }
  }

  const completeness = nonRootCount === 0 ? 1.0 : validParentCount / nonRootCount;

  return {
    runId,
    totalSpans: spans.length,
    totalDurationMs: totalDuration,
    totalTokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: promptTokens + completionTokens,
    },
    totalCostUsd: Number(totalCost.toFixed(6)),
    completeness: Number(completeness.toFixed(4)),
    rootSpans,
    spans,
  };
}

/**
 * Flushes trace JSON file to disk.
 */
export async function flushTrace(runId: string, outputDir: string): Promise<TraceSummary> {
  const spans = getSpansForRun(runId);
  const summary = computeTraceSummary(runId, spans);

  await fs.mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `${runId}.json`);
  await fs.writeFile(filePath, JSON.stringify(summary, null, 2), "utf-8");

  return summary;
}
