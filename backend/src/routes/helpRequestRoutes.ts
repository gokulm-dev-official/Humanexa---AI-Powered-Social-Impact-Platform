import express from 'express';
import {
    createHelpRequest,
    getAvailableRequests,
    acceptRequest,
    submitProof,
    getMyRequests,
    getBroadcastRequests,
    donateToBroadcast,
    getRequestById,
    getDonationHistory,
    getReceiptData,
    getProofPhotos,
    getRequestDonors,
    sendReceiptEmail,
    verifyReceiptEndpoint,
} from '../controllers/helpRequestController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.post('/', createHelpRequest);
router.get('/my', getMyRequests);
router.get('/broadcasts', getBroadcastRequests);
router.get('/donation-history', getDonationHistory);
router.get('/available', restrictTo('helper'), getAvailableRequests);
router.get('/receipt/:transactionId', getReceiptData);
router.post('/receipt/:receiptId/email', sendReceiptEmail);
router.get('/receipt/verify/:hash', verifyReceiptEndpoint);
router.get('/:id', getRequestById);
router.get('/:id/proof-photos', getProofPhotos);
router.get('/:id/donors', getRequestDonors);
router.post('/:id/accept', restrictTo('helper'), acceptRequest);
router.post('/:id/submit-proof', restrictTo('helper'), submitProof);
router.post('/:id/donate', restrictTo('donor'), donateToBroadcast);

export default router;
