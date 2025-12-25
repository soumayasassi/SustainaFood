const User = require('../models/User');

const restrictTo = (...roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id); // Assumes req.user is set by auth middleware
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking permissions', error: error.message });
    }
  };
};

module.exports = restrictTo;