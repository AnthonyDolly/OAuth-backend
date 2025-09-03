import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger.util';
import { recordAuditEvent } from '../services/audit.service';
import { getClientIP } from '../utils/user-agent.util';

export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';
  const details = err.details || undefined;

  if (status >= 500) {
    logger.error(message, { err });
  } else {
    logger.warn(message, { err });
  }

  // Basic audit log for errors
  try {
    const userId = (_req as any).user?.id ?? null;
    recordAuditEvent({
      userId,
      action: 'api_error',
      resource: _req.path,
      resourceId: null,
      details: { code, details },
      success: false,
      ipAddress: getClientIP(_req),
      userAgent: _req.headers['user-agent'] || null
    });
  } catch (_) { /* ignore audit errors */ }

  return res.status(status).json({
    success: false,
    message,
    error: { code, details },
    timestamp: new Date().toISOString()
  });
}


