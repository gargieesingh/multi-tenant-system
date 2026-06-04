const express = require('express');
const { create, getAll, getOne, remove } = require('./org.controller');
const { authenticate } = require('../../middlewares/auth');
const { authorize, checkOrgAccess } = require('../../middlewares/rbac');

const router = express.Router();

/**
 * Organization Routes
 *
 * POST   /api/organizations          - Create org       (SUPERADMIN)
 * GET    /api/organizations          - Get all orgs     (SUPERADMIN)
 * GET    /api/organizations/:orgId   - Get one org      (SUPERADMIN, ADMIN + org access check)
 * DELETE /api/organizations/:orgId   - Delete org       (SUPERADMIN)
 */
router.post('/', authenticate, authorize('SUPERADMIN'), create);
router.get('/', authenticate, authorize('SUPERADMIN'), getAll);
router.get('/:orgId', authenticate, authorize('SUPERADMIN', 'ADMIN'), checkOrgAccess, getOne);
router.delete('/:orgId', authenticate, authorize('SUPERADMIN'), remove);

module.exports = router;
