import { describe, it, expect } from "vitest";
import { CircuitBreaker, BudgetBreachError } from "./circuitBreaker.js";

describe("Budget Circuit Breakers", () => {
  it("enforces cost budget ceiling cleanly and logs reason", () => {
    const breaker = new CircuitBreaker({
      maxCostUsd: 0.005,
      maxWallClockMs: 60000,
    });

    // 1000 prompt tokens + 1000 completion tokens = $0.002 + $0.006 = $0.008 > $0.005
    breaker.recordUsage({ prompt: 1000, completion: 1000, total: 2000 });

    const status = breaker.checkBudget();
    expect(status.breached).toBe(true);
    expect(status.reason).toBe("cost_budget_exhausted");

    expect(() => breaker.enforce()).toThrowError(BudgetBreachError);
  });

  it("enforces wall-clock timeout ceiling cleanly", async () => {
    const breaker = new CircuitBreaker({
      maxCostUsd: 10.0,
      maxWallClockMs: 50, // 50ms timeout
    });

    await new Promise((resolve) => setTimeout(resolve, 60));

    const status = breaker.checkBudget();
    expect(status.breached).toBe(true);
    expect(status.reason).toBe("wall_clock_timeout");

    expect(() => breaker.enforce()).toThrowError(BudgetBreachError);
  });
});
