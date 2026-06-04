require('dotenv').config();
const express = require('express');

const authRoutes = require('./modules/auth/auth.routes');
const orgRoutes = require('./modules/organizations/org.routes');
const projectRoutes = require('./modules/projects/project.routes');

const app = express();

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    data: { status: 'ok', timestamp: new Date().toISOString() },
    message: 'Multi-Tenant API is running.',
  });
});

// ─── Route Modules ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/projects', projectRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred.';

  res.status(statusCode).json({ error: message });
});

module.exports = app;
