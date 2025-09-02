import { Router } from 'express';
import { ensureAuth, ensureAdmin } from '../middleware/auth.middleware';
import { validate, validateMultiple } from '../middleware/validation.middleware';
import {
  listUsersSchema,
  getUserSchema,
  updateUserStatusSchema,
  updateUserAdminSchema,
  listAuditLogsSchema
} from '../validators/admin.validator';
import * as AdminController from '../controllers/admin.controller';

const router = Router();

router.get('/users', ensureAuth, ensureAdmin, validate(listUsersSchema, 'query'), AdminController.listUsers);
router.get('/users/:userId', ensureAuth, ensureAdmin, validate(getUserSchema, 'params'), AdminController.getUser);
router.put('/users/:userId/status', ensureAuth, ensureAdmin, validateMultiple(updateUserStatusSchema), AdminController.updateUserStatus);
router.put('/users/:userId/admin', ensureAuth, ensureAdmin, validateMultiple(updateUserAdminSchema), AdminController.updateUserAdmin);
router.get('/audit-logs', ensureAuth, ensureAdmin, validate(listAuditLogsSchema, 'query'), AdminController.listAuditLogs);
router.get('/stats', ensureAuth, ensureAdmin, AdminController.stats);

// Security management endpoints
router.get('/security-info/:userId', ensureAuth, ensureAdmin, AdminController.getUserSecurityInfo);
router.get('/locked-users', ensureAuth, ensureAdmin, AdminController.getLockedUsers);

export default router;


