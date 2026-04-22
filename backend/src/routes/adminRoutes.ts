import express from 'express';
import { getAdminStats, manualVerify, issueAwards, issueDailyAwards, getLeaderboardData, getUsers, getAuditLogs } from '../controllers/adminController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

router.use(protect);

// Publicly accessible within platform (All roles)
router.get('/leaderboard', getLeaderboardData);

// Admin Only
router.use(restrictTo('admin', 'super_admin'));
router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.get('/audit-logs', getAuditLogs);
router.post('/verify/:id', manualVerify);
router.post('/issue-awards', issueAwards);
router.post('/issue-daily-awards', issueDailyAwards);

export default router;
