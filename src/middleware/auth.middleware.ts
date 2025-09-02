import passport from 'passport';

export const ensureAuth = passport.authenticate('jwt', { session: false });

export function ensureAdmin(req: any, res: any, next: any) {
  const user = req.user as any;
  if (!user || !user.is_admin) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
}


