import { TokenUsage, calculateCost } from "../tracing/span.js";

export interface BudgetConfig {
  maxCostUsd: number;
  maxWallClockMs: number;
}

export class BudgetBreachError extends Error {
  public readonly status = "budget_stopped";
  public readonly reason: "cost_budget_exhausted" | "wall_clock_timeout";
  public readonly costSoFar: number;
  public readonly elapsedMs: number;

  constructor(
    reason: "cost_budget_exhausted" | "wall_clock_timeout",
    costSoFar: number,
    elapsedMs: number,
    limit: number
  ) {
    const message =
      reason === "cost_budget_exhausted"
        ? `Cost budget breached: accumulated cost $${costSoFar.toFixed(6)} exceeded ceiling $${limit.toFixed(6)}.`
        : `Wall-clock timeout breached: elapsed time ${elapsedMs}ms exceeded ceiling ${limit}ms.`;
    super(message);
    this.name = "BudgetBreachError";
    this.reason = reason;
    this.costSoFar = costSoFar;
    this.elapsedMs = elapsedMs;
  }
}

export class CircuitBreaker {
  private startTimeMs: number;
  private accumulatedCostUsd: number = 0;
  private accumulatedTokens: number = 0;
  public readonly config: BudgetConfig;

  constructor(config: BudgetConfig) {
    this.config = config;
    this.startTimeMs = Date.now();
  }

  public reset() {
    this.startTimeMs = Date.now();
    this.accumulatedCostUsd = 0;
    this.accumulatedTokens = 0;
  }

  public recordUsage(tokens: TokenUsage, explicitCost?: number) {
    const cost = explicitCost !== undefined ? explicitCost : calculateCost(tokens);
    this.accumulatedCostUsd += cost;
    this.accumulatedTokens += tokens.total;
  }

  public getCostSoFar(): number {
    return Number(this.accumulatedCostUsd.toFixed(6));
  }

  public getElapsedMs(): number {
    return Date.now() - this.startTimeMs;
  }

  public checkBudget(): { breached: boolean; reason?: "cost_budget_exhausted" | "wall_clock_timeout"; message?: string } {
    const elapsed = this.getElapsedMs();
    if (elapsed >= this.config.maxWallClockMs) {
      return {
        breached: true,
        reason: "wall_clock_timeout",
        message: `Wall-clock budget exhausted (${elapsed}ms >= ${this.config.maxWallClockMs}ms)`,
      };
    }

    if (this.accumulatedCostUsd >= this.config.maxCostUsd) {
      return {
        breached: true,
        reason: "cost_budget_exhausted",
        message: `Cost budget exhausted ($${this.accumulatedCostUsd.toFixed(6)} >= $${this.config.maxCostUsd.toFixed(6)})`,
      };
    }

    return { breached: false };
  }

  public enforce() {
    const status = this.checkBudget();
    if (status.breached && status.reason) {
      const limit = status.reason === "cost_budget_exhausted" ? this.config.maxCostUsd : this.config.maxWallClockMs;
      throw new BudgetBreachError(
        status.reason,
        this.accumulatedCostUsd,
        this.getElapsedMs(),
        limit
      );
    }
  }
}
