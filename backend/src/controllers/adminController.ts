import { Response } from 'express';
import User from '../models/User';
import HelpRequest from '../models/HelpRequest';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';

// @desc    Get system-wide statistics
// @route   GET /api/v1/admin/stats
// @access  Private (Admin)
export const getAdminStats = async (req: AuthRequest, res: Response) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalRequests = await HelpRequest.countDocuments();
        const pendingVerifications = await HelpRequest.countDocuments({ status: 'under_review' });

        res.status(200).json({
            status: 'success',
            data: {
                totalUsers,
                totalRequests,
                pendingVerifications,
                activeHelpers: await User.countDocuments({ role: 'helper' })
            }
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Manual Review Approval
// @route   POST /api/v1/admin/verify/:id
// @access  Private (Admin)
export const manualVerify = async (req: AuthRequest, res: Response) => {
    try {
        const { status, notes } = req.body; // 'completed' or 'cancelled'
        const request = await HelpRequest.findById(req.params.id);

        if (!request) return res.status(404).json({ status: 'fail', message: 'Request not found' });

        request.status = status;
        await request.save();

        // Log the admin action
        await AuditLog.create({
            performedBy: req.user!._id,
            action: 'MANUAL_VERIFICATION',
            targetEntity: { type: 'HelpRequest', id: request._id },
            reason: notes,
            severity: 'medium'
        });

        res.status(200).json({ status: 'success', data: { request } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
import { grantAnnualAwards, generateDailyCertificates } from '../services/certificateService';
import ImpactChat from '../models/ImpactChat';

// @desc    Issue Government Honors to top contributors
// @route   POST /api/v1/admin/issue-awards
// @access  Private (Admin)
export const issueAwards = async (req: AuthRequest, res: Response) => {
    try {
        const year = new Date().getFullYear();
        const awards = await grantAnnualAwards(year);
        res.status(200).json({ status: 'success', message: `Successfully issued ${awards.length} honor certificates.` });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Issue Daily Champion Awards
// @route   POST /api/v1/admin/issue-daily-awards
// @access  Private (Admin)
export const issueDailyAwards = async (req: AuthRequest, res: Response) => {
    try {
        await generateDailyCertificates();
        res.status(200).json({ status: 'success', message: 'Successfully issued daily champion certificates.' });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get Detailed Leaderboard Data
// @route   GET /api/v1/admin/leaderboard
// @access  Public
export const getLeaderboardData = async (req: AuthRequest, res: Response) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const dailyDonors = await ImpactChat.aggregate([
            { $match: { createdAt: { $gte: todayStart }, status: { $in: ['amount_sent', 'help_completed'] } } },
            { $group: { _id: '$donorId', totalSent: { $sum: '$amount' } } },
            { $sort: { totalSent: -1 } },
            { $limit: 3 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { name: '$user.profile.fullName', email: '$user.email', totalSent: 1 } }
        ]);

        const dailyHelpers = await ImpactChat.aggregate([
            { $match: { createdAt: { $gte: todayStart }, status: 'help_completed' } },
            { $group: { _id: '$helperId', totalHelps: { $sum: 1 } } },
            { $sort: { totalHelps: -1 } },
            { $limit: 3 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { name: '$user.profile.fullName', email: '$user.email', totalHelps: 1 } }
        ]);

        res.status(200).json({
            status: 'success',
            data: { dailyDonors, dailyHelpers }
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private (Admin)
export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find().sort('-createdAt');
        res.status(200).json({ status: 'success', data: { users } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get all audit logs
// @route   GET /api/v1/admin/audit-logs
// @access  Private (Admin)
export const getAuditLogs = async (req: AuthRequest, res: Response) => {
    try {
        const logs = await AuditLog.find().populate('performedBy', 'profile.fullName').sort('-createdAt').limit(100);
        res.status(200).json({ status: 'success', data: { logs } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
