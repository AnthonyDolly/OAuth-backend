import bcrypt from 'bcrypt';
import config from '../config/env';

export async function hashPassword(plain: string): Promise<string> {
  const saltRounds = config.security.bcryptRounds;
  return bcrypt.hash(plain, saltRounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashValue(plain: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(plain, saltRounds);
}

export async function verifyHash(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}


