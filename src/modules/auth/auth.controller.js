const { registerUser, loginUser, getMe } = require('./auth.service');

/**
 * Auth Controller
 * Handles HTTP request/response for authentication routes.
 */

/**
 * POST /api/auth/register
 * Register a new user.
 */
const register = async (req, res) => {
  try {
    const { email, password, role, organizationId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const user = await registerUser({ email, password, role, organizationId });

    return res.status(201).json({
      data: { user },
      message: 'User registered successfully.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('register controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await loginUser({ email, password });

    return res.status(200).json({
      data: result,
      message: 'Login successful.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('login controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/auth/me
 * Get the currently authenticated user's profile.
 */
const me = async (req, res) => {
  try {
    const user = await getMe(req.user.id);

    return res.status(200).json({
      data: { user },
      message: 'Profile retrieved successfully.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('me controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { register, login, me };
