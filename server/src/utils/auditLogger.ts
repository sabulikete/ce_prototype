/**
 * Audit Logger Utility
 *
 * Provides structured audit logging with automatic redaction of sensitive fields.
 * All invite resend attempts (success and failure) are logged for compliance.
 */

// Fields that should be redacted in logs
const SENSITIVE_FIELDS = new Set([
  'inviteUrl',
  'invite_url',
  'token',
  'inviteToken',
  'invite_token',
  'password',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
]);

// Patterns that indicate sensitive URL content
const SENSITIVE_URL_PATTERNS = [
  /\/accept-invite\?token=/i,
  /\/invite\//i,
  /token=[^&]+/i,
];

/**
 * Redact sensitive values from a log payload.
 * Returns a new object with sensitive fields masked.
 */
export const redactSensitiveFields = <T extends Record<string, unknown>>(
  payload: T
): T => {
  const redacted = { ...payload };

  for (const [key, value] of Object.entries(redacted)) {
    // Check if the key is a known sensitive field
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      (redacted as Record<string, unknown>)[key] = '[REDACTED]';
      continue;
    }

    // Check if the value looks like a sensitive URL
    if (typeof value === 'string') {
      const isSensitiveUrl = SENSITIVE_URL_PATTERNS.some((pattern) =>
        pattern.test(value)
      );
      if (isSensitiveUrl) {
        (redacted as Record<string, unknown>)[key] = '[REDACTED_URL]';
        continue;
      }
    }

    // Recursively redact nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      (redacted as Record<string, unknown>)[key] = redactSensitiveFields(
        value as Record<string, unknown>
      );
    }
  }

  return redacted;
};

interface AuditLogEntry {
  timestamp: string;
  event: string;
  scope: 'audit';
  success: boolean;
  [key: string]: unknown;
}

/**
 * Output a structured log entry to stdout.
 * All sensitive fields are automatically redacted.
 */
const outputAuditLog = (entry: Omit<AuditLogEntry, 'timestamp' | 'scope'>) => {
  const redactedEntry = redactSensitiveFields({
    timestamp: new Date().toISOString(),
    scope: 'audit' as const,
    ...entry,
  });
  console.log(JSON.stringify(redactedEntry));
};

/**
 * Log a successful invite resend attempt.
 */
export const logInviteResendSuccess = (fields: {
  actorId: number;
  inviteId: number;
  reminderCount: number;
  status: string;
  channels: string[];
}) => {
  outputAuditLog({
    event: 'invite.resend.success',
    success: true,
    ...fields,
  });
};

/**
 * Log a failed invite resend attempt with reason.
 */
export const logInviteResendFailure = (fields: {
  actorId: number;
  inviteId: number;
  reason: string;
  status?: string;
  reminderCount?: number;
}) => {
  outputAuditLog({
    event: 'invite.resend.failure',
    success: false,
    ...fields,
  });
};

/**
 * Log an invite revocation event.
 */
export const logInviteRevoke = (fields: {
  actorId: number;
  inviteId: number;
  reason?: string | null;
  status: string;
}) => {
  outputAuditLog({
    event: 'invite.revoke',
    success: true,
    ...fields,
  });
};

/**
 * Log a generic audit event with redaction.
 */
export const logAuditEvent = (
  event: string,
  success: boolean,
  fields: Record<string, unknown> = {}
) => {
  outputAuditLog({
    event,
    success,
    ...fields,
  });
};

/**
 * Emit a metric with automatic redaction of labels.
 */
export const emitMetric = (
  metric: string,
  value = 1,
  labels: Record<string, unknown> = {}
) => {
  const redactedLabels = redactSensitiveFields(labels);
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'metric',
      metric,
      value,
      ...redactedLabels,
    })
  );
};

export default {
  redactSensitiveFields,
  logInviteResendSuccess,
  logInviteResendFailure,
  logInviteRevoke,
  logAuditEvent,
  emitMetric,
};
