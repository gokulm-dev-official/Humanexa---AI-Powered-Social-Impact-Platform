import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import EmergencyAlert from '../models/EmergencyAlert';
import HelperLocation from '../models/HelperLocation';
import EmergencyResponse from '../models/EmergencyResponse';
import User from '../models/User';
import NotificationService from '../services/notificationService';
import { getIo } from '../socket';

// Haversine distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function generateAlertId(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `EMG-${y}-${m}-${d}-${rand}`;
}

// ──────────────────────────────── DONOR ENDPOINTS ────────────────────────────────

export const createEmergencyAlert = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const { emergencyType, description, photo, location } = req.body;

        if (!emergencyType || !location?.latitude || !location?.longitude) {
            return res.status(400).json({ status: 'fail', message: 'Emergency type and location are required.' });
        }

        // GPS accuracy is informational only - desktop browsers use IP geolocation with low accuracy

        // No cooldown — unlimited emergency signals allowed at any time

        const alertId = generateAlertId();
        const radiusKm = 50; // 50km radius for broad emergency coverage

        // Find nearby available helpers — multi-tier approach for reliability
        let nearbyHelpers: any[] = [];

        // Tier 1: Try geospatial $near query (requires 2dsphere index)
        try {
            nearbyHelpers = await HelperLocation.find({
                isAvailable: true,
                $or: [
                    { currentEmergency: null },
                    { currentEmergency: { $exists: false } },
                ],
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [location.longitude, location.latitude],
                        },
                        $maxDistance: radiusKm * 1000,
                    },
                },
            }).limit(30);
        } catch (geoErr) {
            console.warn('Geospatial $near query failed, trying $geoWithin fallback:', geoErr);
        }

        // Tier 2: If $near failed or returned nothing, try $geoWithin (works without sorted index)
        if (nearbyHelpers.length === 0) {
            try {
                nearbyHelpers = await HelperLocation.find({
                    isAvailable: true,
                    $or: [
                        { currentEmergency: null },
                        { currentEmergency: { $exists: false } },
                    ],
                    location: {
                        $geoWithin: {
                            $centerSphere: [
                                [location.longitude, location.latitude],
                                radiusKm / 6378.1, // Convert km to radians
                            ],
                        },
                    },
                }).limit(30);
            } catch (geoErr2) {
                console.warn('Geospatial $geoWithin query failed, using manual fallback:', geoErr2);
            }
        }

        // Tier 3: If all geospatial queries failed, fallback to manual Haversine distance calculation
        if (nearbyHelpers.length === 0) {
            console.log('Using manual distance fallback to find helpers');
            try {
                const allAvailableHelpers = await HelperLocation.find({
                    isAvailable: true,
                    $or: [
                        { currentEmergency: null },
                        { currentEmergency: { $exists: false } },
                    ],
                    latitude: { $exists: true },
                    longitude: { $exists: true },
                });

                nearbyHelpers = allAvailableHelpers.filter((h) => {
                    const dist = calculateDistance(
                        location.latitude,
                        location.longitude,
                        h.latitude,
                        h.longitude
                    );
                    return dist <= radiusKm;
                });
            } catch (manualErr) {
                console.error('Manual helper search also failed:', manualErr);
            }
        }

        // Tier 4: Same-location edge case fix (Feature 8)
        // When donor and helper are at the exact same coordinates, distance=0 can cause edge cases
        if (nearbyHelpers.length === 0) {
            console.log('Using same-location fallback (Tier 4)');
            try {
                const sameLocationHelpers = await HelperLocation.find({
                    isAvailable: true,
                    $or: [
                        { currentEmergency: null },
                        { currentEmergency: { $exists: false } },
                    ],
                    latitude: { $gte: location.latitude - 0.001, $lte: location.latitude + 0.001 },
                    longitude: { $gte: location.longitude - 0.001, $lte: location.longitude + 0.001 },
                }).limit(30);
                nearbyHelpers = [...nearbyHelpers, ...sameLocationHelpers];
            } catch (sameLocErr) {
                console.error('Same-location fallback failed:', sameLocErr);
            }
        }

        console.log(`Emergency ${alertId}: Found ${nearbyHelpers.length} helpers within ${radiusKm}km of [${location.latitude}, ${location.longitude}]`);

        const notifiedHelperIds = nearbyHelpers.map((h) => h.helperId);

        const alert = await EmergencyAlert.create({
            alertId,
            donorId: user._id,
            donorName: user.profile?.fullName || 'Anonymous',
            donorPhone: user.phoneNumber || '',
            emergencyType,
            description: description?.slice(0, 500),
            photo,
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address || 'Unknown Location',
                accuracy: location.accuracy || 0,
                coordinates: {
                    type: 'Point',
                    coordinates: [location.longitude, location.latitude],
                },
            },
            status: 'ACTIVE',
            notifiedHelpers: notifiedHelperIds,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });

        // Notify each helper via socket
        const io = getIo();
        const emergencyTypeLabels: Record<string, string> = {
            MEDICAL: '🚑 Medical Emergency',
            FIRE: '🔥 Fire Emergency',
            ACCIDENT: '🚗 Accident',
            PERSON_IN_DISTRESS: '👤 Person in Distress',
            WATER: '💧 Water Emergency',
            OTHER: '📦 Emergency',
        };

        for (const helperLoc of nearbyHelpers) {
            const dist = calculateDistance(
                location.latitude,
                location.longitude,
                helperLoc.latitude,
                helperLoc.longitude
            );

            const alertPayload = {
                alertId: alert._id,
                alertCode: alertId,
                emergencyType,
                emergencyLabel: emergencyTypeLabels[emergencyType] || '📦 Emergency',
                description: description?.slice(0, 200),
                photo,
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: location.address || 'Unknown',
                },
                donorName: user.profile?.fullName || 'Anonymous',
                distance: Math.round(dist * 10) / 10,
                createdAt: alert.createdAt,
                expiresAt: alert.expiresAt,
                totalNotified: notifiedHelperIds.length,
            };

            if (io) {
                io.to(helperLoc.helperId.toString()).emit('emergency-alert', alertPayload);
            }

            await NotificationService.sendNotification(helperLoc.helperId.toString(), {
                title: '🚨 EMERGENCY ALERT',
                message: `${emergencyTypeLabels[emergencyType]} - ${dist.toFixed(1)} km from you`,
                type: 'warning',
                priority: 'critical',
            });

            // Feature 8: SMS fallback for emergencies
            try {
                const helperUser = await User.findById(helperLoc.helperId).select('phoneNumber');
                if (helperUser?.phoneNumber) {
                    await NotificationService.sendEmergencySMS(helperUser.phoneNumber, {
                        emergencyLabel: emergencyTypeLabels[emergencyType] || 'Emergency',
                        distance: Math.round(dist * 1000),
                        donorName: user.profile?.fullName,
                        alertId,
                    });
                }
            } catch (smsErr) {
                console.warn(`SMS fallback failed for helper ${helperLoc.helperId}:`, smsErr);
            }
        }

        // Build nearest helpers info for donor
        const helperInfos = [];
        for (const helperLoc of nearbyHelpers.slice(0, 3)) {
            const helperUser = await User.findById(helperLoc.helperId).select('profile.fullName creditScore.totalPoints statistics.totalHelps');
            const dist = calculateDistance(location.latitude, location.longitude, helperLoc.latitude, helperLoc.longitude);
            helperInfos.push({
                id: helperLoc.helperId,
                name: helperUser?.profile?.fullName || 'Helper',
                distance: Math.round(dist * 10) / 10,
                rating: helperUser?.creditScore?.totalPoints || 0,
                helps: helperUser?.statistics?.totalHelps || 0,
            });
        }

        res.status(201).json({
            status: 'success',
            data: {
                alert: {
                    _id: alert._id,
                    alertId,
                    emergencyType,
                    status: 'ACTIVE',
                    createdAt: alert.createdAt,
                    expiresAt: alert.expiresAt,
                    location: alert.location,
                },
                notifiedCount: notifiedHelperIds.length,
                nearestHelpers: helperInfos,
            },
        });
    } catch (err: any) {
        console.error('Emergency create error:', err);
        res.status(500).json({ status: 'error', message: err.message || 'Failed to create emergency alert.' });
    }
};

export const getAlertStatus = async (req: AuthRequest, res: Response) => {
    try {
        const alert = await EmergencyAlert.findById(req.params.alertId).populate('acceptedBy', 'profile.fullName phoneNumber');

        if (!alert) {
            return res.status(404).json({ status: 'fail', message: 'Alert not found.' });
        }

        // Check expiry
        if (alert.status === 'ACTIVE' && new Date() > alert.expiresAt) {
            alert.status = 'EXPIRED';
            await alert.save();
        }

        let acceptedHelper = null;
        if (alert.acceptedBy) {
            const helperLoc = await HelperLocation.findOne({ helperId: alert.acceptedBy });
            const helperUser = await User.findById(alert.acceptedBy).select('profile.fullName phoneNumber creditScore statistics');
            const dist = helperLoc
                ? calculateDistance(alert.location.latitude, alert.location.longitude, helperLoc.latitude, helperLoc.longitude)
                : 0;

            acceptedHelper = {
                id: alert.acceptedBy,
                name: helperUser?.profile?.fullName || 'Helper',
                phone: helperUser?.phoneNumber,
                distance: Math.round(dist * 10) / 10,
                eta: Math.ceil(dist * 3),
                location: helperLoc ? { latitude: helperLoc.latitude, longitude: helperLoc.longitude } : null,
                rating: helperUser?.creditScore?.totalPoints || 0,
                helps: helperUser?.statistics?.totalHelps || 0,
            };
        }

        // Build notified helpers info
        const notifiedInfos = [];
        for (const hId of alert.notifiedHelpers.slice(0, 5)) {
            const helperUser = await User.findById(hId).select('profile.fullName creditScore statistics');
            const helperLoc = await HelperLocation.findOne({ helperId: hId });
            const dist = helperLoc
                ? calculateDistance(alert.location.latitude, alert.location.longitude, helperLoc.latitude, helperLoc.longitude)
                : 0;
            notifiedInfos.push({
                id: hId,
                name: helperUser?.profile?.fullName || 'Helper',
                distance: Math.round(dist * 10) / 10,
                rating: helperUser?.creditScore?.totalPoints || 0,
                helps: helperUser?.statistics?.totalHelps || 0,
                isOnline: helperLoc ? (Date.now() - new Date(helperLoc.lastUpdated).getTime() < 5 * 60 * 1000) : false,
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                alert: {
                    _id: alert._id,
                    alertId: alert.alertId,
                    emergencyType: alert.emergencyType,
                    description: alert.description,
                    photo: alert.photo,
                    status: alert.status,
                    location: alert.location,
                    createdAt: alert.createdAt,
                    expiresAt: alert.expiresAt,
                    acceptedAt: alert.acceptedAt,
                    resolvedAt: alert.resolvedAt,
                },
                acceptedHelper,
                notifiedHelpers: notifiedInfos,
                notifiedCount: alert.notifiedHelpers.length,
            },
        });
    } catch (err: any) {
        console.error('Alert status error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
};

export const cancelAlert = async (req: AuthRequest, res: Response) => {
    try {
        const alert = await EmergencyAlert.findById(req.params.alertId);
        if (!alert) return res.status(404).json({ status: 'fail', message: 'Alert not found.' });
        if (alert.donorId.toString() !== (req.user!._id as any).toString()) {
            return res.status(403).json({ status: 'fail', message: 'Not authorized.' });
        }

        alert.status = 'CANCELLED';
        await alert.save();

        const io = getIo();
        for (const hId of alert.notifiedHelpers) {
            if (io) io.to(hId.toString()).emit('emergency-cancelled', { alertId: alert._id });
        }

        res.status(200).json({ status: 'success', message: 'Alert cancelled.' });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

export const getMyAlerts = async (req: AuthRequest, res: Response) => {
    try {
        const alerts = await EmergencyAlert.find({ donorId: req.user!._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('alertId emergencyType status location.address createdAt acceptedBy');

        res.status(200).json({ status: 'success', data: { alerts } });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// ──────────────────────────────── HELPER ENDPOINTS ────────────────────────────────

export const getActiveAlerts = async (req: AuthRequest, res: Response) => {
    try {
        const helperLoc = await HelperLocation.findOne({ helperId: req.user!._id });
        if (!helperLoc) {
            return res.status(200).json({ status: 'success', data: { alerts: [] } });
        }

        const radiusKm = helperLoc.emergencySettings?.maxDistance || 10;

        const alerts = await EmergencyAlert.find({
            status: 'ACTIVE',
            expiresAt: { $gt: new Date() },
            notifiedHelpers: req.user!._id,
        })
            .sort({ createdAt: -1 })
            .limit(10);

        const alertsWithDistance = alerts.map((a) => {
            const dist = calculateDistance(helperLoc.latitude, helperLoc.longitude, a.location.latitude, a.location.longitude);
            return {
                ...a.toObject(),
                distance: Math.round(dist * 10) / 10,
            };
        });

        res.status(200).json({ status: 'success', data: { alerts: alertsWithDistance } });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

export const acceptEmergency = async (req: AuthRequest, res: Response) => {
    try {
        const alert = await EmergencyAlert.findById(req.params.alertId);
        if (!alert) return res.status(404).json({ status: 'fail', message: 'Alert not found.' });

        if (alert.status !== 'ACTIVE') {
            return res.status(400).json({ status: 'fail', message: 'Alert is no longer active or already accepted.' });
        }

        if (new Date() > alert.expiresAt) {
            alert.status = 'EXPIRED';
            await alert.save();
            return res.status(400).json({ status: 'fail', message: 'Alert has expired.' });
        }

        const helperLoc = await HelperLocation.findOne({ helperId: req.user!._id });
        const dist = helperLoc
            ? calculateDistance(alert.location.latitude, alert.location.longitude, helperLoc.latitude, helperLoc.longitude)
            : 0;

        alert.status = 'ACCEPTED';
        alert.acceptedBy = req.user!._id as any;
        alert.acceptedAt = new Date();
        await alert.save();

        // Mark helper as busy
        if (helperLoc) {
            helperLoc.currentEmergency = alert._id as any;
            await helperLoc.save();
        }

        // Create response record
        await EmergencyResponse.create({
            alertId: alert._id,
            helperId: req.user!._id,
            helperName: req.user!.profile?.fullName || 'Helper',
            status: 'EN_ROUTE',
            distance: Math.round(dist * 10) / 10,
            route: helperLoc ? [{ lat: helperLoc.latitude, lng: helperLoc.longitude, timestamp: new Date() }] : [],
        });

        // Notify donor
        const io = getIo();
        if (io) {
            io.to(alert.donorId.toString()).emit('helper-accepted', {
                alertId: alert._id,
                helper: {
                    id: req.user!._id,
                    name: req.user!.profile?.fullName || 'Helper',
                    distance: Math.round(dist * 10) / 10,
                    eta: Math.ceil(dist * 3),
                    location: helperLoc ? { latitude: helperLoc.latitude, longitude: helperLoc.longitude } : null,
                },
            });
        }

        // Notify other helpers that alert was taken
        for (const hId of alert.notifiedHelpers) {
            if (hId.toString() !== (req.user!._id as any).toString() && io) {
                io.to(hId.toString()).emit('emergency-taken', { alertId: alert._id, acceptedBy: req.user!.profile?.fullName });
            }
        }

        await NotificationService.sendNotification(alert.donorId.toString(), {
            title: '✅ Helper Responding!',
            message: `${req.user!.profile?.fullName} is on their way - ${dist.toFixed(1)} km away`,
            type: 'success',
            priority: 'high',
        });

        res.status(200).json({
            status: 'success',
            data: {
                alert: {
                    _id: alert._id,
                    alertId: alert.alertId,
                    location: alert.location,
                    emergencyType: alert.emergencyType,
                    description: alert.description,
                    photo: alert.photo,
                    donorName: alert.donorName,
                    donorPhone: alert.donorPhone,
                },
                distance: Math.round(dist * 10) / 10,
                eta: Math.ceil(dist * 3),
            },
        });
    } catch (err: any) {
        console.error('Accept emergency error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
};

export const markArrived = async (req: AuthRequest, res: Response) => {
    try {
        const alert = await EmergencyAlert.findById(req.params.alertId);
        if (!alert) return res.status(404).json({ status: 'fail', message: 'Alert not found.' });

        const response = await EmergencyResponse.findOne({ alertId: alert._id, helperId: req.user!._id });
        if (response) {
            response.status = 'ARRIVED';
            response.arrivedAt = new Date();
            response.responseTime = Math.round((Date.now() - new Date(response.acceptedAt).getTime()) / 1000);
            await response.save();
        }

        const io = getIo();
        if (io) {
            io.to(alert.donorId.toString()).emit('helper-arrived', {
                alertId: alert._id,
                helperId: req.user!._id,
                helperName: req.user!.profile?.fullName,
                arrivalTime: new Date(),
            });
        }

        res.status(200).json({ status: 'success', message: 'Arrival marked.' });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

export const resolveEmergency = async (req: AuthRequest, res: Response) => {
    try {
        const alert = await EmergencyAlert.findById(req.params.alertId);
        if (!alert) return res.status(404).json({ status: 'fail', message: 'Alert not found.' });

        alert.status = 'RESOLVED';
        alert.resolvedAt = new Date();
        await alert.save();

        const response = await EmergencyResponse.findOne({ alertId: alert._id, helperId: req.user!._id });
        if (response) {
            response.status = 'RESOLVED';
            response.resolvedAt = new Date();
            await response.save();
        }

        // Free helper
        await HelperLocation.findOneAndUpdate({ helperId: req.user!._id }, { currentEmergency: null });

        const io = getIo();
        if (io) {
            io.to(alert.donorId.toString()).emit('emergency-resolved', {
                alertId: alert._id,
                resolvedAt: new Date(),
            });
        }

        // Update helper stats
        await User.findByIdAndUpdate(req.user!._id, { $inc: { 'statistics.totalHelps': 1 } });

        res.status(200).json({ status: 'success', message: 'Emergency resolved. Thank you!' });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// ──────────────────────────────── HELPER ENDPOINTS ────────────────────────────────

export const updateHelperLocation = async (req: AuthRequest, res: Response) => {
    try {
        const { latitude, longitude, accuracy } = req.body;
        if (!latitude || !longitude) {
            return res.status(400).json({ status: 'fail', message: 'Latitude and longitude are required.' });
        }

        const update = {
            latitude,
            longitude,
            accuracy: accuracy || 0,
            location: { type: 'Point' as const, coordinates: [longitude, latitude] },
            lastUpdated: new Date(),
        };

        const helperLoc = await HelperLocation.findOneAndUpdate(
            { helperId: req.user!._id },
            { $set: update },
            { upsert: true, new: true }
        );

        // If helper is responding to an emergency, broadcast location to donor
        if (helperLoc?.currentEmergency) {
            const alert = await EmergencyAlert.findById(helperLoc.currentEmergency);
            if (alert) {
                const dist = calculateDistance(alert.location.latitude, alert.location.longitude, latitude, longitude);
                const io = getIo();
                if (io) {
                    io.to(alert.donorId.toString()).emit('helper-location-update', {
                        alertId: alert._id,
                        helperId: req.user!._id,
                        latitude,
                        longitude,
                        distance: Math.round(dist * 10) / 10,
                        eta: Math.ceil(dist * 3),
                    });
                }

                // Save breadcrumb
                await EmergencyResponse.findOneAndUpdate(
                    { alertId: alert._id, helperId: req.user!._id },
                    { $push: { route: { lat: latitude, lng: longitude, timestamp: new Date() } } }
                );

                // Auto-detect arrival (within 50m)
                if (dist < 0.05) {
                    if (io) {
                        io.to(alert.donorId.toString()).emit('helper-arrived', {
                            alertId: alert._id,
                            helperId: req.user!._id,
                            helperName: req.user!.profile?.fullName,
                            arrivalTime: new Date(),
                        });
                    }
                }
            }
        }

        res.status(200).json({ status: 'success', message: 'Location updated.' });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// @desc    Get live locations for all active helpers (recent updates only)
// @route   GET /api/v1/emergency/helper/live-locations
// @access  Private
export const getLiveHelperLocations = async (req: AuthRequest, res: Response) => {
    try {
        // Only get helpers active in the last 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        
        const helpers = await HelperLocation.find({
            lastUpdated: { $gte: fifteenMinutesAgo }
        }).select('location helperId accuracy lastUpdated');

        res.status(200).json({
            status: 'success',
            results: helpers.length,
            data: { helpers }
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

export const updateEmergencySettings = async (req: AuthRequest, res: Response) => {
    try {
        const { maxDistance, alertTypes, notificationSound, quietHoursEnabled, quietHoursStart, quietHoursEnd, isAvailable } = req.body;

        const updateData: any = {};
        if (maxDistance !== undefined) updateData['emergencySettings.maxDistance'] = maxDistance;
        if (alertTypes !== undefined) updateData['emergencySettings.alertTypes'] = alertTypes;
        if (notificationSound !== undefined) updateData['emergencySettings.notificationSound'] = notificationSound;
        if (quietHoursEnabled !== undefined) updateData['emergencySettings.quietHoursEnabled'] = quietHoursEnabled;
        if (quietHoursStart !== undefined) updateData['emergencySettings.quietHoursStart'] = quietHoursStart;
        if (quietHoursEnd !== undefined) updateData['emergencySettings.quietHoursEnd'] = quietHoursEnd;
        if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

        await HelperLocation.findOneAndUpdate(
            { helperId: req.user!._id },
            { $set: updateData },
            { upsert: true, new: true }
        );

        res.status(200).json({ status: 'success', message: 'Settings updated.' });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

export const getEmergencyHistory = async (req: AuthRequest, res: Response) => {
    try {
        const responses = await EmergencyResponse.find({ helperId: req.user!._id })
            .populate('alertId', 'alertId emergencyType location.address status createdAt')
            .sort({ createdAt: -1 })
            .limit(20);

        const alerts = await EmergencyAlert.find({
            notifiedHelpers: req.user!._id,
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('alertId emergencyType status location.address createdAt acceptedBy');

        res.status(200).json({
            status: 'success',
            data: {
                responses,
                alerts,
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

export const getHelperSettings = async (req: AuthRequest, res: Response) => {
    try {
        const helperLoc = await HelperLocation.findOne({ helperId: req.user!._id });
        if (!helperLoc) {
            return res.status(200).json({
                status: 'success',
                data: {
                    isAvailable: true,
                    emergencySettings: {
                        maxDistance: 10,
                        alertTypes: ['MEDICAL', 'FIRE', 'ACCIDENT', 'PERSON_IN_DISTRESS', 'WATER', 'OTHER'],
                        notificationSound: 'loud',
                        quietHoursEnabled: false,
                    },
                },
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                isAvailable: helperLoc.isAvailable,
                emergencySettings: helperLoc.emergencySettings,
                lastUpdated: helperLoc.lastUpdated,
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
