import { Response } from 'express';
import axios from 'axios';
import ImpactChat from '../models/ImpactChat';
import Transaction from '../models/Transaction';
import User from '../models/User';
import NotificationService from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';
import { getIo } from '../socket';
import { v4 as uuidv4 } from 'uuid';
import { awardPoints } from '../services/creditService';
import { analyzeForDeepfake, quickAuthenticityCheck } from '../services/deepfakeDetectionService';

// @desc    Helper posts a need with a photo
// @route   POST /api/v1/impact-chat/post-need
export const postNeed = async (req: AuthRequest, res: Response) => {
    try {
        const { initialPhoto, location, paymentInfo, splitMode, targetAmount, photoMetadata } = req.body;

        // Validate photo if metadata provided
        if (photoMetadata) {
            const authCheck = quickAuthenticityCheck(photoMetadata);
            if (!authCheck.passed) {
                return res.status(400).json({ status: 'fail', message: authCheck.reason });
            }
            const deepfakeResult = analyzeForDeepfake(photoMetadata);
            if (!deepfakeResult.isAuthentic) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Photo appears to be AI-generated or manipulated. Only original photos are accepted.',
                    data: { flags: deepfakeResult.flags, confidence: deepfakeResult.confidence }
                });
            }
        }

        const chat = await ImpactChat.create({
            helperId: req.user!._id,
            initialPhoto,
            location,
            paymentInfo,
            status: 'need_posted',
            splitMode: !!splitMode,
            targetAmount: splitMode ? (targetAmount || 0) : 0,
            receivedAmount: 0,
            donorContributions: [],
        });

        const io = getIo();
        if (io) {
            io.emit('impact:new-need', chat);
            NotificationService.broadcast({
                text: splitMode
                    ? `New Split Signal: ₹${targetAmount} needed — contribute any amount to help!`
                    : `New Impact Signal: A helper identified a critical need near them.`,
                type: 'info',
                metadata: { chatId: chat._id }
            });
        }

        res.status(201).json({ status: 'success', data: { chat } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Donor views and sends amount
// @route   POST /api/v1/impact-chat/:id/send-amount
export const sendAmount = async (req: AuthRequest, res: Response) => {
    try {
        const { amount, donationType } = req.body;
        const chat = await ImpactChat.findById(req.params.id);

        if (!chat) {
            return res.status(400).json({ status: 'fail', message: 'Chat not found' });
        }

        // --- SPLIT MODE HANDLING ---
        if (chat.splitMode) {
            if (chat.status === 'help_completed') {
                return res.status(400).json({ status: 'fail', message: 'This need has already been fulfilled' });
            }

            // Add donor contribution
            if (!chat.donorContributions) chat.donorContributions = [] as any;
            (chat.donorContributions as any[]).push({
                donorId: req.user!._id,
                amount,
                donationType: donationType || 'ESCROW',
                donatedAt: new Date(),
            });

            // Update tracking
            chat.receivedAmount = (chat.receivedAmount || 0) + amount;
            chat.amount = (chat.amount || 0) + amount; // Cumulative total

            // If first donor, set as primary donorId
            if (!chat.donorId) {
                chat.donorId = req.user!._id as any;
            }

            // Check if target reached
            if (chat.targetAmount && (chat.receivedAmount || 0) >= chat.targetAmount) {
                chat.status = 'amount_sent';
                chat.fundedAt = new Date();
                if (donationType === 'ESCROW') {
                    chat.countdownDeadline = new Date(Date.now() + 30 * 60 * 1000);
                }
            } else {
                // Keep status as need_posted so more donors can contribute
                chat.status = 'need_posted';
            }

            (chat as any).donationType = donationType || 'ESCROW';
            await chat.save();

            // Create Transaction for this split contribution
            await Transaction.create({
                user: req.user!._id,
                type: donationType === 'DIRECT' ? 'donation' : 'escrow_lock',
                amount,
                status: 'completed',
                referenceId: `${donationType === 'DIRECT' ? 'DIR' : 'ESC'}-SPLIT-${uuidv4()}`,
                donationType: donationType || 'ESCROW',
                metadata: {
                    chatId: chat._id,
                    reason: `Split Donation Contribution`,
                    splitMode: true,
                    targetAmount: chat.targetAmount,
                    receivedAmount: chat.receivedAmount,
                    beneficiaryName: chat.helperId ? (await User.findById(chat.helperId))?.profile?.fullName : 'Citizen',
                    donorName: req.user!.profile?.fullName || 'Anonymous Donor',
                }
            });

            // Award points to the donor
            await awardPoints((req.user!._id as any).toString(), 'donation', 30, `Split donation of ₹${amount}`);

            const ioInstance = getIo();
            if (ioInstance) {
                ioInstance.emit('impact:amount-received', chat);
                NotificationService.sendSignal(chat.helperId.toString(), {
                    text: `Split Contribution: ₹${amount} received! Total: ₹${chat.receivedAmount}/${chat.targetAmount}`,
                    type: 'success',
                    metadata: { chatId: chat._id }
                });
            }

            return res.status(200).json({ status: 'success', data: { chat } });
        }

        // --- NORMAL (NON-SPLIT) MODE ---
        if (chat.status !== 'need_posted') {
            return res.status(400).json({ status: 'fail', message: 'Chat interaction invalid' });
        }

        chat.donorId = req.user!._id as any;
        chat.amount = amount;
        chat.status = 'amount_sent';
        chat.fundedAt = new Date();
        
        if (donationType === 'ESCROW') {
            chat.countdownDeadline = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
        } else {
            chat.countdownDeadline = undefined; // No deadline for direct
        }
        
        // Save donation type for history
        (chat as any).donationType = donationType || 'ESCROW';
        
        await chat.save();

        // Create Transaction
        await Transaction.create({
            user: req.user!._id,
            type: donationType === 'DIRECT' ? 'donation' : 'escrow_lock',
            amount,
            status: 'completed',
            referenceId: `${donationType === 'DIRECT' ? 'DIR' : 'ESC'}-${uuidv4()}`,
            donationType: donationType || 'ESCROW',
            metadata: { 
                chatId: chat._id, 
                reason: `Impact Assistance for Live Signal`,
                beneficiaryName: chat.helperId ? (await User.findById(chat.helperId))?.profile?.fullName : 'Citizen',
                donorName: req.user!.profile?.fullName || 'Anonymous Donor'
            }
        });

        // Award points to the donor
        await awardPoints((req.user!._id as any).toString(), 'donation', 50, `Donation of ₹${amount}`);

        const ioInstance = getIo();
        if (ioInstance) {
            ioInstance.to(chat.helperId.toString()).emit('impact:amount-received', chat);
            NotificationService.sendSignal(chat.helperId.toString(), {
                text: `Authorization Received: A donor has locked ₹${amount} in escrow for your need.`,
                type: 'success',
                metadata: { chatId: chat._id }
            });
        }

        res.status(200).json({ status: 'success', data: { chat } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Helper sends helping photo (completion)
// @route   POST /api/v1/impact-chat/:id/complete
export const completeImpact = async (req: AuthRequest, res: Response) => {
    try {
        const { finalPhoto, adminApproved, adminRejected, refund } = req.body;
        const chat = await ImpactChat.findById(req.params.id);

        if (!chat) {
            return res.status(404).json({ status: 'fail', message: 'Chat not found' });
        }

        // FLOW 1: Helper submits proof photo
        if (finalPhoto && !adminApproved) {
            if (chat.status !== 'amount_sent' || (chat.helperId as any).toString() !== (req.user!._id as any).toString()) {
                return res.status(400).json({ status: 'fail', message: 'Unauthorized or invalid status' });
            }

            // Check if countdown expired
            if (chat.countdownDeadline && new Date() > chat.countdownDeadline) {
                return res.status(400).json({ status: 'fail', message: 'Assistance window (30m) has expired. Fund will be refunded.' });
            }

            chat.finalPhoto = finalPhoto;
            chat.status = 'proof_submitted' as any;

            // AI Verification
            try {
                const aiRes = await axios.post('http://localhost:8000/api/v1/verification/verify-url', {
                    image_url: finalPhoto
                });
                chat.aiVerification = {
                    status: aiRes.data.status,
                    confidence: aiRes.data.confidence,
                    verifiedAt: new Date(),
                    report: aiRes.data.report
                };
            } catch (err) {
                console.error('AI Service Error:', err);
                chat.aiVerification = {
                    status: 'needs_manual_review',
                    confidence: 0,
                    verifiedAt: new Date(),
                    report: { error: 'Service Unavailable' }
                };
            }

            await chat.save();

            // Notify admin and donor
            const io = getIo();
            if (io && chat.donorId) {
                io.to((chat.donorId as any).toString()).emit('impact:proof_submitted', chat);
                NotificationService.sendSignal((chat.donorId as any).toString(), {
                    text: `Proof submitted by helper. Awaiting admin approval for fund release.`,
                    type: 'info',
                    metadata: { chatId: chat._id }
                });
            }

            return res.status(200).json({ status: 'success', message: 'Proof submitted. Awaiting admin approval.', data: { chat } });
        }

        // FLOW 2: Admin approves and releases funds
        if (adminApproved) {
            const user = req.user!;
            if (user.role !== 'admin' && user.role !== 'super_admin') {
                // Also allow if hardcoded admin email
                if (user.email !== 'gokulpersonal64@gmail.com') {
                    return res.status(403).json({ status: 'fail', message: 'Admin access required' });
                }
            }

            if (chat.status !== 'proof_submitted' && chat.status !== 'amount_sent') {
                return res.status(400).json({ status: 'fail', message: 'Invalid status for approval. Current: ' + chat.status });
            }

            chat.status = 'help_completed';
            await chat.save();

            if (chat.donorId) {
                // Record release and payout
                await Transaction.create({
                    user: chat.donorId as any,
                    type: 'escrow_release',
                    amount: chat.amount,
                    status: 'completed',
                    referenceId: `REL-${uuidv4()}`,
                    metadata: { 
                        chatId: chat._id, 
                        reason: `Admin Approved Release for Impact Chat`,
                        beneficiaryName: (await User.findById(chat.helperId))?.profile?.fullName || 'Citizen'
                    }
                });
                await Transaction.create({
                    user: chat.helperId,
                    type: 'payout',
                    amount: chat.amount,
                    status: 'completed',
                    referenceId: `PAY-${uuidv4()}`,
                    metadata: { 
                        chatId: chat._id, 
                        reason: `Admin Approved Impact Reward Payment`,
                        donorName: (await User.findById(chat.donorId))?.profile?.fullName || 'Anonymous'
                    }
                });

                // UPDATE USER METRICS
                const helper = await User.findById(chat.helperId);
                const donor = await User.findById(chat.donorId);

                if (helper) {
                    helper.statistics.totalHelps += 1;
                    await helper.save();
                    await awardPoints(chat.helperId.toString(), 'help_completed', 120, 'Impact Signal completed — admin verified');
                }

                if (donor) {
                    donor.statistics.totalDonations += 1;
                    await donor.save();
                    await awardPoints((chat.donorId as any).toString(), 'donation', 50, 'Impact donation verified — admin released');
                }
            }

            const io = getIo();
            if (io) {
                if (chat.donorId) {
                    io.to((chat.donorId as any).toString()).emit('impact:completed', chat);
                    NotificationService.sendSignal((chat.donorId as any).toString(), {
                        text: `Admin Approved: Funds released to helper successfully.`,
                        type: 'success',
                        metadata: { chatId: chat._id }
                    });
                }
                if (chat.helperId) {
                    io.to(chat.helperId.toString()).emit('impact:completed', chat);
                    NotificationService.sendSignal(chat.helperId.toString(), {
                        text: `Payment released! Your impact proof has been approved.`,
                        type: 'success',
                        metadata: { chatId: chat._id }
                    });
                }
            }

            return res.status(200).json({ status: 'success', message: 'Funds released to helper.', data: { chat } });
        }

        // FLOW 3: Admin rejects and refunds
        if (adminRejected || refund) {
            const user = req.user!;
            if (user.role !== 'admin' && user.role !== 'super_admin') {
                if (user.email !== 'gokulpersonal64@gmail.com') {
                    return res.status(403).json({ status: 'fail', message: 'Admin access required' });
                }
            }

            chat.status = 'refunded' as any;
            await chat.save();

            if (chat.donorId) {
                await Transaction.create({
                    user: chat.donorId as any,
                    type: 'refund',
                    amount: chat.amount,
                    status: 'completed',
                    referenceId: `RFD-${uuidv4()}`,
                    metadata: { 
                        chatId: chat._id, 
                        reason: `Admin rejected proof — refund issued`
                    }
                });
            }

            const io = getIo();
            if (io && chat.donorId) {
                io.to((chat.donorId as any).toString()).emit('impact:refunded', chat);
                NotificationService.sendSignal((chat.donorId as any).toString(), {
                    text: `Proof rejected by admin. Funds have been refunded to your wallet.`,
                    type: 'warning',
                    metadata: { chatId: chat._id }
                });
            }

            return res.status(200).json({ status: 'success', message: 'Funds refunded to donor.', data: { chat } });
        }

        return res.status(400).json({ status: 'fail', message: 'Invalid request. Provide finalPhoto or adminApproved.' });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get active impact chats
// @route   GET /api/v1/impact-chat/active
export const getActiveChats = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.email === 'gokulpersonal64@gmail.com';
        
        let query: any;
        if (isAdmin) {
            // Admin sees all chats
            query = {};
        } else {
            query = {
                $or: [{ status: 'need_posted' }, { helperId: user._id }, { donorId: user._id }]
            };
        }

        const chats = await ImpactChat.find(query).populate('helperId donorId', 'profile.fullName email');

        res.status(200).json({ status: 'success', data: { chats } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Send text message
// @route   POST /api/v1/impact-chat/:id/message
export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { text } = req.body;
        const chat = await ImpactChat.findById(req.params.id);

        if (!chat) {
            return res.status(404).json({ status: 'fail', message: 'Chat not found' });
        }

        let recipientId;
        if ((req.user!._id as any).toString() === chat.helperId.toString()) {
            recipientId = chat.donorId;
        } else {
            recipientId = chat.helperId;
        }

        const newMessage = {
            senderId: req.user!._id,
            text,
            createdAt: new Date()
        };

        chat.messages.push(newMessage as any);
        await chat.save();

        const ioInstance = getIo();
        if (ioInstance && recipientId) {
            ioInstance.to(recipientId.toString()).emit('impact:new-message', { chatId: chat._id, message: newMessage });

            // Trigger a formal notification for the recipient
            NotificationService.sendSignal(recipientId.toString(), {
                text: `Message from ${req.user!.profile.fullName}: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
                type: 'info',
                metadata: { chatId: chat._id }
            });
        }

        res.status(200).json({ status: 'success', data: { message: newMessage } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get donation history for current user
// @route   GET /api/v1/impact-chat/donation-history
export const getDonationHistory = async (req: AuthRequest, res: Response) => {
    try {
        // Get all transactions for this user
        const transactions = await Transaction.find({
            user: req.user!._id,
            type: { $in: ['donation', 'escrow_lock'] },
            status: { $in: ['completed', 'refunded'] },
        })
            .sort({ createdAt: -1 })
            .lean();

        // Enrich with beneficiary info from chat
        const enriched = await Promise.all(
            transactions.map(async (txn: any) => {
                let beneficiaryName = txn.metadata?.beneficiaryName || 'Unknown';
                let chatStatus = 'unknown';
                let initialPhoto = '';

                if (txn.metadata?.chatId) {
                    try {
                        const chat = await ImpactChat.findById(txn.metadata.chatId)
                            .populate('helperId', 'profile.fullName profile.avatar')
                            .lean();
                        if (chat) {
                            beneficiaryName = (chat.helperId as any)?.profile?.fullName || beneficiaryName;
                            chatStatus = chat.status;
                            initialPhoto = chat.initialPhoto || '';
                        }
                    } catch {}
                }

                // Generate receipt ID if not present
                const receiptId = txn.receiptId || `RCP-${txn.referenceId?.substring(0, 12) || txn._id.toString().substring(0, 8)}`;

                return {
                    _id: txn._id,
                    amount: txn.amount,
                    donationType: txn.donationType || 'ESCROW',
                    status: txn.status,
                    referenceId: txn.referenceId,
                    receiptId,
                    beneficiaryName,
                    chatStatus,
                    initialPhoto,
                    splitMode: txn.metadata?.splitMode || false,
                    targetAmount: txn.metadata?.targetAmount,
                    receivedAmount: txn.metadata?.receivedAmount,
                    donorName: txn.metadata?.donorName || req.user!.profile?.fullName,
                    createdAt: txn.createdAt,
                };
            })
        );

        res.status(200).json({
            status: 'success',
            data: {
                donations: enriched,
                totalDonated: enriched.reduce((sum, d) => sum + (d.status === 'completed' ? d.amount : 0), 0),
                totalCount: enriched.length,
            },
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
