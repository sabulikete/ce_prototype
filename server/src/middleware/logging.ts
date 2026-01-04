import { NextFunction, Request, Response } from 'express';

interface LogEntry {
  event: string;
  scope?: string;
  [key: string]: unknown;
}

const output = (entry: LogEntry) => {
  const payload = {
    timestamp: new Date().toISOString(),
    ...entry,
  };
  console.log(JSON.stringify(payload));
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
  output({ event, scope: 'audit', ...fields });
};

export const emitMetric = (metric: string, value = 1, fields: Record<string, unknown> = {}) => {
  output({ event: 'metric', metric, value, ...fields });
};
