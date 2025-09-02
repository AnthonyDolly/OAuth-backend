import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import prisma from '../config/database';
import { verifyPassword } from '../utils/encryption.util';

passport.use(
  'local',
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', session: false },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password_hash)
          return done(null, false, { message: 'Invalid credentials' });
        const valid = await verifyPassword(password, user.password_hash);
        if (!valid)
          return done(null, false, { message: 'Invalid credentials' });
        if (user.status !== 'active')
          return done(null, false, { message: 'User not active' });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

export default passport;
