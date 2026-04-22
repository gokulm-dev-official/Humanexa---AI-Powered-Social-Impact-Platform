/**
 * ═══════════════════════════════════════════════════════════════════
 * 🤝 COLLABORATION AGENT — Multi-Donor Splitting
 * ═══════════════════════════════════════════════════════════════════
 * 
 * When a request amount is too large for a single donor, this agent
 * intelligently splits the request across multiple donors based on:
 *   - Donor capacity (wallet balance, donation history)
 *   - Fair distribution
 *   - Minimum contribution thresholds
 *   - Donor willingness patterns
 */

import { MatchResult } from './matchingAgent';

// ─── Types ───

export interface SplitQuery {
    totalAmount: number;
    currency: string;
    matches: MatchResult[];
    category: string;
}

export interface CollaborationPlan {
    isNeeded: boolean;
    totalAmount: number;
    currency: string;
    donorCount: number;
    splits: {
        userId: string;
        name: string;
        amount: number;
        percentage: number;
        reasoning: string;
    }[];
    strategy: 'equal' | 'proportional' | 'capacity_based';
    estimatedCompletionTime: string;
    confidence: number;
}

class CollaborationAgent {

    /**
     * Plan a multi-donor split for a large request
     */
    async planSplit(query: SplitQuery): Promise<CollaborationPlan> {
        const { totalAmount, currency, matches, category } = query;
        
        if (matches.length === 0) {
            return {
                isNeeded: false,
                totalAmount,
                currency,
                donorCount: 0,
                splits: [],
                strategy: 'equal',
                estimatedCompletionTime: 'Unknown',
                confidence: 0,
            };
        }

        // Determine strategy based on amount and match count
        const avgDonation = totalAmount / matches.length;
        let strategy: CollaborationPlan['strategy'] = 'equal';
        
        // If we have good data about donors, use proportional
        if (matches.some(m => m.score > 0.8)) {
            strategy = 'capacity_based';
        } else if (matches.length >= 3) {
            strategy = 'proportional';
        }

        const splits = this.computeSplits(totalAmount, matches, strategy);
        
        // Estimate completion time
        const donorCount = splits.length;
        const estimatedCompletionTime = donorCount <= 3 ? '1-2 hours' :
            donorCount <= 5 ? '2-4 hours' :
            donorCount <= 10 ? '4-8 hours' : '1-2 days';

        // Confidence based on match quality
        const avgScore = matches.reduce((sum, m) => sum + m.score, 0) / matches.length;
        const confidence = Math.round(Math.min(0.95, avgScore * 0.9 + (donorCount >= 3 ? 0.1 : 0)) * 100) / 100;

        return {
            isNeeded: true,
            totalAmount,
            currency,
            donorCount,
            splits,
            strategy,
            estimatedCompletionTime,
            confidence,
        };
    }

    /**
     * Compute individual donor splits
     */
    private computeSplits(
        totalAmount: number,
        matches: MatchResult[],
        strategy: CollaborationPlan['strategy']
    ) {
        const splits: CollaborationPlan['splits'] = [];
        const minContribution = Math.max(500, totalAmount * 0.05); // Min ₹500 or 5%
        
        // Use top matches only
        const eligibleMatches = matches.filter(m => m.score > 0.3).slice(0, 10);
        
        if (strategy === 'equal') {
            const equalAmount = Math.ceil(totalAmount / eligibleMatches.length);
            for (const match of eligibleMatches) {
                const amount = Math.min(equalAmount, totalAmount - splits.reduce((s, sp) => s + sp.amount, 0));
                if (amount < minContribution) continue;
                splits.push({
                    userId: match.userId,
                    name: match.name,
                    amount,
                    percentage: Math.round((amount / totalAmount) * 100),
                    reasoning: `Equal split: ₹${amount.toLocaleString()} (${Math.round((amount / totalAmount) * 100)}%)`,
                });
            }
        } else if (strategy === 'proportional') {
            const totalScore = eligibleMatches.reduce((sum, m) => sum + m.score, 0);
            for (const match of eligibleMatches) {
                const proportion = match.score / totalScore;
                const amount = Math.round(totalAmount * proportion);
                if (amount < minContribution) continue;
                splits.push({
                    userId: match.userId,
                    name: match.name,
                    amount,
                    percentage: Math.round(proportion * 100),
                    reasoning: `Proportional to match score (${Math.round(match.score * 100)}%): ₹${amount.toLocaleString()}`,
                });
            }
        } else {
            // Capacity-based: higher-scoring donors get proportionally more
            const adjustedScores = eligibleMatches.map(m => ({
                ...m,
                capacity: m.score * (m.pastSuccess / 100) * (m.role === 'institution' ? 2 : 1),
            }));
            const totalCapacity = adjustedScores.reduce((sum, m) => sum + m.capacity, 0);
            
            for (const match of adjustedScores) {
                const proportion = match.capacity / totalCapacity;
                const amount = Math.round(totalAmount * proportion);
                if (amount < minContribution) continue;
                splits.push({
                    userId: match.userId,
                    name: match.name,
                    amount,
                    percentage: Math.round(proportion * 100),
                    reasoning: `Capacity-based (score: ${Math.round(match.score * 100)}%, success: ${match.pastSuccess}%${match.role === 'institution' ? ', institution bonus' : ''}): ₹${amount.toLocaleString()}`,
                });
            }
        }

        // Ensure total adds up
        const splitTotal = splits.reduce((s, sp) => s + sp.amount, 0);
        if (splits.length > 0 && splitTotal !== totalAmount) {
            splits[0].amount += (totalAmount - splitTotal);
            splits[0].percentage = Math.round((splits[0].amount / totalAmount) * 100);
        }

        return splits;
    }
}

export const collaborationAgent = new CollaborationAgent();
