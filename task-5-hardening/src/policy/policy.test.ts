import { describe, it, expect } from "vitest";
import { PolicyEngine } from "./policy.js";

describe("Human-in-the-Loop Policy Engine", () => {
  it("classifies read-only tools as requiring no approval", () => {
    const decision = PolicyEngine.evaluate({ action: "readFile", target: "src/auth.ts" });
    expect(decision.category).toBe("read_only");
    expect(decision.requiresApproval).toBe(false);
  });

  it("classifies reversible writes within workspace bounds as auto-logged", () => {
    const decision = PolicyEngine.evaluate({ action: "proposeEdit", target: "src/auth.ts" });
    expect(decision.category).toBe("reversible_write");
    expect(decision.requiresApproval).toBe(false);
  });

  it("classifies irreversible actions as requiring explicit approval", () => {
    const decision = PolicyEngine.evaluate({ action: "apply_edit", target: "src/auth.ts" });
    expect(decision.category).toBe("irreversible_or_external");
    expect(decision.requiresApproval).toBe(true);
  });

  it("flags path traversal attempts as irreversible_or_external requiring approval", () => {
    const decision = PolicyEngine.evaluate({ action: "write_temp_file", target: "../../../etc/passwd" });
    expect(decision.category).toBe("irreversible_or_external");
    expect(decision.requiresApproval).toBe(true);
  });
});
