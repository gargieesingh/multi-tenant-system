const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

/**
 * Authentication middleware
 * Verifies JWT token and re-fetches user from DB to attach fresh data.
 * Never trusts role data from the JWT payload.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired. Please login again.' });
      }
      return res.status(401).json({ error: 'Invalid token. Authentication failed.' });
    }

    // Always re-fetch user from DB — never trust JWT payload for role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists. Authentication failed.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

module.exports = { authenticate };
