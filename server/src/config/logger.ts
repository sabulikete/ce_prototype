/**
 * Logger Configuration
 *
 * Configures logging, metrics emission, and alert thresholds for observability.
 * Integrates with the audit logger for invite resend monitoring.
 */

// ────────────────────────────────────────────────────────────────────────────────
// Log Configuration
// ────────────────────────────────────────────────────────────────────────────────

export const logConfig = {
  /** Log level: 'debug' | 'info' | 'warn' | 'error' */
  level: process.env.LOG_LEVEL ?? 'info',

  /** Output format: 'json' (structured) | 'pretty' (human-readable) */
  format: process.env.LOG_FORMAT ?? 'json',

  /** Enable log redaction for sensitive fields */
  redactionEnabled: process.env.LOG_REDACTION_ENABLED !== 'false',
};

// ────────────────────────────────────────────────────────────────────────────────
// Metrics Configuration
// ────────────────────────────────────────────────────────────────────────────────

export const metricsConfig = {
  /** Enable metrics emission */
  enabled: process.env.METRICS_ENABLED !== 'false',

  /** Metrics prefix for namespacing */
  prefix: process.env.METRICS_PREFIX ?? 'ce_app',

  /** Metrics endpoint for scraping (if using Prometheus) */
  endpoint: process.env.METRICS_ENDPOINT ?? '/metrics',
};

// ────────────────────────────────────────────────────────────────────────────────
// Alert Thresholds
// ────────────────────────────────────────────────────────────────────────────────

export const alertThresholds = {
  /**
   * Invite Resend Alerts
   */
  inviteResend: {
    /** Alert if failed resend attempts exceed this count per hour */
    failedPerHourThreshold: Number(process.env.ALERT_RESEND_FAILED_PER_HOUR ?? 50),

    /** Alert if a single admin exceeds this many resends per hour */
    perAdminPerHourThreshold: Number(process.env.ALERT_RESEND_PER_ADMIN_PER_HOUR ?? 20),

    /** Alert if resend latency p95 exceeds this (ms) */
    latencyP95Threshold: Number(process.env.ALERT_RESEND_LATENCY_P95 ?? 3000),
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// Monitored Metrics Registry
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Metric definitions for invite resend monitoring.
 * Used by observability pipelines to configure dashboards and alerts.
 */
export const inviteResendMetrics = {
  /**
   * Counter: Total successful invite resends
   * Labels: status (PENDING, etc.)
   */
  resendTotal: {
    name: 'invite_resend_total',
    type: 'counter' as const,
    description: 'Total number of successful invite resend operations',
    labels: ['status'],
  },

  /**
   * Counter: Failed/blocked invite resend attempts
   * Labels: status, reason
   */
  resendFailed: {
    name: 'invite_resend_failed',
    type: 'counter' as const,
    description: 'Total number of blocked invite resend attempts',
    labels: ['status', 'reason'],
  },

  /**
   * Histogram: Resend operation latency
   * Buckets: 100ms, 500ms, 1s, 2s, 3s, 5s
   */
  resendLatency: {
    name: 'invite_resend_duration_ms',
    type: 'histogram' as const,
    description: 'Latency of invite resend operations in milliseconds',
    buckets: [100, 500, 1000, 2000, 3000, 5000],
  },

  /**
   * Gauge: Current pending invites approaching reminder cap
   * For proactive alerting
   */
  nearCapCount: {
    name: 'invite_near_cap_total',
    type: 'gauge' as const,
    description: 'Number of pending invites with reminder_count = cap - 1',
    labels: [],
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// Log Redaction Validation
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Patterns that should NEVER appear in logs.
 * Used for automated redaction validation in CI/CD.
 */
export const sensitivePatterns = [
  // Invite URLs with tokens
  /\/accept-invite\?token=[A-Za-z0-9_-]+/,
  /inviteUrl["']?\s*[:=]\s*["'][^"']*token/i,

  // Raw tokens
  /["']token["']\s*[:=]\s*["'][A-Za-z0-9_-]{20,}/,

  // JWT patterns
  /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
];

/**
 * Validate that a log line does not contain sensitive data.
 * Returns true if the log is safe, false if it contains sensitive patterns.
 */
export const validateLogRedaction = (logLine: string): boolean => {
  return !sensitivePatterns.some((pattern) => pattern.test(logLine));
};

// ────────────────────────────────────────────────────────────────────────────────
// Alert Rule Definitions (for external alerting systems)
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Alert rules in a format compatible with common alerting systems.
 * Export these for Prometheus AlertManager, Datadog, etc.
 */
export const alertRules = [
  {
    name: 'InviteResendFailureSpike',
    expression: `increase(invite_resend_failed[5m]) > ${alertThresholds.inviteResend.failedPerHourThreshold / 12}`,
    severity: 'warning',
    summary: 'Elevated invite resend failures',
    description: 'More than expected invite resend attempts are being blocked. Check for user confusion or system issues.',
  },
  {
    name: 'InviteResendLatencyHigh',
    expression: `histogram_quantile(0.95, rate(invite_resend_duration_ms_bucket[5m])) > ${alertThresholds.inviteResend.latencyP95Threshold}`,
    severity: 'warning',
    summary: 'Invite resend latency exceeds SLA',
    description: 'p95 resend latency exceeds 3s SLA. Check database performance.',
  },
  {
    name: 'AdminResendAbuse',
    expression: `sum by (actorId) (rate(invite_resend_total[1h])) > ${alertThresholds.inviteResend.perAdminPerHourThreshold}`,
    severity: 'info',
    summary: 'High resend activity from single admin',
    description: 'An admin is sending an unusually high number of invite reminders.',
  },
];

export default {
  logConfig,
  metricsConfig,
  alertThresholds,
  inviteResendMetrics,
  sensitivePatterns,
  validateLogRedaction,
  alertRules,
};
