import Redis from 'ioredis';
import config from './env';
import logger from '../utils/logger.util';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  keyPrefix: config.redis.keyPrefix
});

redis.on('connect', () => logger.info('Redis connecting...'));
redis.on('ready', () => logger.info('Redis ready'));
redis.on('error', (err) => logger.error('Redis error', { err }));
redis.on('end', () => logger.warn('Redis connection closed'));

export default redis;


