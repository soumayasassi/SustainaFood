const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    console.log('Auth Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - Invalid or missing token' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token:', token);

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - Token is empty' });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret'; // Fallback for testing
    const decoded = jwt.verify(token, secret);
    console.log('Decoded token:', decoded);

    // Fetch user from database to ensure req.user matches expected format
    const user = await User.findById(decoded.userId).select('_id role');
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - User not found' });
    }

    req.user = user; // Attach Mongoose document with _id and role
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }
};

module.exports = authMiddleware;