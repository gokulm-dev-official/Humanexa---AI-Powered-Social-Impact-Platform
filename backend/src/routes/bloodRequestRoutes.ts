import express from 'express';
import {
    createBloodRequest,
    getNearbyBloodRequests,
    getMyBloodRequests,
    respondToBloodRequest,
    acceptRespondent,
    fulfillBloodRequest,
} from '../controllers/bloodRequestController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.post('/', createBloodRequest);
router.get('/nearby', getNearbyBloodRequests);
router.get('/my', getMyBloodRequests);
router.post('/:id/respond', respondToBloodRequest);
router.post('/:id/accept/:donorId', acceptRespondent);
router.post('/:id/fulfill', fulfillBloodRequest);

export default router;
