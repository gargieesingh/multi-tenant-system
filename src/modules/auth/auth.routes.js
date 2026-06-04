const express = require('express');
const { register, login, me } = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

/**
 * Auth Routes
 * POST /api/auth/register  - Register a new user
 * POST /api/auth/login     - Login and receive JWT
 * GET  /api/auth/me        - Get current user profile (authenticated)
 */
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);

module.exports = router;
