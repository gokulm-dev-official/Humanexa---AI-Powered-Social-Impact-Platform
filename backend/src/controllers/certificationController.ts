import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import HelperCertification from '../models/HelperCertification';
import HelperRating from '../models/HelperRating';
import VerificationTask from '../models/VerificationTask';
import User from '../models/User';

// GET /api/v1/certification/status
export const getCertificationStatus = async (req: AuthRequest, res: Response) => {
    try {
        let cert = await HelperCertification.findOne({ helperId: req.user!._id });

        if (!cert) {
            cert = await HelperCertification.create({
                helperId: req.user!._id,
                currentTier: 'NONE',
            });
        }

        // Fetch real-time stats
        const user = await User.findById(req.user!._id);
        const totalTasks = await VerificationTask.countDocuments({ helperId: req.user!._id });
        const completedTasks = await VerificationTask.countDocuments({
            helperId: req.user!._id,
            status: 'COMPLETED_ON_TIME',
        });
        const expiredTasks = await VerificationTask.countDocuments({
            helperId: req.user!._id,
            status: 'EXPIRED',
        });
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const ratingCount = await HelperRating.countDocuments({ helperId: req.user!._id });
        const avgRating = ratingCount > 0
            ? (await HelperRating.aggregate([
                { $match: { helperId: req.user!._id } },
                { $group: { _id: null, avg: { $avg: '$weightedScore' } } },
            ]))?.[0]?.avg || 0
            : 0;

        res.status(200).json({
            status: 'success',
            data: {
                certification: cert,
                stats: {
                    totalTasks,
                    completedTasks,
                    expiredTasks,
                    completionRate,
                    avgRating: Math.round(avgRating * 10) / 10,
                    ratingCount,
                    idVerified: user?.verificationStatus?.idVerified || false,
                    backgroundCheckPassed: user?.verificationStatus?.backgroundCheckPassed || false,
                },
                eligibility: {
                    verified: {
                        eligible: (user?.verificationStatus?.idVerified || false) &&
                            completedTasks >= 5 &&
                            avgRating >= 4.0,
                        requirements: {
                            idVerified: { required: true, met: user?.verificationStatus?.idVerified || false },
                            tasksCompleted: { required: 5, current: completedTasks, met: completedTasks >= 5 },
                            rating: { required: 4.0, current: Math.round(avgRating * 10) / 10, met: avgRating >= 4.0 },
                        },
                    },
                    premium: {
                        eligible: completedTasks >= 25 && avgRating >= 4.5 && completionRate >= 95,
                        requirements: {
                            tasksCompleted: { required: 25, current: completedTasks, met: completedTasks >= 25 },
                            rating: { required: 4.5, current: Math.round(avgRating * 10) / 10, met: avgRating >= 4.5 },
                            completionRate: { required: 95, current: completionRate, met: completionRate >= 95 },
                            trainingCompleted: { required: true, met: cert.premium?.trainingProgress?.overallProgress === 100 },
                        },
                    },
                    elite: {
                        eligible: completedTasks >= 100 && avgRating >= 4.8 && completionRate >= 98,
                        requirements: {
                            tasksCompleted: { required: 100, current: completedTasks, met: completedTasks >= 100 },
                            rating: { required: 4.8, current: Math.round(avgRating * 10) / 10, met: avgRating >= 4.8 },
                            completionRate: { required: 98, current: completionRate, met: completionRate >= 98 },
                            premiumMonths: { required: 6, current: cert.elite?.requirements?.premiumMonths || 0, met: (cert.elite?.requirements?.premiumMonths || 0) >= 6 },
                        },
                    },
                },
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// POST /api/v1/certification/apply/:tier
export const applyForTier = async (req: AuthRequest, res: Response) => {
    try {
        const { tier } = req.params;
        if (!['VERIFIED', 'PREMIUM', 'ELITE'].includes(tier)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid tier.' });
        }

        let cert = await HelperCertification.findOne({ helperId: req.user!._id });
        if (!cert) {
            cert = await HelperCertification.create({ helperId: req.user!._id, currentTier: 'NONE' });
        }

        const now = new Date();

        if (tier === 'VERIFIED') {
            cert.currentTier = 'VERIFIED';
            cert.verified.achievedAt = now;
            cert.verified.requirements = {
                idVerified: true,
                backgroundCheckPassed: true,
                tasksCompleted: 5,
                ratingMet: true,
            };
        } else if (tier === 'PREMIUM') {
            if (cert.currentTier === 'NONE') {
                return res.status(400).json({ status: 'fail', message: 'Must be Verified Helper first.' });
            }
            cert.currentTier = 'PREMIUM';
            cert.premium.achievedAt = now;
            cert.premium.subscriptionActive = true;
        } else if (tier === 'ELITE') {
            if (cert.currentTier !== 'PREMIUM') {
                return res.status(400).json({ status: 'fail', message: 'Must be Premium Helper first.' });
            }
            cert.currentTier = 'ELITE';
            cert.elite.achievedAt = now;
            cert.elite.invitationAccepted = true;
            cert.elite.subscriptionActive = true;
        }

        await cert.save();

        // Update user's tier
        await User.findByIdAndUpdate(req.user!._id, {
            'helperProfile.tier': tier,
            'helperProfile.tierSince': now,
        });

        res.status(200).json({
            status: 'success',
            message: `Successfully upgraded to ${tier}!`,
            data: { certification: cert },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// POST /api/v1/certification/training/start
export const startTraining = async (req: AuthRequest, res: Response) => {
    try {
        const { moduleId } = req.body;
        const validModules = ['module1_gps', 'module2_photos', 'module3_communication', 'module4_verification', 'module5_exam'];

        if (!moduleId || !validModules.includes(moduleId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid module ID.' });
        }

        let cert = await HelperCertification.findOne({ helperId: req.user!._id });
        if (!cert) {
            cert = await HelperCertification.create({ helperId: req.user!._id, currentTier: 'NONE' });
        }

        res.status(200).json({
            status: 'success',
            message: `Training module ${moduleId} started.`,
            data: {
                moduleId,
                currentProgress: (cert.premium.trainingProgress as any)?.[moduleId] || { completed: false, score: 0 },
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// POST /api/v1/certification/training/submit
export const submitTraining = async (req: AuthRequest, res: Response) => {
    try {
        const { moduleId, score } = req.body;
        const validModules = ['module1_gps', 'module2_photos', 'module3_communication', 'module4_verification', 'module5_exam'];

        if (!moduleId || !validModules.includes(moduleId) || score == null) {
            return res.status(400).json({ status: 'fail', message: 'moduleId and score are required.' });
        }

        let cert = await HelperCertification.findOne({ helperId: req.user!._id });
        if (!cert) {
            cert = await HelperCertification.create({ helperId: req.user!._id, currentTier: 'NONE' });
        }

        const passing = moduleId === 'module5_exam' ? 80 : 60;
        const passed = score >= passing;

        (cert.premium.trainingProgress as any)[moduleId] = {
            completed: passed,
            score,
        };

        // Calculate overall progress
        const modules = validModules.map((m) => (cert!.premium.trainingProgress as any)?.[m]?.completed || false);
        const completedCount = modules.filter(Boolean).length;
        cert.premium.trainingProgress.overallProgress = Math.round((completedCount / validModules.length) * 100);

        if (cert.premium.trainingProgress.overallProgress === 100) {
            cert.premium.requirements.trainingCompleted = true;
        }

        await cert.save();

        res.status(200).json({
            status: 'success',
            data: {
                moduleId,
                score,
                passed,
                passingScore: passing,
                overallProgress: cert.premium.trainingProgress.overallProgress,
                trainingCompleted: cert.premium.requirements.trainingCompleted,
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// GET /api/v1/certification/training/progress
export const getTrainingProgress = async (req: AuthRequest, res: Response) => {
    try {
        const cert = await HelperCertification.findOne({ helperId: req.user!._id });
        if (!cert) {
            return res.status(200).json({
                status: 'success',
                data: { overallProgress: 0, modules: {} },
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                overallProgress: cert.premium.trainingProgress.overallProgress,
                modules: {
                    module1_gps: { ...cert.premium.trainingProgress.module1_gps, title: 'GPS Mastery', duration: '20 min' },
                    module2_photos: { ...cert.premium.trainingProgress.module2_photos, title: 'Pro Photography', duration: '30 min' },
                    module3_communication: { ...cert.premium.trainingProgress.module3_communication, title: 'Customer Communication', duration: '25 min' },
                    module4_verification: { ...cert.premium.trainingProgress.module4_verification, title: 'Advanced Verification', duration: '30 min' },
                    module5_exam: { ...cert.premium.trainingProgress.module5_exam, title: 'Final Exam', duration: '15 min', passingScore: 80 },
                },
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// POST /api/v1/certification/subscribe
export const subscribeTier = async (req: AuthRequest, res: Response) => {
    try {
        const { plan, tier } = req.body;
        if (!['MONTHLY', 'YEARLY'].includes(plan) || !['PREMIUM', 'ELITE'].includes(tier)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid plan or tier.' });
        }

        let cert = await HelperCertification.findOne({ helperId: req.user!._id });
        if (!cert) {
            return res.status(400).json({ status: 'fail', message: 'No certification record found.' });
        }

        const now = new Date();
        const amount = tier === 'PREMIUM'
            ? (plan === 'MONTHLY' ? 499 : 4999)
            : (plan === 'MONTHLY' ? 999 : 9999);
        const expiry = plan === 'MONTHLY'
            ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

        if (tier === 'PREMIUM') {
            cert.premium.subscriptionActive = true;
            cert.premium.subscriptionPlan = plan as 'MONTHLY' | 'YEARLY';
            cert.premium.subscriptionAmount = amount;
            cert.premium.subscriptionExpiry = expiry;
        } else {
            cert.elite.subscriptionActive = true;
        }

        await cert.save();

        res.status(200).json({
            status: 'success',
            message: `Subscribed to ${tier} (${plan}) for ₹${amount}`,
            data: {
                tier,
                plan,
                amount,
                expiry,
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
