import { Response } from 'express';
import HelpRequest from '../models/HelpRequest';
import ImpactChat from '../models/ImpactChat';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';

// @desc    Get institution-specific dashboard statistics
// @route   GET /api/v1/institution/stats
// @access  Private (Institution)
export const getInstitutionStats = async (req: AuthRequest, res: Response) => {
    try {
        const institutionId = req.user!._id;

        // Fetch all requests by this institution
        const requests = await HelpRequest.find({ donorId: institutionId });

        const totalRaised = requests.reduce((acc, curr) => acc + (curr.amountRaised || 0), 0);
        const activeRequests = requests.filter(r => ['open', 'assigned', 'in_progress', 'funding', 'funded'].includes(r.status)).length;
        const totalViews = requests.reduce((acc, curr) => acc + (curr.views || 0), 0);
        const totalShares = requests.reduce((acc, curr) => acc + (curr.shares || 0), 0);

        // Calculate escrow (funds held for assigned/completed but not yet released tasks)
        const inEscrow = requests
            .filter(r => r.escrow && r.escrow.status === 'held')
            .reduce((acc, curr) => acc + (curr.escrow.amount || 0), 0);

        // Count unique donors and total views/shares
        const totalDonors = new Set(requests.filter(r => r.helperId).map(r => r.helperId!.toString())).size;

        res.status(200).json({
            status: 'success',
            data: {
                totalRaised,
                activeRequests,
                inEscrow,
                totalViews,
                totalShares,
                trustScore: req.user!.creditScore?.totalPoints > 1000 ? 5.0 : 4.9,
                monthlyRaised: totalRaised,
                campaignsCount: requests.length,
                totalDonors
            }
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get institution's own requests
// @route   GET /api/v1/institution/my-requests
// @access  Private (Institution)
export const getInstitutionRequests = async (req: AuthRequest, res: Response) => {
    try {
        const requests = await HelpRequest.find({ donorId: req.user!._id }).sort('-createdAt');
        res.status(200).json({
            status: 'success',
            results: requests.length,
            data: { requests }
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get messages/conversations related to institution's requests
// @route   GET /api/v1/institution/messages
// @access  Private (Institution)
export const getInstitutionMessages = async (req: AuthRequest, res: Response) => {
    try {
        const institutionId = req.user!._id;

        // Find all impact chats where the institution is either helper or donor
        const chats = await ImpactChat.find({
            $or: [
                { helperId: institutionId },
                { donorId: institutionId }
            ]
        })
            .populate('helperId', 'profile.fullName creditScore.rank')
            .populate('donorId', 'profile.fullName creditScore.rank')
            .sort('-updatedAt')
            .limit(50);

        // Transform chats into message format for the dashboard
        const messages = chats
            .filter(chat => chat.messages && chat.messages.length > 0)
            .map(chat => {
                const lastMsg = chat.messages[chat.messages.length - 1];
                const isInstitutionHelper = chat.helperId && (chat.helperId as any)._id?.toString() === String(institutionId);
                const otherParty = isInstitutionHelper ? chat.donorId : chat.helperId;
                const otherPartyName = (otherParty as any)?.profile?.fullName || 'Unknown';
                const otherPartyRank = (otherParty as any)?.creditScore?.rank || 'Bronze';

                return {
                    id: chat._id,
                    chatId: chat._id,
                    senderName: otherPartyName,
                    senderAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(otherPartyName)}`,
                    badge: `${otherPartyRank} ${isInstitutionHelper ? 'Donor' : 'Helper'}`,
                    donation: chat.amount ? `₹${chat.amount.toLocaleString()}` : 'N/A',
                    request: chat.initialPhoto ? 'Impact Chat' : 'General',
                    message: lastMsg.text,
                    time: lastMsg.createdAt,
                    unread: false,
                    totalMessages: chat.messages.length,
                    status: chat.status
                };
            });

        res.status(200).json({
            status: 'success',
            results: messages.length,
            data: { messages }
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get donors who contributed to institution's requests
// @route   GET /api/v1/institution/donors
// @access  Private (Institution)
export const getInstitutionDonors = async (req: AuthRequest, res: Response) => {
    try {
        const institutionId = req.user!._id;

        // Find all requests by this institution that have a helper assigned
        const requests = await HelpRequest.find({
            donorId: institutionId,
            helperId: { $exists: true, $ne: null }
        }).populate('helperId', 'profile.fullName email creditScore.rank creditScore.totalPoints statistics.totalHelps');

        // Get unique donors
        const donorMap = new Map<string, any>();
        requests.forEach(req => {
            if (req.helperId) {
                const helper = req.helperId as any;
                const id = helper._id?.toString() || helper.toString();
                if (!donorMap.has(id)) {
                    donorMap.set(id, {
                        id,
                        name: helper.profile?.fullName || 'Anonymous',
                        email: helper.email || '',
                        rank: helper.creditScore?.rank || 'Bronze',
                        points: helper.creditScore?.totalPoints || 0,
                        totalHelps: helper.statistics?.totalHelps || 0,
                        contributedRequests: 1
                    });
                } else {
                    donorMap.get(id).contributedRequests += 1;
                }
            }
        });

        const donors = Array.from(donorMap.values());

        res.status(200).json({
            status: 'success',
            results: donors.length,
            data: { donors }
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
