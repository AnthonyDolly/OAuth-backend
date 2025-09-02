import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './config/database';
import passport from './config/passport';
import { errorMiddleware } from './middleware/error.middleware';
import { generalRateLimiter } from './middleware/rateLimiter.middleware';
import logger, { morganStream } from './utils/logger.util';
import config from './config/env';
import router from './routes/index';
import { sanitizeBody } from './middleware/sanitize.middleware';
import { purgeOldAuditLogs } from './services/audit.service';
import { scheduleSessionCleanup } from './utils/session-cleanup.util';

const app = express();

// Base config
const PORT = config.server.port;
const API_VERSION = config.server.apiVersion;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeBody);
app.use(
  cors({
    origin: config.security.cors.origin,
    credentials: config.security.cors.credentials,
    methods: config.security.cors.methods as any,
    allowedHeaders: config.security.cors.allowedHeaders,
  })
);
app.use(helmet());
if (config.server.nodeEnv === 'production') {
  app.set('trust proxy', 1);
  app.use((req: Request, res: Response, next) => {
    if (req.secure) return next();
    return res.status(400).json({ success: false, message: 'HTTPS required' });
  });
}
app.use(morgan('combined', { stream: morganStream }));
if (config.features.rateLimiting) {
  app.use(generalRateLimiter);
}
app.use(passport.initialize());

// Docs placeholder
app.get('/api/docs', (_req: Request, res: Response) => {
  res.redirect('https://swagger.io');
});

// API routes
app.use(`/api/${API_VERSION}`, router);

// Schedule daily purge of audit logs based on retention setting
setInterval(() => {
  const days = config.audit.retentionDays;
  purgeOldAuditLogs(days).catch(() => {});
}, 24 * 60 * 60 * 1000);

// Start server
connectDatabase()
  .then(() => {
    // Schedule background tasks
    scheduleSessionCleanup(24); // Clean up sessions every 24 hours
    
    app.listen(PORT, () => {
      logger.info(
        `Server listening on http://localhost:${PORT} (API /api/${API_VERSION})`
      );
      logger.info('Background tasks scheduled: session cleanup (24h)');
    });
  })
  .catch((err) => {
    logger.error('Failed to start server', { err });
    process.exit(1);
  });

// Global error handler
app.use(errorMiddleware);

export default app;
