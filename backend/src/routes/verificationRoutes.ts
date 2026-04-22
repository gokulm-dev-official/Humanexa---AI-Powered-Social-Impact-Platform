import express from 'express';
import {
    validateSinglePhoto,
    validateBatchPhotos,
    uploadProof,
    getTaskValidation,
} from '../controllers/photoValidationController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.post('/validate-photo', validateSinglePhoto);
router.post('/validate-batch', validateBatchPhotos);
router.post('/upload-proof', uploadProof);
router.get('/task/:taskId/validation', getTaskValidation);

export default router;
