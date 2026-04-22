import express from 'express';
import { getInstitutionStats, getInstitutionRequests, getInstitutionMessages, getInstitutionDonors } from '../controllers/institutionController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.use(restrictTo('institution', 'admin', 'super_admin'));

router.get('/stats', getInstitutionStats);
router.get('/my-requests', getInstitutionRequests);
router.get('/messages', getInstitutionMessages);
router.get('/donors', getInstitutionDonors);

export default router;
