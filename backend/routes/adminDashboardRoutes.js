import express from 'express';
import { authenticateToken } from '../utils/jwt.js';
import { rejectBannedUsers, requireUserTypes } from '../middleware/rbac.js';
import { getDashboardSummary } from '../controllers/admin/dashboardController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(rejectBannedUsers);
router.use(requireUserTypes(['admin', 'host']));

router.get('/summary', getDashboardSummary);

export default router;

