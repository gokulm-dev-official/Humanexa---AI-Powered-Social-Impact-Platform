import express from 'express';
import {
    getCertificationStatus,
    applyForTier,
    startTraining,
    submitTraining,
    getTrainingProgress,
    subscribeTier,
} from '../controllers/certificationController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.use(restrictTo('helper'));

router.get('/status', getCertificationStatus);
router.post('/apply/:tier', applyForTier);
router.post('/training/start', startTraining);
router.post('/training/submit', submitTraining);
router.get('/training/progress', getTrainingProgress);
router.post('/subscribe', subscribeTier);

export default router;
