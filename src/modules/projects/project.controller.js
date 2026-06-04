const {
  createProject,
  getAllProjects,
  getProjectsByOrg,
  getProjectById,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} = require('./project.service');

/**
 * Project Controller
 * Handles HTTP request/response for project routes.
 */

/**
 * POST /api/projects
 * Create a new project.
 * - ADMIN: organizationId is always forced to their own org (server-enforced)
 * - SUPERADMIN: must provide organizationId in body
 */
const create = async (req, res) => {
  try {
    const { name, description } = req.body;
    let { organizationId } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    // If ADMIN, always use their own organizationId regardless of what was sent
    if (req.user.role === 'ADMIN') {
      organizationId = req.user.organizationId;
    }

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required.' });
    }

    const project = await createProject({ name: name.trim(), description, organizationId });

    return res.status(201).json({
      data: { project },
      message: 'Project created successfully.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('project create controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/projects
 * Get ALL projects across all orgs. (SUPERADMIN only)
 */
const getAll = async (req, res) => {
  try {
    const projects = await getAllProjects();

    return res.status(200).json({
      data: { projects },
      message: 'Projects retrieved successfully.',
    });
  } catch (error) {
    console.error('project getAll controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/projects/org/:orgId
 * Get all projects in a specific organization. (SUPERADMIN, ADMIN with org access)
 */
const getByOrg = async (req, res) => {
  try {
    const { orgId } = req.params;
    const projects = await getProjectsByOrg(orgId);

    return res.status(200).json({
      data: { projects },
      message: 'Projects retrieved successfully.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('project getByOrg controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/projects/:projectId
 * Get a single project by ID. (ALL roles with project access check)
 */
const getOne = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await getProjectById(projectId);

    return res.status(200).json({
      data: { project },
      message: 'Project retrieved successfully.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('project getOne controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * DELETE /api/projects/:projectId
 * Delete a project. (SUPERADMIN, ADMIN)
 */
const remove = async (req, res) => {
  try {
    const { projectId } = req.params;
    const deleted = await deleteProject(projectId, req.user);

    return res.status(200).json({
      data: { deleted },
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('project remove controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * POST /api/projects/:projectId/members
 * Add a member to a project. (SUPERADMIN, ADMIN)
 */
const addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }

    const membership = await addProjectMember(projectId, userId, req.user);

    return res.status(201).json({
      data: { membership },
      message: 'Member added to project successfully.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('project addMember controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * DELETE /api/projects/:projectId/members/:userId
 * Remove a member from a project. (SUPERADMIN, ADMIN)
 */
const removeMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const result = await removeProjectMember(projectId, userId, req.user);

    return res.status(200).json({
      data: { removed: result },
      message: 'Member removed from project successfully.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('project removeMember controller error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { create, getAll, getByOrg, getOne, remove, addMember, removeMember };
