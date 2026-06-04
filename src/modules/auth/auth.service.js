const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');

/**
 * Auth Service
 * Business logic for registration, login, and profile retrieval.
 */

/**
 * Register a new user.
 * @param {string} email
 * @param {string} password
 * @param {string} [role]
 * @param {string} [organizationId]
 */
const registerUser = async ({ email, password, role, organizationId }) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error('A user with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Build user data
  const userData = {
    email,
    password: hashedPassword,
  };

  if (role) userData.role = role;
  if (organizationId) userData.organizationId = organizationId;

  const user = await prisma.user.create({
    data: userData,
    select: {
      id: true,
      email: true,
      role: true,
      organizationId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

/**
 * Login a user, returning a signed JWT.
 * JWT contains only { userId } — role is never stored in token.
 * @param {string} email
 * @param {string} password
 */
const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      organizationId: true,
    },
  });

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Sign JWT with only userId — role is fetched from DB on each request
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
  };
};

/**
 * Get the current authenticated user's profile.
 * @param {string} userId
 */
const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      organizationId: true,
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

module.exports = { registerUser, loginUser, getMe };
