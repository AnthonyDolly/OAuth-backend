import jwt, { SignOptions, Secret, Algorithm } from 'jsonwebtoken';
import config from './env';

export interface JwtPayloadBase {
  sub: string; // userId
  email: string;
  jti?: string;
}

export function signAccessToken(payload: JwtPayloadBase, jwtid?: string): string {
  const algorithm: Algorithm = config.jwt.algorithm;
  const options: SignOptions = {
    algorithm,
    expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    jwtid
  };
  const key: Secret = algorithm === 'RS256' ? (config.jwt.privateKey as Secret) : (config.jwt.secret as Secret);
  return jwt.sign(payload, key, options);
}

export function signRefreshToken(payload: object, jti: string): string {
  const algorithm: Algorithm = config.jwt.algorithm;
  const options: SignOptions = {
    algorithm,
    expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
    audience: config.jwt.audience,
    issuer: config.jwt.issuer,
    jwtid: jti,
  };
  const key: Secret = algorithm === 'RS256' ? (config.jwt.privateKey as Secret) : (config.jwt.refreshSecret as Secret);
  return jwt.sign(payload, key, options);
}

export function verifyAccessToken(token: string): JwtPayloadBase {
  const key: Secret = config.jwt.algorithm === 'RS256' ? (config.jwt.publicKey as Secret) : (config.jwt.secret as Secret);
  return jwt.verify(token, key, {
    algorithms: [config.jwt.algorithm],
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  }) as JwtPayloadBase;
}

export function verifyRefreshToken(token: string): JwtPayloadBase {
  const key: Secret = config.jwt.algorithm === 'RS256' ? (config.jwt.publicKey as Secret) : (config.jwt.refreshSecret as Secret);
  return jwt.verify(token, key, {
    algorithms: [config.jwt.algorithm],
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  }) as JwtPayloadBase;
}


