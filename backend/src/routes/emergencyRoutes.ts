import express from 'express';
import {
    createEmergencyAlert,
    getAlertStatus,
    cancelAlert,
    getMyAlerts,
    getActiveAlerts,
    acceptEmergency,
    markArrived,
    resolveEmergency,
    updateHelperLocation,
    updateEmergencySettings,
    getEmergencyHistory,
    getHelperSettings,
    getLiveHelperLocations,
} from '../controllers/emergencyController';
import { protect, restrictTo } from '../middleware/auth';

const router = express.Router();

router.use(protect);

// Donor endpoints
router.post('/create', restrictTo('donor'), createEmergencyAlert);
router.get('/my-alerts', restrictTo('donor'), getMyAlerts);
router.get('/:alertId/status', getAlertStatus);
router.delete('/:alertId/cancel', restrictTo('donor'), cancelAlert);

// Helper endpoints
router.get('/helper/active', restrictTo('helper'), getActiveAlerts);
router.post('/helper/:alertId/accept', restrictTo('helper'), acceptEmergency);
router.post('/helper/:alertId/arrive', restrictTo('helper'), markArrived);
router.post('/helper/:alertId/resolve', restrictTo('helper'), resolveEmergency);
router.post('/helper/location/update', restrictTo('helper'), updateHelperLocation);
router.patch('/helper/settings', restrictTo('helper'), updateEmergencySettings);
router.get('/helper/settings', restrictTo('helper'), getHelperSettings);
router.get('/helper/history', restrictTo('helper'), getEmergencyHistory);

// Discovery & Real-time Tracking
router.get('/helper/live-locations', getLiveHelperLocations);

export default router;
