import GovernmentIntegration from '../models/GovernmentIntegration';
import User from '../models/User';
import ImpactChat from '../models/ImpactChat';
import { v4 as uuidv4 } from 'uuid';

export const generateAnnualCertificate = async (userId: string, year: number) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const certificateNumber = `SK-ANNUAL-${year}-${uuidv4().split('-')[0].toUpperCase()}`;

    const cert = await GovernmentIntegration.create({
        userId,
        certificateType: user.role === 'helper' ? 'volunteer' : 'donor',
        year,
        totalPoints: user.creditScore.yearlyPoints,
        impactSummary: {
            totalDonations: user.statistics.totalDonations,
            totalHelps: user.statistics.totalHelps,
            successRate: user.statistics.successRate
        },
        certificateNumber,
        issuedAt: new Date(),
        governmentAcknowledgment: {
            acknowledged: true,
            issuedBy: 'Social Kind Enterprise'
        }
    });

    return cert;
};

export const generateMilestoneCertificate = async (userId: string, type: '30_days_streak' | '6_months_impact' | 'annual_impact', value: number) => {
    const user = await User.findById(userId);
    if (!user) return;

    const year = new Date().getFullYear();
    const certificateNumber = `SK-MILE-${type.toUpperCase()}-${year}-${uuidv4().split('-')[0].toUpperCase()}`;

    return await GovernmentIntegration.create({
        userId,
        certificateType: type,
        year,
        totalPoints: user.creditScore.totalPoints,
        impactSummary: { milestoneValue: value, currentStreak: user.creditScore.streak.current },
        certificateNumber,
        governmentAcknowledgment: { acknowledged: true, issuedBy: 'Social Kind Digital Archive' }
    });
};

export const grantAnnualAwards = async (year: number) => {
    // Find top 1% users or top 10 contributors
    const topUsers = await User.find()
        .sort({ 'creditScore.yearlyPoints': -1 })
        .limit(10);

    const awards = [];
    for (const user of topUsers) {
        const certificateNumber = `GOV-HONOR-${year}-${uuidv4().split('-')[0].toUpperCase()}`;
        const award = await GovernmentIntegration.create({
            userId: user._id,
            certificateType: 'government_honor',
            year,
            totalPoints: user.creditScore.yearlyPoints,
            impactSummary: { rank: 'National Contributor', recognition: 'High Impact Award' },
            certificateNumber,
            governmentAcknowledgment: {
                acknowledged: true,
                issuedBy: 'Ministry of Social Welfare (Simulated)'
            }
        });
        awards.push(award);
    }
    return awards;
};

export const generateDailyCertificates = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Find Daily Donor Champion
    const donorChampion = await ImpactChat.aggregate([
        { $match: { createdAt: { $gte: todayStart }, status: { $in: ['amount_sent', 'help_completed'] } } },
        { $group: { _id: '$donorId', totalSent: { $sum: '$amount' } } },
        { $sort: { totalSent: -1 } },
        { $limit: 1 }
    ]);

    if (donorChampion.length > 0 && donorChampion[0]._id) {
        const certNo = `DAILY-DONOR-${Date.now()}-${uuidv4().split('-')[0].toUpperCase()}`;
        await GovernmentIntegration.create({
            userId: donorChampion[0]._id,
            certificateType: 'daily_donor_champion',
            year: new Date().getFullYear(),
            totalPoints: 0,
            impactSummary: { totalSent: donorChampion[0].totalSent, date: todayStart },
            certificateNumber: certNo,
            governmentAcknowledgment: { acknowledged: true, issuedBy: 'Social Kind Daily Board' }
        });
    }

    // 2. Find Daily Helper Champion
    const helperChampion = await ImpactChat.aggregate([
        { $match: { createdAt: { $gte: todayStart }, status: 'help_completed' } },
        { $group: { _id: '$helperId', totalHelps: { $sum: 1 } } },
        { $sort: { totalHelps: -1 } },
        { $limit: 1 }
    ]);

    if (helperChampion.length > 0 && helperChampion[0]._id) {
        const certNo = `DAILY-HELPER-${Date.now()}-${uuidv4().split('-')[0].toUpperCase()}`;
        await GovernmentIntegration.create({
            userId: helperChampion[0]._id,
            certificateType: 'daily_helper_champion',
            year: new Date().getFullYear(),
            totalPoints: 0,
            impactSummary: { totalHelps: helperChampion[0].totalHelps, date: todayStart },
            certificateNumber: certNo,
            governmentAcknowledgment: { acknowledged: true, issuedBy: 'Social Kind Daily Board' }
        });
    }
};
