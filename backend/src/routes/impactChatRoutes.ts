import express from 'express';
import {
    postNeed,
    sendAmount,
    completeImpact,
    getActiveChats,
    sendMessage,
    getDonationHistory
} from '../controllers/impactChatController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.post('/post-need', postNeed);
router.get('/donation-history', getDonationHistory);
router.post('/:id/send-amount', sendAmount);
router.post('/:id/complete', completeImpact);
router.post('/:id/message', sendMessage);
router.get('/active', getActiveChats);

export default router;
