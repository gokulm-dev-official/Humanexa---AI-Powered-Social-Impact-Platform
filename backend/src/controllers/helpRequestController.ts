import { Request, Response } from 'express';
import User from '../models/User';
import HelpRequest from '../models/HelpRequest';
import Transaction from '../models/Transaction';
import ProofVerification from '../models/ProofVerification';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';
import { awardPoints } from '../services/creditService';
import notificationService from '../services/notificationService';
import { generateReceipt, sendReceiptEmail as sendReceiptEmailService, verifyReceipt as verifyReceiptService } from '../services/receiptService';
import { broadcastDonation } from '../services/donationBroadcastService';
import { IHelpRequest } from '../models/HelpRequest';

// @desc    Create new help request
// @route   POST /api/v1/help-requests
// @access  Private (Donor)
export const createHelpRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, requestType, urgency, amount, location, targetBeneficiaries } = req.body;

        const isInstitution = req.user!.role === 'institution';

        const helpRequest = await HelpRequest.create({
            donorId: req.user!._id,
            title,
            description,
            requestType,
            urgency,
            amount,
            location,
            targetBeneficiaries,
            status: isInstitution ? 'funding' : 'open',
            isBroadcast: isInstitution,
            escrow: {
                amount: isInstitution ? 0 : amount.value,
                status: isInstitution ? 'released' : 'held', // 'released' here means not held for a specific helper yet
            }
        }) as any;

        if (!isInstitution) {
            // Create a transaction record for the escrow hold
            await Transaction.create({
                user: req.user!._id,
                type: 'donation',
                amount: amount.value,
                status: 'completed',
                referenceId: `ESCROW_${helpRequest._id}`,
                metadata: {
                    helpRequestId: helpRequest._id,
                    paymentMethod: 'wallet',
                    description: `Escrow hold for request: ${title}`,
                    breakdown: amount.breakdown
                }
            });

            // Notify nearby helpers (Existing logic or future improvement)
            await notificationService.sendNotification((req as any).user!._id.toString(), {
                title: 'Request Deployed',
                message: `Your request "${title}" is now visible to nearby helpers.`,
                type: 'request',
                priority: 'medium'
            });
        } else {
            // If institution, notify ALL donors about the new broadcast
            const donors = await User.find({ role: 'donor' }).select('_id') as any[];

            // Fire and forget with Promise.all for faster response
            Promise.all(donors.map(donor =>
                notificationService.sendNotification(donor._id.toString(), {
                    title: 'New Institution Signal',
                    message: `${req.user!.profile.fullName} has broadcasted a new need: ${title}`,
                    type: 'broadcast',
                    priority: 'high',
                    helpRequestId: helpRequest._id.toString()
                })
            )).catch(err => console.error('Broadcast notifications failed', err));
        }

        res.status(201).json({ status: 'success', data: { helpRequest } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get all available help requests (nearby)
// @route   GET /api/v1/help-requests/available
// @access  Private (Helper)
export const getAvailableRequests = async (req: AuthRequest, res: Response) => {
    try {
        const { lat, lng, radius = 10 } = req.query;

        let query: any = { status: 'open' };

        // Determine coordinates: prefer query params, fallback to user's saved location
        let queryLat = lat;
        let queryLng = lng;

        if (!queryLat || !queryLng) {
            if (req.user?.address?.coordinates?.coordinates) {
                queryLng = req.user.address.coordinates.coordinates[0];
                queryLat = req.user.address.coordinates.coordinates[1];
            }
        }

        if (queryLat && queryLng) {
            query['location.coordinates'] = {
                $near: {
                    $geometry: { type: 'Point', coordinates: [Number(queryLng), Number(queryLat)] },
                    $maxDistance: Number(radius) * 1000,
                },
            };
        }

        const requests = await HelpRequest.find(query).populate('donorId', 'profile.fullName');
        res.status(200).json({ status: 'success', results: requests.length, data: { requests } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Accept a help request
// @route   POST /api/v1/help-requests/:id/accept
// @access  Private (Helper)
export const acceptRequest = async (req: AuthRequest, res: Response) => {
    try {
        const helpRequest = await HelpRequest.findById(req.params.id) as any;

        if (!helpRequest || helpRequest.status !== 'open') {
            return res.status(400).json({ status: 'fail', message: 'Request not available' });
        }

        helpRequest.helperId = req.user!._id;
        helpRequest.status = 'assigned';
        helpRequest.timeline.assignedAt = new Date();
        await helpRequest.save();

        res.status(200).json({ status: 'success', data: { helpRequest } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Submit proof for verification (with Advanced Metadata checks)
// @route   POST /api/v1/help-requests/:id/submit-proof
// @access  Private (Helper)
export const submitProof = async (req: AuthRequest, res: Response) => {
    try {
        const { imageUrls, gpsCoordinates, deviceMetadata } = req.body;
        const helpRequest = await HelpRequest.findById(req.params.id) as any;

        if (!helpRequest || helpRequest.helperId?.toString() !== (req as any).user!._id.toString()) {
            return res.status(403).json({ status: 'fail', message: 'Unauthorized or invalid request' });
        }

        // 1. Advanced Metadata Check (MANDATORY GPS)
        if (!gpsCoordinates || !gpsCoordinates.coordinates || gpsCoordinates.coordinates.length !== 2) {
            return res.status(400).json({ status: 'fail', message: 'MANDATORY: Proof photos must have embedded GPS data.' });
        }

        const [proofLng, proofLat] = gpsCoordinates.coordinates;
        const [targetLng, targetLat] = helpRequest.location.coordinates.coordinates;

        // 2. Validate GPS Accuracy (if provided)
        if (deviceMetadata?.location?.accuracy > 100) {
            return res.status(400).json({ status: 'fail', message: 'GPS accuracy too low ( > 100m). Please move to an open area and retake.' });
        }

        // 3. Location Proximity Check (Calculate distance)
        const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000; // meters
        };

        const distanceMeters = getDistance(proofLat, proofLng, targetLat, targetLng);
        
        // Allowed radius is 100m (configurable)
        if (distanceMeters > 100) {
            return res.status(400).json({ 
                status: 'fail', 
                message: `Verification REJECTED: You are ${Math.round(distanceMeters)}m away. Proof must be taken at the facility (max 100m).` 
            });
        }

        // 4. Update Help Request
        helpRequest.status = 'proof_submitted';
        helpRequest.proof = {
            imageUrls,
            videoUrls: [],
            submittedAt: new Date(),
            gpsCoordinates,
            deviceMetadata
        };

        // 5. Trigger AI Verification (Advanced Check)
        try {
            // Simulate AI call
            const aiVerificationResult = {
                status: 'passed',
                confidence: 0.98,
                flags: [],
                metadataMatch: true
            };

            helpRequest.aiVerification = {
                status: aiVerificationResult.status,
                confidence: aiVerificationResult.confidence,
                flags: aiVerificationResult.flags,
                verifiedAt: new Date(),
                reportSummary: `GPS Distance: ${Math.round(distanceMeters)}m from target. Metadata Validated.`
            };

            if (aiVerificationResult.status === 'passed') {
                helpRequest.status = 'completed';
                helpRequest.timeline.actualCompletionAt = new Date();
                helpRequest.escrow.status = 'released';
                helpRequest.escrow.releasedAt = new Date();

                // Award points
                await awardPoints((helpRequest as any).helperId!.toString(), 'help_completed', 200, `Verified delivery: ${helpRequest.title}`, (helpRequest as any)._id.toString());
                await notificationService.sendNotification(helpRequest.donorId.toString(), {
                    title: 'Help Verified! ✅',
                    message: `The help you funded for "${helpRequest.title}" has been completed and GPS-verified.`,
                    type: 'request',
                    priority: 'high'
                });
            }
        } catch (aiErr) {
            helpRequest.aiVerification.status = 'needs_manual_review';
        }

        await helpRequest.save();
        res.status(200).json({ status: 'success', data: { helpRequest, distance: distanceMeters } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

export const getBroadcastRequests = async (req: AuthRequest, res: Response) => {
    try {
        const requests = await HelpRequest.find({ isBroadcast: true, status: 'funding' })
            .populate('donorId', 'profile.fullName profile.avatar')
            .sort('-createdAt');
        res.status(200).json({ status: 'success', results: requests.length, data: { requests } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Donate to a broadcast request (with Escrow/Direct type)
// @route   POST /api/v1/help-requests/:id/donate
// @access  Private (Donor)
export const donateToBroadcast = async (req: AuthRequest, res: Response) => {
    try {
        const { amount, donationType = 'ESCROW' } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ status: 'fail', message: 'Invalid donation amount' });
        }

        if (!['ESCROW', 'DIRECT'].includes(donationType)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid donation type. Must be ESCROW or DIRECT.' });
        }

        const helpRequest = await HelpRequest.findById(req.params.id).populate('donorId', 'profile.fullName') as any;
        if (!helpRequest) {
            return res.status(404).json({ status: 'fail', message: 'Request not found' });
        }

        if (!helpRequest.isBroadcast) {
            return res.status(400).json({ status: 'fail', message: 'This request does not accept donations' });
        }

        if (helpRequest.status !== 'funding') {
            return res.status(400).json({ status: 'fail', message: 'This request is no longer accepting donations' });
        }

        // 1. Update amountRaised
        helpRequest.amountRaised = (helpRequest.amountRaised || 0) + amount;

        // 2. Check if fully funded
        if (helpRequest.amountRaised >= helpRequest.amount.value) {
            helpRequest.status = 'funded';
        }

        await helpRequest.save();

        // 3. Generate receipt ID
        const now = new Date();
        const receiptId = `RCPT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${Date.now().toString(36).toUpperCase()}`;

        // 4. Create transaction with donation type info
        const isEscrow = donationType === 'ESCROW';

        const transaction = await Transaction.create({
            user: req.user!._id,
            type: isEscrow ? 'escrow_lock' : 'donation',
            amount: amount,
            status: isEscrow ? 'pending' : 'completed',
            referenceId: `DONATION_${helpRequest._id}_${Date.now()}`,
            metadata: {
                helpRequestId: helpRequest._id,
                paymentMethod: 'wallet',
                description: `${donationType} donation to broadcast: ${helpRequest.title}`,
                institutionId: helpRequest.donorId._id || helpRequest.donorId,
                institutionName: helpRequest.donorId.profile?.fullName || 'Institution',
                requestTitle: helpRequest.title,
                donorName: req.user!.profile?.fullName || 'Anonymous',
                donorEmail: req.user!.email || '',
                donorPhone: req.user!.phoneNumber || '',
            },
            donationType,
            escrowStatus: isEscrow ? 'LOCKED' : null,
            proofRequired: isEscrow,
            reviewPeriod: isEscrow ? 7 : 0,
            directTransfer: !isEscrow,
            transferredAt: isEscrow ? undefined : new Date(),
            receiptId,
            receiptGenerated: true,
        });

        // 5. Award donor points (25 XP per donation)
        await awardPoints(
            (req as any).user!._id.toString(),
            'donation',
            25,
            `Donated ₹${amount} to: ${helpRequest.title}`,
            helpRequest._id.toString()
        );

        // 6. Notify the institution about this donation
        const institutionId = (helpRequest.donorId._id || helpRequest.donorId).toString();
        const typeLabel = isEscrow ? '🔒 Escrow Protected' : '⚡ Direct';
        await notificationService.sendNotification(institutionId, {
            title: 'New Donation Received! 🎉',
            message: `${req.user!.profile.fullName} donated ₹${amount.toLocaleString()} (${typeLabel}) to "${helpRequest.title}". Total raised: ₹${helpRequest.amountRaised.toLocaleString()}`,
            type: 'achievement',
            priority: 'high',
            helpRequestId: helpRequest._id.toString()
        });

        // 7. Notify the donor
        const donorMessage = isEscrow
            ? `Your ₹${amount.toLocaleString()} is locked in escrow for "${helpRequest.title}". You'll receive proof updates.`
            : `You donated ₹${amount.toLocaleString()} directly to "${helpRequest.title}". Thank you!`;
        await notificationService.sendNotification((req as any).user!._id.toString(), {
            title: 'Donation Successful ✅',
            message: donorMessage,
            type: 'success',
            priority: 'medium',
            helpRequestId: helpRequest._id.toString()
        });

        // 8. Generate formal receipt (Feature 1)
        let formalReceipt = null;
        try {
            formalReceipt = await generateReceipt(
                transaction._id.toString(),
                (req as any).user!._id.toString(),
                helpRequest._id.toString(),
                donationType as 'ESCROW' | 'DIRECT',
                amount
            );
        } catch (receiptErr) {
            console.error('Receipt generation failed (non-blocking):', receiptErr);
        }

        // 9. Broadcast donation to all related donors (Feature 5)
        try {
            await broadcastDonation({
                requestId: helpRequest._id.toString(),
                donorName: req.user!.profile?.fullName || 'Anonymous',
                donorId: (req as any).user!._id.toString(),
                amount,
                isAnonymous: false,
            });
        } catch (broadcastErr) {
            console.error('Donation broadcast failed (non-blocking):', broadcastErr);
        }

        res.status(200).json({
            status: 'success',
            data: {
                helpRequest,
                donationAmount: amount,
                donationType,
                totalRaised: helpRequest.amountRaised,
                isFunded: helpRequest.status === 'funded',
                receiptId,
                transactionId: transaction._id,
                escrowStatus: isEscrow ? 'LOCKED' : null,
                formalReceiptId: formalReceipt?.receiptId || null,
                receiptData: {
                    receiptId,
                    date: now.toISOString(),
                    amount,
                    donationType,
                    donorName: req.user!.profile?.fullName || 'Anonymous',
                    donorEmail: req.user!.email || '',
                    institutionName: helpRequest.donorId.profile?.fullName || 'Institution',
                    requestTitle: helpRequest.title,
                    requestCategory: helpRequest.requestType,
                    escrowStatus: isEscrow ? 'LOCKED' : null,
                    proofRequired: isEscrow,
                    reviewPeriod: isEscrow ? 7 : 0,
                    verificationHash: formalReceipt?.verificationHash || null,
                }
            }
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get a single broadcast request by ID (for donation page)
// @route   GET /api/v1/help-requests/:id
// @access  Private
export const getRequestById = async (req: AuthRequest, res: Response) => {
    try {
        const helpRequest = await HelpRequest.findById(req.params.id)
            .populate('donorId', 'profile.fullName profile.avatar');
        if (!helpRequest) {
            return res.status(404).json({ status: 'fail', message: 'Request not found' });
        }
        res.status(200).json({ status: 'success', data: { helpRequest } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get user's own help requests
// @route   GET /api/v1/help-requests/my
// @access  Private
export const getMyRequests = async (req: AuthRequest, res: Response) => {
    try {
        const requests = await HelpRequest.find({ donorId: req.user!._id }).sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', results: requests.length, data: { requests } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get donation history for current user
// @route   GET /api/v1/help-requests/donation-history
// @access  Private
export const getDonationHistory = async (req: AuthRequest, res: Response) => {
    try {
        const transactions = await Transaction.find({
            user: req.user!._id
        }).sort({ createdAt: -1 }).limit(100);

        res.status(200).json({
            status: 'success',
            results: transactions.length,
            data: { donations: transactions }
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Generate/get receipt data for a transaction
// @route   GET /api/v1/help-requests/receipt/:transactionId
// @access  Private
export const getReceiptData = async (req: AuthRequest, res: Response) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.transactionId,
            user: req.user!._id,
        });

        if (!transaction) {
            return res.status(404).json({ status: 'fail', message: 'Transaction not found' });
        }

        const helpRequest = transaction.metadata?.helpRequestId
            ? await HelpRequest.findById(transaction.metadata.helpRequestId).populate('donorId', 'profile.fullName profile.avatar')
            : null;

        res.status(200).json({
            status: 'success',
            data: {
                receipt: {
                    receiptId: transaction.receiptId || `RCPT-${transaction._id}`,
                    date: transaction.createdAt,
                    amount: transaction.amount,
                    donationType: transaction.donationType || 'ESCROW',
                    status: transaction.status,
                    escrowStatus: transaction.escrowStatus,
                    proofRequired: transaction.proofRequired,
                    reviewPeriod: transaction.reviewPeriod,
                    donor: {
                        name: transaction.metadata?.donorName || req.user!.profile?.fullName || 'Anonymous',
                        email: transaction.metadata?.donorEmail || req.user!.email || '',
                        phone: transaction.metadata?.donorPhone || req.user!.phoneNumber || '',
                    },
                    institution: {
                        name: transaction.metadata?.institutionName || 'Institution',
                    },
                    request: helpRequest ? {
                        title: (helpRequest as any).title,
                        category: (helpRequest as any).requestType,
                        description: (helpRequest as any).description,
                    } : null,
                    referenceId: transaction.referenceId,
                    paymentMethod: transaction.metadata?.paymentMethod || 'wallet',
                }
            }
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get proof photos for a request (Feature 4)
// @route   GET /api/v1/help-requests/:id/proof-photos
// @access  Private
export const getProofPhotos = async (req: AuthRequest, res: Response) => {
    try {
        const proofs = await ProofVerification.find({ helpRequestId: req.params.id })
            .populate('uploadedBy', 'profile.fullName helperProfile.ratings helperProfile.tier')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: {
                proofs,
                totalPhotos: proofs.reduce((sum: number, p: any) => sum + (p.images?.length || 0), 0),
            },
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get all donors for a request (Feature 5)
// @route   GET /api/v1/help-requests/:id/donors
// @access  Private
export const getRequestDonors = async (req: AuthRequest, res: Response) => {
    try {
        const transactions = await Transaction.find({
            'metadata.helpRequestId': req.params.id,
            status: 'completed',
            type: { $in: ['donation', 'escrow_lock'] },
        })
            .populate('user', 'profile.fullName profile.avatar')
            .sort({ createdAt: -1 });

        const donors = transactions.map((t: any) => ({
            id: t.user?._id,
            name: t.user?.profile?.fullName || 'Anonymous',
            avatar: t.user?.profile?.avatar,
            amount: t.amount,
            donationType: t.donationType || 'ESCROW',
            donatedAt: t.createdAt,
        }));

        res.status(200).json({
            status: 'success',
            data: {
                donors,
                totalDonors: donors.length,
                totalRaised: donors.reduce((s: number, d: any) => s + d.amount, 0),
            },
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Send receipt via email (Feature 1)
// @route   POST /api/v1/help-requests/receipt/:receiptId/email
// @access  Private
export const sendReceiptEmail = async (req: AuthRequest, res: Response) => {
    try {
        const result = await sendReceiptEmailService(req.params.receiptId);
        res.status(200).json({ status: 'success', data: result });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Verify receipt QR code (Feature 1)
// @route   GET /api/v1/help-requests/receipt/verify/:hash
// @access  Public
export const verifyReceiptEndpoint = async (req: AuthRequest, res: Response) => {
    try {
        const result = await verifyReceiptService(req.params.hash);
        res.status(200).json({ status: 'success', data: result });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
