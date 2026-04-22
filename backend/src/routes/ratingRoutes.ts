import express from 'express';
import {
    submitRating,
    getHelperRatings,
    getHelperRatingSummary,
    getMyRatings,
} from '../controllers/ratingController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.post('/', submitRating);
router.get('/my', getMyRatings);
router.get('/helper/:helperId', getHelperRatings);
router.get('/helper/:helperId/summary', getHelperRatingSummary);

export default router;
