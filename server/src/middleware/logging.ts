import { NextFunction, Request, Response } from 'express';
import { redactSensitiveFields } from '../utils/auditLogger';

interface LogEntry {
  event: string;
  scope?: string;
  [key: string]: unknown;
}

const output = (entry: LogEntry, redact = false) => {
  const payload = {
    timestamp: new Date().toISOString(),
    ...entry,
  };
  // Apply redaction if requested
  const finalPayload = redact ? redactSensitiveFields(payload) : payload;
  console.log(JSON.stringify(finalPayload));
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const started = Date.now();
  res.on('finish', () => {
    output({
      event: 'http.request',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - started,
      requestId: req.headers['x-request-id'] ?? 'unknown',
    });
  });
  next();
};

export const logAuditEvent = (event: string, fields: Record<string, unknown> = {}) => {
  output({ event, scope: 'audit', ...fields }, true); // Always redact audit events
};

export const emitMetric = (metric: string, value = 1, fields: Record<string, unknown> = {}) => {
  output({ event: 'metric', metric, value, ...fields }, true); // Always redact metrics
};
