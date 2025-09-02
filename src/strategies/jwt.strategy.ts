import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import passport from 'passport';
import config from '../config/env';
import prisma from '../config/database';
import redis from '../config/redis';

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: (config.jwt.algorithm === 'RS256' ? (config.jwt.publicKey as string) : (config.jwt.secret as string)),
  issuer: config.jwt.issuer,
  audience: config.jwt.audience,
  passReqToCallback: false
};

passport.use(
  'jwt',
  new JwtStrategy(opts as any, async (payload: any, done: any) => {
    try {
      // Optional: check Redis jti session if present
      if (payload.jti) {
        const session = await redis.get(`jwt:session:${payload.jti}`);
        if (!session) return done(null, false);
      }
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) return done(null, false);
      if (user.deleted_at || user.status !== 'active') return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  })
);

export default passport;


