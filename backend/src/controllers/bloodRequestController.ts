import { Response } from 'express';
import BloodRequest from '../models/BloodRequest';
import User from '../models/User';
import NotificationService from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';
import { getIo } from '../socket';

// Compatible blood groups for receiving
const compatibleDonors: Record<string, string[]> = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-'],
};

// @desc    Create blood request
// @route   POST /api/v1/blood-request
export const createBloodRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { bloodGroup, urgency, unitsNeeded, hospitalName, contactNumber, description, location } = req.body;

        if (!bloodGroup || !hospitalName || !contactNumber) {
            return res.status(400).json({ status: 'fail', message: 'bloodGroup, hospitalName and contactNumber are required' });
        }

        // Use provided location, or fallback to user's profile location
        let requestLocation = location;
        if (!requestLocation || !requestLocation.coordinates || requestLocation.coordinates.every((c: number) => c === 0)) {
            const userDoc = await User.findById(req.user!._id);
            if (userDoc?.address?.coordinates?.coordinates) {
                requestLocation = {
                    type: 'Point',
                    coordinates: userDoc.address.coordinates.coordinates,
                    address: userDoc.address.formattedAddress || hospitalName,
                };
            } else {
                // No location at all — still create request but can't auto-match nearby
                requestLocation = {
                    type: 'Point',
                    coordinates: [0, 0],
                    address: hospitalName,
                };
            }
        }

        const request = await BloodRequest.create({
            requesterId: req.user!._id,
            bloodGroup,
            urgency: urgency || 'urgent',
            unitsNeeded: unitsNeeded || 1,
            hospitalName,
            contactNumber,
            description,
            location: requestLocation,
        });

        // Find nearby users with compatible blood groups
        // Use BOTH geo-indexed search AND profile-location-based search
        const compatibleGroups = compatibleDonors[bloodGroup] || [bloodGroup];
        
        let nearbyDonors: any[] = [];

        // Strategy 1: Geo-indexed search (users who have coordinates saved)
        if (requestLocation.coordinates[0] !== 0 || requestLocation.coordinates[1] !== 0) {
            try {
                nearbyDonors = await User.find({
                    'profile.bloodGroup': { $in: compatibleGroups },
                    _id: { $ne: req.user!._id },
                    'address.coordinates': {
                        $near: {
                            $geometry: {
                                type: 'Point',
                                coordinates: requestLocation.coordinates,
                            },
                            $maxDistance: 25000, // 25km radius
                        },
                    },
                }).limit(50);
            } catch (geoErr) {
                // Geospatial index might not exist or no users with coordinates
                console.log('Geo search failed, falling back to all compatible users:', geoErr);
            }
        }

        // Strategy 2: If geo search returned 0 results, find ALL compatible users
        if (nearbyDonors.length === 0) {
            nearbyDonors = await User.find({
                'profile.bloodGroup': { $in: compatibleGroups },
                _id: { $ne: req.user!._id },
            }).limit(50);
        }

        // Notify nearby compatible donors
        const io = getIo();
        for (const donor of nearbyDonors) {
            if (io) {
                NotificationService.sendSignal((donor as any)._id.toString(), {
                    text: `🩸 URGENT: ${bloodGroup} blood needed at ${hospitalName}. You're a compatible donor nearby!`,
                    type: 'warning',
                    metadata: { bloodRequestId: request._id, type: 'blood_request' },
                });
            }
        }

        res.status(201).json({
            status: 'success',
            data: {
                request,
                notifiedDonors: nearbyDonors.length,
            },
        });
    } catch (err: any) {
        console.error('Create blood request error:', err);
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get nearby blood requests matching user's blood group
// @route   GET /api/v1/blood-request/nearby
export const getNearbyBloodRequests = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user!._id);
        const userBloodGroup = user?.profile?.bloodGroup;

        let filter: any = { 
            status: 'active',
            // IMPORTANT: Exclude user's OWN requests
            requesterId: { $ne: req.user!._id },
        };

        // If user has blood group, show requests where they could donate
        if (userBloodGroup) {
            const canDonateTo: string[] = [];
            for (const [receiverGroup, donors] of Object.entries(compatibleDonors)) {
                if (donors.includes(userBloodGroup)) {
                    canDonateTo.push(receiverGroup);
                }
            }
            filter.bloodGroup = { $in: canDonateTo };
        }

        // Sort by urgency and proximity
        const requests = await BloodRequest.find(filter)
            .populate('requesterId', 'profile.fullName profile.avatar')
            .populate('respondents.donorId', 'profile.fullName')
            .sort({ urgency: -1, createdAt: -1 })
            .limit(20);

        res.status(200).json({ status: 'success', data: { requests } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get my blood requests
// @route   GET /api/v1/blood-request/my
export const getMyBloodRequests = async (req: AuthRequest, res: Response) => {
    try {
        const requests = await BloodRequest.find({ requesterId: req.user!._id })
            .populate('respondents.donorId', 'profile.fullName profile.avatar profile.bloodGroup')
            .sort({ createdAt: -1 });

        res.status(200).json({ status: 'success', data: { requests } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Respond to blood request (offer to donate)
// @route   POST /api/v1/blood-request/:id/respond
export const respondToBloodRequest = async (req: AuthRequest, res: Response) => {
    try {
        const request = await BloodRequest.findById(req.params.id);
        if (!request || request.status !== 'active') {
            return res.status(404).json({ status: 'fail', message: 'Request not found or no longer active' });
        }

        // PREVENT self-response: user cannot accept their own blood request
        if ((request.requesterId as any).toString() === (req.user!._id as any).toString()) {
            return res.status(400).json({ status: 'fail', message: 'You cannot respond to your own blood request' });
        }

        // Check if already responded
        const alreadyResponded = request.respondents.some(
            (r) => (r.donorId as any).toString() === (req.user!._id as any).toString()
        );
        if (alreadyResponded) {
            return res.status(400).json({ status: 'fail', message: 'You have already responded to this request' });
        }

        request.respondents.push({
            donorId: req.user!._id as any,
            status: 'offered',
            respondedAt: new Date(),
            contactShared: false,
        });
        await request.save();

        // Notify requester
        NotificationService.sendSignal((request.requesterId as any).toString(), {
            text: `🩸 A compatible blood donor has offered to help! Check your blood request.`,
            type: 'success',
            metadata: { bloodRequestId: request._id, type: 'blood_response' },
        });

        res.status(200).json({ status: 'success', data: { request } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Accept a respondent and share contact
// @route   POST /api/v1/blood-request/:id/accept/:donorId
export const acceptRespondent = async (req: AuthRequest, res: Response) => {
    try {
        const request = await BloodRequest.findById(req.params.id);
        if (!request || (request.requesterId as any).toString() !== (req.user!._id as any).toString()) {
            return res.status(403).json({ status: 'fail', message: 'Not authorized' });
        }

        const respondent = request.respondents.find(
            (r) => (r.donorId as any).toString() === req.params.donorId
        );
        if (!respondent) {
            return res.status(404).json({ status: 'fail', message: 'Respondent not found' });
        }

        respondent.status = 'accepted';
        respondent.contactShared = true;
        await request.save();

        // Notify donor that they're accepted
        NotificationService.sendSignal(req.params.donorId, {
            text: `✅ Your blood donation offer has been accepted! Contact: ${request.contactNumber}, Hospital: ${request.hospitalName}`,
            type: 'success',
            metadata: {
                bloodRequestId: request._id,
                contactNumber: request.contactNumber,
                hospitalName: request.hospitalName,
                type: 'blood_accepted',
            },
        });

        res.status(200).json({
            status: 'success',
            data: {
                request,
                donorContact: {
                    contactNumber: request.contactNumber,
                    hospitalName: request.hospitalName,
                },
            },
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Mark blood request as fulfilled
// @route   POST /api/v1/blood-request/:id/fulfill
export const fulfillBloodRequest = async (req: AuthRequest, res: Response) => {
    try {
        const request = await BloodRequest.findById(req.params.id);
        if (!request || (request.requesterId as any).toString() !== (req.user!._id as any).toString()) {
            return res.status(403).json({ status: 'fail', message: 'Not authorized' });
        }

        request.status = 'fulfilled';
        request.fulfilledAt = new Date();
        await request.save();

        // Award points to completed donors
        const { awardPoints } = await import('../services/creditService');
        for (const respondent of request.respondents) {
            if (respondent.status === 'accepted' || respondent.status === 'completed') {
                await awardPoints((respondent.donorId as any).toString(), 'help_completed', 150, 'Blood donation completed');
            }
        }

        res.status(200).json({ status: 'success', data: { request } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
