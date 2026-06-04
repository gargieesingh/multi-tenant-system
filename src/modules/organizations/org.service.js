const prisma = require('../../config/db');

/**
 * Organization Service
 * Business logic for organization CRUD operations.
 */

/**
 * Create a new organization.
 * @param {string} name
 */
const createOrganization = async ({ name }) => {
  const existing = await prisma.organization.findUnique({ where: { name } });
  if (existing) {
    const error = new Error('An organization with this name already exists.');
    error.statusCode = 409;
    throw error;
  }

  const organization = await prisma.organization.create({
    data: { name },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return organization;
};

/**
 * Get all organizations (SUPERADMIN only).
 */
const getAllOrganizations = async () => {
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          users: true,
          projects: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return organizations;
};

/**
 * Get a single organization by ID.
 * @param {string} orgId
 */
const getOrganizationById = async (orgId) => {
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      users: {
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
      projects: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
        },
      },
    },
  });

  if (!organization) {
    const error = new Error('Organization not found.');
    error.statusCode = 404;
    throw error;
  }

  return organization;
};

/**
 * Delete an organization by ID.
 * @param {string} orgId
 */
const deleteOrganization = async (orgId) => {
  const organization = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!organization) {
    const error = new Error('Organization not found.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.organization.delete({ where: { id: orgId } });

  return { id: orgId, name: organization.name };
};

module.exports = {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  deleteOrganization,
};
