/**
 * ═══════════════════════════════════════════════════════════════════
 * 🔍 TRUST SCORE & VERIFICATION AGENT
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Evaluates user trustworthiness and detects potential fraud using:
 *   - User history analysis (past activity, success rate)
 *   - Text pattern analysis (duplicate detection, anomalies)
 *   - Amount anomaly detection
 *   - Account age & verification status
 *   - Behavioral consistency scoring
 */

import User from '../models/User';
import HelpRequest from '../models/HelpRequest';

// ─── Types ───

export interface TrustEvaluation {
    userId: string;
    description: string;
    amount?: number;
    category: string;
}

export interface TrustResult {
    overallScore: number;     // 0..100
    level: 'unverified' | 'new' | 'trusted' | 'highly_trusted' | 'elite';
    fraudRisk: number;        // 0..1
    factors: {
        accountAge: number;
        verificationStatus: number;
        activityHistory: number;
        behavioralConsistency: number;
        textAuthenticity: number;
        amountReasonability: number;
    };
    flags: string[];
    recommendation: 'approve' | 'manual_review' | 'flag' | 'reject';
}

// ─── Fraud Detection Patterns ───

const SUSPICIOUS_PATTERNS = [
    /send money to/i,
    /wire transfer/i,
    /bitcoin|crypto|wallet address/i,
    /lottery|won|prize|congratulations/i,
    /click here|verify your account/i,
    /\b(scam|fake|fraud)\b/i,
    /western union|moneygram/i,
    /give me your (password|pin|otp)/i,
];

const DUPLICATE_THRESHOLD = 0.8; // 80% text similarity

class TrustScoreAgent {

    /**
     * Evaluate trustworthiness of a request
     */
    async evaluate(evaluation: TrustEvaluation): Promise<TrustResult> {
        const flags: string[] = [];
        
        try {
            const user = await User.findById(evaluation.userId).lean();
            
            if (!user) {
                return this.getDefaultTrust(evaluation, ['User not found in database']);
            }

            // ── Factor 1: Account Age (0..1) ──
            const accountAgeMs = Date.now() - new Date((user as any).createdAt).getTime();
            const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);
            let accountAge = 0;
            if (accountAgeDays > 365) accountAge = 1.0;
            else if (accountAgeDays > 180) accountAge = 0.85;
            else if (accountAgeDays > 30) accountAge = 0.6;
            else if (accountAgeDays > 7) accountAge = 0.3;
            else {
                accountAge = 0.1;
                flags.push('Account less than 7 days old');
            }

            // ── Factor 2: Verification Status (0..1) ──
            const vs = user.verificationStatus || {};
            let verificationStatus = 0;
            if (vs.emailVerified) verificationStatus += 0.2;
            if (vs.phoneVerified) verificationStatus += 0.25;
            if (vs.idVerified) verificationStatus += 0.35;
            if (vs.backgroundCheckPassed) verificationStatus += 0.2;
            if (user.governmentId?.verified) verificationStatus = Math.min(1, verificationStatus + 0.3);
            
            if (!vs.idVerified) flags.push('Government ID not verified');

            // ── Factor 3: Activity History (0..1) ──
            const totalActions = (user.statistics?.totalDonations || 0) + (user.statistics?.totalHelps || 0);
            let activityHistory = 0;
            if (totalActions > 50) activityHistory = 1.0;
            else if (totalActions > 20) activityHistory = 0.8;
            else if (totalActions > 10) activityHistory = 0.6;
            else if (totalActions > 3) activityHistory = 0.4;
            else activityHistory = 0.15;

            // ── Factor 4: Behavioral Consistency (0..1) ──
            const successRate = user.statistics?.successRate || 0;
            const streakCurrent = user.creditScore?.streak?.current || 0;
            let behavioralConsistency = (successRate * 0.6) + (Math.min(1, streakCurrent / 30) * 0.4);
            
            if (successRate < 0.3 && totalActions > 5) {
                flags.push('Low success rate detected');
                behavioralConsistency *= 0.5;
            }

            // ── Factor 5: Text Authenticity (0..1) ──
            let textAuthenticity = 1.0;
            const suspiciousMatches = SUSPICIOUS_PATTERNS.filter(p => p.test(evaluation.description));
            if (suspiciousMatches.length > 0) {
                textAuthenticity = Math.max(0, 1 - (suspiciousMatches.length * 0.25));
                flags.push(`Suspicious text patterns detected (${suspiciousMatches.length} matches)`);
            }
            
            // Check for duplicate requests
            const recentRequests = await HelpRequest.find({
                donorId: evaluation.userId,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }).limit(5).lean();
            
            if (recentRequests.length >= 3) {
                flags.push(`${recentRequests.length} requests in last 24 hours — potential duplicate`);
                textAuthenticity *= 0.7;
            }

            // ── Factor 6: Amount Reasonability (0..1) ──
            let amountReasonability = 1.0;
            if (evaluation.amount) {
                if (evaluation.amount > 500000) {
                    amountReasonability = 0.2;
                    flags.push('Unusually high amount requested (>₹5L)');
                } else if (evaluation.amount > 100000) {
                    amountReasonability = 0.5;
                    flags.push('High amount requested (>₹1L)');
                } else if (evaluation.amount > 50000) {
                    amountReasonability = 0.7;
                } else if (evaluation.amount < 100) {
                    amountReasonability = 0.9;
                    flags.push('Unusually small amount');
                }
            }

            // ── Composite Score ──
            const weights = {
                accountAge: 0.15,
                verificationStatus: 0.25,
                activityHistory: 0.20,
                behavioralConsistency: 0.15,
                textAuthenticity: 0.15,
                amountReasonability: 0.10,
            };

            const compositeScore = 
                (accountAge * weights.accountAge) +
                (verificationStatus * weights.verificationStatus) +
                (activityHistory * weights.activityHistory) +
                (behavioralConsistency * weights.behavioralConsistency) +
                (textAuthenticity * weights.textAuthenticity) +
                (amountReasonability * weights.amountReasonability);

            const overallScore = Math.round(compositeScore * 100);
            const fraudRisk = Math.round((1 - compositeScore) * 100) / 100;

            // Level
            let level: TrustResult['level'] = 'unverified';
            if (overallScore >= 85) level = 'elite';
            else if (overallScore >= 70) level = 'highly_trusted';
            else if (overallScore >= 50) level = 'trusted';
            else if (overallScore >= 25) level = 'new';

            // Recommendation
            let recommendation: TrustResult['recommendation'] = 'approve';
            if (fraudRisk > 0.7) recommendation = 'reject';
            else if (fraudRisk > 0.5) recommendation = 'flag';
            else if (fraudRisk > 0.3 || flags.length >= 3) recommendation = 'manual_review';

            return {
                overallScore,
                level,
                fraudRisk,
                factors: {
                    accountAge: Math.round(accountAge * 100) / 100,
                    verificationStatus: Math.round(verificationStatus * 100) / 100,
                    activityHistory: Math.round(activityHistory * 100) / 100,
                    behavioralConsistency: Math.round(behavioralConsistency * 100) / 100,
                    textAuthenticity: Math.round(textAuthenticity * 100) / 100,
                    amountReasonability: Math.round(amountReasonability * 100) / 100,
                },
                flags,
                recommendation,
            };
        } catch (error) {
            console.error('[TrustScoreAgent] Error:', error);
            return this.getDefaultTrust(evaluation, ['Database unavailable — using default scoring']);
        }
    }

    /**
     * Compute a standalone trust score for any user (for profile display)
     */
    async getUserTrustScore(userId: string): Promise<{ score: number; level: string; badges: string[] }> {
        try {
            const user = await User.findById(userId).lean();
            if (!user) return { score: 0, level: 'unverified', badges: [] };

            const totalActions = (user.statistics?.totalDonations || 0) + (user.statistics?.totalHelps || 0);
            const successRate = user.statistics?.successRate || 0;
            const isVerified = user.verificationStatus?.idVerified || false;
            const points = user.creditScore?.totalPoints || 0;

            let score = 20; // Base
            if (isVerified) score += 25;
            if (user.verificationStatus?.phoneVerified) score += 10;
            score += Math.min(25, totalActions * 0.5);
            score += Math.round(successRate * 15);
            score += Math.min(5, Math.floor(points / 200));

            const badges: string[] = [];
            if (score >= 90) badges.push('Elite Contributor');
            if (totalActions >= 50) badges.push('Veteran');
            if (successRate >= 0.95) badges.push('Reliable');
            if (isVerified) badges.push('ID Verified');
            if (user.creditScore?.streak?.current && user.creditScore.streak.current >= 7) badges.push('Active Streak');

            let level = 'unverified';
            if (score >= 85) level = 'elite';
            else if (score >= 70) level = 'highly_trusted';
            else if (score >= 50) level = 'trusted';
            else if (score >= 25) level = 'new';

            return { score: Math.min(100, score), level, badges };
        } catch {
            return { score: 30, level: 'new', badges: [] };
        }
    }

    /**
     * Default trust result when user data is unavailable
     */
    private getDefaultTrust(evaluation: TrustEvaluation, flags: string[]): TrustResult {
        return {
            overallScore: 40,
            level: 'new',
            fraudRisk: 0.3,
            factors: {
                accountAge: 0.3,
                verificationStatus: 0.2,
                activityHistory: 0.2,
                behavioralConsistency: 0.5,
                textAuthenticity: 0.8,
                amountReasonability: 0.7,
            },
            flags,
            recommendation: 'manual_review',
        };
    }
}

export const trustScoreAgent = new TrustScoreAgent();
