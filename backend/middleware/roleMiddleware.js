// Middleware to allow access based on user roles
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied for this role" });
  }
  return next();
};

module.exports = { authorizeRoles };
