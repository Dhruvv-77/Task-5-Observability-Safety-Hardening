/**
 * Redaction logic for tracing inputs and outputs.
 * Sanitizes sensitive patterns (API keys, tokens, passwords, private secrets)
 * and records human-readable explanations of all applied redactions.
 */

export interface RedactionResult {
  sanitized: unknown;
  redactions: string[];
}

const SENSITIVE_PATTERNS: Array<{ regex: RegExp; placeholder: string; reason: string }> = [
  {
    regex: /bearer\s+[a-zA-Z0-9_\-\.]{15,}/gi,
    placeholder: "[REDACTED_BEARER_TOKEN]",
    reason: "Bearer authorization token detected and masked to prevent credential leakage in traces.",
  },
  {
    regex: /(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token)\s*[:=]\s*["']?([a-zA-Z0-9_\-\.]{10,})["']?/gi,
    placeholder: "apiKey=[REDACTED_SECRET_KEY]",
    reason: "API or Secret key value redacted to safeguard production credentials.",
  },
  {
    regex: /password\s*[:=]\s*["']?([^"'\s,;]+)["']?/gi,
    placeholder: "password=[REDACTED_PASSWORD]",
    reason: "Plaintext password field masked in trace payload.",
  },
  {
    regex: /AKIA[0-9A-Z]{16}/g,
    placeholder: "[REDACTED_AWS_ACCESS_KEY]",
    reason: "AWS Access Key ID detected and redacted.",
  },
  {
    regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC )?PRIVATE KEY-----/g,
    placeholder: "[REDACTED_PRIVATE_KEY_BLOCK]",
    reason: "Private cryptographic key block redacted.",
  },
];

export function redact(value: unknown): RedactionResult {
  const redactions: string[] = [];

  function sanitize(val: unknown): unknown {
    if (val === null || val === undefined) {
      return val;
    }

    if (typeof val === "string") {
      let str = val;
      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.regex.test(str)) {
          str = str.replace(pattern.regex, pattern.placeholder);
          if (!redactions.includes(pattern.reason)) {
            redactions.push(pattern.reason);
          }
        }
      }
      return str;
    }

    if (Array.isArray(val)) {
      return val.map((item) => sanitize(item));
    }

    if (typeof val === "object") {
      const sanitizedObj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        // Redact key-based credentials if named directly
        if (/^(?:password|secret|token|apiKey|api_key|auth_token|access_token)$/i.test(k) && typeof v === "string") {
          sanitizedObj[k] = "[REDACTED_SENSITIVE_FIELD]";
          const reason = `Field '${k}' explicitly redacted based on sensitive key classification.`;
          if (!redactions.includes(reason)) {
            redactions.push(reason);
          }
        } else {
          sanitizedObj[k] = sanitize(v);
        }
      }
      return sanitizedObj;
    }

    return val;
  }

  const sanitized = sanitize(value);
  return { sanitized, redactions };
}
