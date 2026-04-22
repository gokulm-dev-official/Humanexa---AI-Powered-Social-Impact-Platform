import User from '../models/User';
import CreditHistory from '../models/CreditHistory';
import { generateMilestoneCertificate } from './certificateService';

export const awardPoints = async (userId: string, activityType: 'donation' | 'help_completed' | 'referral', points: number, reason: string, helpRequestId?: string) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        // 1. Streak Logic
        const now = new Date();
        const lastActivity = user.creditScore.streak.lastActivityAt;

        if (lastActivity) {
            const diffInDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 3600 * 24));

            if (diffInDays === 1) {
                // Consecutive day
                user.creditScore.streak.current += 1;
                if (user.creditScore.streak.current > user.creditScore.streak.longest) {
                    user.creditScore.streak.longest = user.creditScore.streak.current;
                }
            } else if (diffInDays > 1) {
                // Streak broken
                user.creditScore.streak.current = 1;
            }
        } else {
            user.creditScore.streak.current = 1;
        }
        user.creditScore.streak.lastActivityAt = now;

        // 2. Award Points
        user.creditScore.totalPoints += points;
        user.creditScore.yearlyPoints += points;

        // 3. Simple Rank Logic
        if (user.creditScore.totalPoints > 5000) user.creditScore.rank = 'Diamond';
        else if (user.creditScore.totalPoints > 2000) user.creditScore.rank = 'Platinum';
        else if (user.creditScore.totalPoints > 1000) user.creditScore.rank = 'Gold';
        else if (user.creditScore.totalPoints > 500) user.creditScore.rank = 'Silver';

        // 4. Milestone Check
        if (user.creditScore.streak.current === 30) {
            await generateMilestoneCertificate(userId, '30_days_streak', 30);
        }

        // Month/Year milestones based on total helps
        if (user.statistics.totalHelps === 50) {
            await generateMilestoneCertificate(userId, '6_months_impact', 50);
        }

        await user.save();

        // Create history record
        await CreditHistory.create({
            userId,
            activityType,
            points,
            reason,
            helpRequestId,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            validUntil: new Date(new Date().setFullYear(now.getFullYear() + 1)),
        });

        return user.creditScore.totalPoints;
    } catch (err) {
        console.error('Error awarding points:', err);
    }
};
