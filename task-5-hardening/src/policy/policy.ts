/**
 * Formal Human-in-the-Loop (HITL) Action Policy.
 * Unified policy classification and enforcement across Task 3 & Task 4.
 */

export type ActionCategory = "read_only" | "reversible_write" | "irreversible_or_external";

export interface PolicyDecision {
  category: ActionCategory;
  requiresApproval: boolean;
  action: string;
  reason: string;
}

export interface ActionRequest {
  action: string;
  target?: string;
  params?: Record<string, unknown>;
}

export class PolicyEngine {
  private static readonly READ_ONLY_ACTIONS = new Set([
    "read_file",
    "readFile",
    "list_dir",
    "listDir",
    "grep",
    "run_test",
    "runTest",
    "readRepoSnapshot",
    "getPlannerContext",
    "getExecutorContext",
    "getCriticContext",
  ]);

  private static readonly REVERSIBLE_WRITE_ACTIONS = new Set([
    "propose_edit",
    "proposeEdit",
    "write_temp_file",
    "stage_patch",
    "generate_plan",
    "generate_patch",
  ]);

  private static readonly IRREVERSIBLE_ACTIONS = new Set([
    "apply_edit",
    "applyEdit",
    "delete_file",
    "deleteFile",
    "shell_exec",
    "network_request",
    "publish_release",
    "escalate_privilege",
  ]);

  /**
   * Classifies an action and determines whether it requires explicit human approval.
   */
  public static evaluate(request: ActionRequest): PolicyDecision {
    const action = request.action;

    // Check if target is outside safe workspace bounds or dangerous
    if (request.target) {
      const isPathTraversal = request.target.includes("..") || request.target.startsWith("/") || /^[A-Za-z]:[\\\/]Windows/i.test(request.target);
      if (isPathTraversal && !this.READ_ONLY_ACTIONS.has(action)) {
        return {
          category: "irreversible_or_external",
          requiresApproval: true,
          action,
          reason: `Target path '${request.target}' is outside safe workspace boundaries. Requires explicit approval.`,
        };
      }
    }

    if (this.READ_ONLY_ACTIONS.has(action)) {
      return {
        category: "read_only",
        requiresApproval: false,
        action,
        reason: "Read-only operations are non-destructive and auto-permitted for trace logging.",
      };
    }

    if (this.REVERSIBLE_WRITE_ACTIONS.has(action)) {
      return {
        category: "reversible_write",
        requiresApproval: false,
        action,
        reason: "Reversible write actions within workspace boundaries are auto-logged and applied within policy limits.",
      };
    }

    if (this.IRREVERSIBLE_ACTIONS.has(action)) {
      return {
        category: "irreversible_or_external",
        requiresApproval: true,
        action,
        reason: "Irreversible modification or external system effect requires explicit human approval.",
      };
    }

    // Default conservative fallback: unknown actions default to requiring approval
    return {
      category: "irreversible_or_external",
      requiresApproval: true,
      action,
      reason: `Unknown action '${action}' defaulted to irreversible_or_external tier for safety.`,
    };
  }
}
