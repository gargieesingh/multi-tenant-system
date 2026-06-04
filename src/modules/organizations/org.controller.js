const {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  deleteOrganization,
} = require('./org.service');

/**
 * Organization Controller
 * Handles HTTP request/response for organization routes.
 */

/**
 * POST /api/organizations
 * Create a new organization. (SUPERADMIN only)
 */
const create = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Organization name is required.' });
    }

    const organization = await createOrganization({ name: name.trim() });

    return res.status(201).json({
      data: { organization },
      message: 'Organization created successfully.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('org create controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/organizations
 * Get all organizations. (SUPERADMIN only)
 */
const getAll = async (req, res) => {
  try {
    const organizations = await getAllOrganizations();

    return res.status(200).json({
      data: { organizations },
      message: 'Organizations retrieved successfully.',
    });
  } catch (error) {
    console.error('org getAll controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/organizations/:orgId
 * Get a single organization by ID. (SUPERADMIN, ADMIN with org access check)
 */
const getOne = async (req, res) => {
  try {
    const { orgId } = req.params;
    const organization = await getOrganizationById(orgId);

    return res.status(200).json({
      data: { organization },
      message: 'Organization retrieved successfully.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('org getOne controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * DELETE /api/organizations/:orgId
 * Delete an organization. (SUPERADMIN only)
 */
const remove = async (req, res) => {
  try {
    const { orgId } = req.params;
    const deleted = await deleteOrganization(orgId);

    return res.status(200).json({
      data: { deleted },
      message: 'Organization deleted successfully.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('org remove controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { create, getAll, getOne, remove };
