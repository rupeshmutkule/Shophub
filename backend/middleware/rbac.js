import User from '../models/User.js';

function getAuthUser(req) {
  // Prefer JWT user when present, fallback to session (legacy)
  if (req.user && req.user.id) return { id: req.user.id, userType: req.user.userType };
  if (req.session?.user?.id) return { id: req.session.user.id, userType: req.session.user.userType };
  return null;
}

export function requireUserTypes(allowedUserTypes) {
  return (req, res, next) => {
    const authUser = getAuthUser(req);
    if (!authUser) return res.status(401).json({ error: 'Authentication required' });
    if (!allowedUserTypes.includes(authUser.userType)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    req.authUser = authUser;
    next();
  };
}

export async function rejectBannedUsers(req, res, next) {
  const authUser = getAuthUser(req);
  if (!authUser) return next();

  const user = await User.findById(authUser.id).select('isBanned');
  if (user?.isBanned) return res.status(403).json({ error: 'Account is blocked' });
  req.authUser = authUser;
  next();
}

