import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import config from '../config/env';

const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const maxFiles = parseMaxFiles(config.logging.maxFiles);

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: config.logging.errorFile,
      level: 'error',
      maxsize: parseSize(config.logging.maxSize),
      maxFiles,
    }),
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: parseSize(config.logging.maxSize),
      maxFiles,
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} [${level}] ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        })
      ),
    })
  );
}

function parseSize(size: string): number | undefined {
  if (!size) return undefined;
  const m = /^([0-9]+)([kKmMgG]?)/.exec(size);
  if (!m) return undefined;
  const num = Number(m[1]);
  const unit = m[2].toLowerCase();
  switch (unit) {
    case 'k':
      return num * 1024;
    case 'm':
      return num * 1024 * 1024;
    case 'g':
      return num * 1024 * 1024 * 1024;
    default:
      return num;
  }
}

function parseMaxFiles(value: string): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default logger;

export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
