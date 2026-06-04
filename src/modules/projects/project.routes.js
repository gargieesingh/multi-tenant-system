const express = require('express');
const {
  create,
  getAll,
  getByOrg,
  getOne,
  remove,
  addMember,
  removeMember,
} = require('./project.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorize, checkOrgAccess, checkProjectAccess } = require('../../middlewares/rbac');

const router = express.Router();

/**
 * Project Routes
 *
 * POST   /api/projects                          - Create project         (SUPERADMIN, ADMIN)
 * GET    /api/projects                          - Get ALL projects       (SUPERADMIN)
 * GET    /api/projects/org/:orgId               - Get projects in org    (SUPERADMIN, ADMIN + org access)
 * GET    /api/projects/:projectId               - Get single project     (ALL + project access)
 * DELETE /api/projects/:projectId               - Delete project         (SUPERADMIN, ADMIN)
 * POST   /api/projects/:projectId/members       - Add member             (SUPERADMIN, ADMIN)
 * DELETE /api/projects/:projectId/members/:userId - Remove member        (SUPERADMIN, ADMIN)
 *
 * NOTE: /org/:orgId route must be declared BEFORE /:projectId to avoid route conflicts
 */
router.post('/', authenticate, authorize('SUPERADMIN', 'ADMIN'), create);
router.get('/', authenticate, authorize('SUPERADMIN'), getAll);
router.get('/org/:orgId', authenticate, authorize('SUPERADMIN', 'ADMIN'), checkOrgAccess, getByOrg);
router.get('/:projectId', authenticate, checkProjectAccess, getOne);
router.delete('/:projectId', authenticate, authorize('SUPERADMIN', 'ADMIN'), remove);
router.post('/:projectId/members', authenticate, authorize('SUPERADMIN', 'ADMIN'), addMember);
router.delete(
  '/:projectId/members/:userId',
  authenticate,
  authorize('SUPERADMIN', 'ADMIN'),
  removeMember
);

module.exports = router;
