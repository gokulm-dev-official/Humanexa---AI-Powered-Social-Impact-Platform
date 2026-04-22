import express from 'express';
import {
    createTask,
    getTask,
    confirmArrival,
    uploadTaskPhoto,
    completeVerificationTask,
    getHelperActiveTasks,
    getHelperTaskHistory,
} from '../controllers/verificationTaskController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('helper'), createTask);
router.get('/helper/active', restrictTo('helper'), getHelperActiveTasks);
router.get('/helper/history', restrictTo('helper'), getHelperTaskHistory);
router.get('/:taskId', getTask);
router.post('/:taskId/confirm-arrival', restrictTo('helper'), confirmArrival);
router.post('/:taskId/upload-photo', restrictTo('helper'), uploadTaskPhoto);
router.post('/:taskId/complete', restrictTo('helper'), completeVerificationTask);

export default router;
