import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import HelperRating from '../models/HelperRating';
import User from '../models/User';
import NotificationService from '../services/notificationService';
import { getIo } from '../socket';

function calculateWeightedScore(scores: {
    punctuality: number;
    photoQuality: number;
    professionalism: number;
    accuracy: number;
}): number {
    return Math.round(
        (scores.punctuality * 0.25 +
            scores.photoQuality * 0.30 +
            scores.professionalism * 0.20 +
            scores.accuracy * 0.25) * 10
    ) / 10;
}

// POST /api/v1/ratings/
export const submitRating = async (req: AuthRequest, res: Response) => {
    try {
        const {
            helperId,
            requestId,
            taskId,
            scores,
            comment,
            isPublic,
            taskCompletionTime,
            photoCount,
            wasOnTime,
        } = req.body;

        if (!helperId || !scores) {
            return res.status(400).json({ status: 'fail', message: 'helperId and scores are required.' });
        }

        if (!scores.punctuality || !scores.photoQuality || !scores.professionalism || !scores.accuracy) {
            return res.status(400).json({
                status: 'fail',
                message: 'All score fields required: punctuality, photoQuality, professionalism, accuracy.',
            });
        }

        // Check if already rated
        const existing = await HelperRating.findOne({
            helperId,
            ratedBy: req.user!._id,
            requestId,
        });
        if (existing) {
            return res.status(400).json({ status: 'fail', message: 'You have already rated this helper for this request.' });
        }

        const weightedScore = calculateWeightedScore(scores);

        const rating = await HelperRating.create({
            helperId,
            ratedBy: req.user!._id,
            raterRole: req.user!.role as 'donor' | 'institution' | 'admin',
            requestId,
            taskId,
            scores: {
                overall: Math.round(weightedScore),
                punctuality: scores.punctuality,
                photoQuality: scores.photoQuality,
                professionalism: scores.professionalism,
                accuracy: scores.accuracy,
            },
            weightedScore,
            comment: comment?.substring(0, 500),
            isPublic: isPublic || false,
            taskCompletionTime,
            photoCount,
            wasOnTime: wasOnTime !== false,
        });

        // Recalculate helper's aggregate rating
        const allRatings = await HelperRating.find({ helperId });
        const avgPunctuality = allRatings.reduce((s, r) => s + r.scores.punctuality, 0) / allRatings.length;
        const avgPhotoQuality = allRatings.reduce((s, r) => s + r.scores.photoQuality, 0) / allRatings.length;
        const avgProfessionalism = allRatings.reduce((s, r) => s + r.scores.professionalism, 0) / allRatings.length;
        const avgAccuracy = allRatings.reduce((s, r) => s + r.scores.accuracy, 0) / allRatings.length;
        const overallAvg = allRatings.reduce((s, r) => s + r.weightedScore, 0) / allRatings.length;

        await User.findByIdAndUpdate(helperId, {
            'helperProfile.ratings.overall': Math.round(overallAvg * 10) / 10,
            'helperProfile.ratings.punctuality': Math.round(avgPunctuality * 10) / 10,
            'helperProfile.ratings.photoQuality': Math.round(avgPhotoQuality * 10) / 10,
            'helperProfile.ratings.professionalism': Math.round(avgProfessionalism * 10) / 10,
            'helperProfile.ratings.accuracy': Math.round(avgAccuracy * 10) / 10,
            'helperProfile.ratings.count': allRatings.length,
        });

        // Notify helper
        const io = getIo();
        if (io) {
            io.to(helperId).emit('rating-received', {
                rating: weightedScore,
                from: req.user!.profile?.fullName || 'Donor',
                comment,
            });
        }

        await NotificationService.sendNotification(helperId, {
            title: `⭐ New Rating: ${weightedScore}/5`,
            message: `${req.user!.profile?.fullName || 'A donor'} rated your verification ${weightedScore}/5.${comment ? ` "${comment}"` : ''}`,
            type: 'achievement',
            priority: 'medium',
        });

        res.status(201).json({ status: 'success', data: { rating } });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// GET /api/v1/ratings/helper/:helperId
export const getHelperRatings = async (req: AuthRequest, res: Response) => {
    try {
        const { helperId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const ratings = await HelperRating.find({ helperId, isPublic: true })
            .populate('ratedBy', 'profile.fullName')
            .populate('requestId', 'title')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await HelperRating.countDocuments({ helperId, isPublic: true });

        res.status(200).json({
            status: 'success',
            data: { ratings, total, page, pages: Math.ceil(total / limit) },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// GET /api/v1/ratings/helper/:helperId/summary
export const getHelperRatingSummary = async (req: AuthRequest, res: Response) => {
    try {
        const { helperId } = req.params;

        const allRatings = await HelperRating.find({ helperId });
        if (allRatings.length === 0) {
            return res.status(200).json({
                status: 'success',
                data: {
                    overall: 0,
                    count: 0,
                    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                    averages: { punctuality: 0, photoQuality: 0, professionalism: 0, accuracy: 0 },
                },
            });
        }

        const breakdown: any = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        allRatings.forEach((r) => {
            const rounded = Math.round(r.weightedScore);
            if (breakdown[rounded] !== undefined) breakdown[rounded]++;
        });

        const overall = allRatings.reduce((s, r) => s + r.weightedScore, 0) / allRatings.length;

        res.status(200).json({
            status: 'success',
            data: {
                overall: Math.round(overall * 10) / 10,
                count: allRatings.length,
                breakdown,
                averages: {
                    punctuality: Math.round((allRatings.reduce((s, r) => s + r.scores.punctuality, 0) / allRatings.length) * 10) / 10,
                    photoQuality: Math.round((allRatings.reduce((s, r) => s + r.scores.photoQuality, 0) / allRatings.length) * 10) / 10,
                    professionalism: Math.round((allRatings.reduce((s, r) => s + r.scores.professionalism, 0) / allRatings.length) * 10) / 10,
                    accuracy: Math.round((allRatings.reduce((s, r) => s + r.scores.accuracy, 0) / allRatings.length) * 10) / 10,
                },
                onTimePercentage: Math.round((allRatings.filter((r) => r.wasOnTime).length / allRatings.length) * 100),
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// GET /api/v1/ratings/my
export const getMyRatings = async (req: AuthRequest, res: Response) => {
    try {
        const ratings = await HelperRating.find({ ratedBy: req.user!._id })
            .populate('helperId', 'profile.fullName')
            .populate('requestId', 'title')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({ status: 'success', data: { ratings } });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
