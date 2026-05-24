const jwt = require('jsonwebtoken');

const User = require('../models/User');
const asyncHandler = require('./asyncHandler');

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401);
    throw new Error('Authentication token is required.');
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-only-change-me');
  } catch (error) {
    res.status(401);
    throw new Error('Session expired. Please login again.');
  }

  const user = await User.findById(payload.userId).select('-passwordHash');

  if (!user) {
    res.status(401);
    throw new Error('User session is no longer valid.');
  }

  req.user = user;
  next();
});

module.exports = { requireAuth };
