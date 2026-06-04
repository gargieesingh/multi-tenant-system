const prisma = require('../../config/db');

/**
 * Project Service
 * Business logic for project CRUD and member management.
 */

/**
 * Create a new project.
 * - ADMIN: organizationId is always set from their own org (server-enforced)
 * - SUPERADMIN: must provide organizationId in body
 * @param {string} name
 * @param {string} [description]
 * @param {string} organizationId
 */
const createProject = async ({ name, description, organizationId }) => {
  // Verify organization exists
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) {
    const error = new Error('Organization not found.');
    error.statusCode = 404;
    throw error;
  }

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      organizationId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      organizationId: true,
      organization: { select: { id: true, name: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  return project;
};

/**
 * Get all projects across all orgs (SUPERADMIN only).
 */
const getAllProjects = async () => {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      organizationId: true,
      organization: { select: { id: true, name: true } },
      createdAt: true,
      updatedAt: true,
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return projects;
};

/**
 * Get all projects within a specific organization.
 * @param {string} orgId
 */
const getProjectsByOrg = async (orgId) => {
  // Verify org exists
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    const error = new Error('Organization not found.');
    error.statusCode = 404;
    throw error;
  }

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      name: true,
      description: true,
      organizationId: true,
      organization: { select: { id: true, name: true } },
      createdAt: true,
      updatedAt: true,
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return projects;
};

/**
 * Get a single project by ID.
 * @param {string} projectId
 */
const getProjectById = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      organizationId: true,
      organization: { select: { id: true, name: true } },
      members: {
        select: {
          id: true,
          createdAt: true,
          user: {
            select: { id: true, email: true, role: true },
          },
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  return project;
};

/**
 * Delete a project by ID.
 * @param {string} projectId
 * @param {object} requestingUser - The authenticated user
 */
const deleteProject = async (projectId, requestingUser) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  // ADMIN can only delete projects within their org
  if (
    requestingUser.role === 'ADMIN' &&
    project.organizationId !== requestingUser.organizationId
  ) {
    const error = new Error('Access denied. This project does not belong to your organization.');
    error.statusCode = 403;
    throw error;
  }

  await prisma.project.delete({ where: { id: projectId } });

  return { id: projectId, name: project.name };
};

/**
 * Add a member to a project.
 * @param {string} projectId
 * @param {string} userId
 * @param {object} requestingUser
 */
const addProjectMember = async (projectId, userId, requestingUser) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  // ADMIN can only manage projects in their org
  if (
    requestingUser.role === 'ADMIN' &&
    project.organizationId !== requestingUser.organizationId
  ) {
    const error = new Error('Access denied. This project does not belong to your organization.');
    error.statusCode = 403;
    throw error;
  }

  // Verify the user to be added exists
  const userToAdd = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, organizationId: true },
  });
  if (!userToAdd) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  // Check if already a member
  const existingMembership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (existingMembership) {
    const error = new Error('User is already a member of this project.');
    error.statusCode = 409;
    throw error;
  }

  const membership = await prisma.projectMember.create({
    data: { userId, projectId },
    select: {
      id: true,
      createdAt: true,
      user: { select: { id: true, email: true, role: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return membership;
};

/**
 * Remove a member from a project.
 * @param {string} projectId
 * @param {string} userId
 * @param {object} requestingUser
 */
const removeProjectMember = async (projectId, userId, requestingUser) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  // ADMIN can only manage projects in their org
  if (
    requestingUser.role === 'ADMIN' &&
    project.organizationId !== requestingUser.organizationId
  ) {
    const error = new Error('Access denied. This project does not belong to your organization.');
    error.statusCode = 403;
    throw error;
  }

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!membership) {
    const error = new Error('User is not a member of this project.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.projectMember.delete({
    where: { userId_projectId: { userId, projectId } },
  });

  return { userId, projectId };
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectsByOrg,
  getProjectById,
  deleteProject,
  addProjectMember,
  removeProjectMember,
};
