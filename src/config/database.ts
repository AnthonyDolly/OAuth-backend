import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.util';

const prisma = new PrismaClient({
  log: ['warn', 'error']
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.error('Database connection failed', { error });
    process.exit(1);
  }
}

export default prisma;


