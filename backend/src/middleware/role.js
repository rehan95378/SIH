// Role middleware restricts access by user role.
const requireRole = (...roles) => (req, res, next) => {
  if (roles.length === 0) {
    throw new Error('At least one allowed role is required.');
  }

  const userRole = req.user?.role || 'guest';

  if (!roles.includes(userRole)) {
    return res.status(403).json({ message: 'Forbidden: missing required role.' });
  }

  return next();
};

module.exports = { requireRole };
