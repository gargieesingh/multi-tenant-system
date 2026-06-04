const prisma = require('../config/db');

/**
 * Role-Based Access Control Middleware
 * Three functions: authorize, checkOrgAccess, checkProjectAccess
 */

/**
 * authorize(...roles)
 * Checks if the authenticated user's role is in the allowed roles list.
 * Returns 403 if the user's role is not permitted.
 *
 * @param {...string} roles - Allowed roles (e.g., 'SUPERADMIN', 'ADMIN', 'MEMBER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
};

/**
 * checkOrgAccess
 * - SUPERADMIN: always passes through
 * - ADMIN and MEMBER: must have req.user.organizationId === req.params.orgId
 * Returns 403 if mismatch.
 */
const checkOrgAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { role, organizationId } = req.user;
  const { orgId } = req.params;

  if (role === 'SUPERADMIN') {
    return next();
  }

  if (organizationId !== orgId) {
    return res.status(403).json({
      error: 'Access denied. You do not have access to this organization.',
    });
  }

  next();
};

/**
 * checkProjectAccess
 * - SUPERADMIN: always passes through
 * - ADMIN: project's organizationId must match req.user.organizationId
 * - MEMBER: must have a ProjectMember record for (userId, projectId)
 * Returns 403 for any access violation.
 */
const checkProjectAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { role, id: userId, organizationId } = req.user;
    const { projectId } = req.params;

    if (role === 'SUPERADMIN') {
      return next();
    }

    // Fetch the project to validate access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, organizationId: true },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (role === 'ADMIN') {
      if (project.organizationId !== organizationId) {
        return res.status(403).json({
          error: 'Access denied. This project does not belong to your organization.',
        });
      }
      return next();
    }

    if (role === 'MEMBER') {
      const membership = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: { userId, projectId },
        },
      });

      if (!membership) {
        return res.status(403).json({
          error: 'Access denied. You are not a member of this project.',
        });
      }
      return next();
    }

    return res.status(403).json({ error: 'Access denied.' });
  } catch (error) {
    console.error('checkProjectAccess error:', error);
    return res.status(500).json({ error: 'Internal server error during access check.' });
  }
};

module.exports = { authorize, checkOrgAccess, checkProjectAccess };
