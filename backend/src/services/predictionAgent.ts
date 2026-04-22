/**
 * ═══════════════════════════════════════════════════════════════════
 * 🔮 PREDICTION AGENT — Forecasting & Outcome Estimation
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Predicts:
 *   1. Success probability for a given request
 *   2. Estimated resolution time
 *   3. Seasonal/regional demand forecasts
 *   4. Improvement suggestions
 */

// ─── Types ───

export interface PredictionInput {
    category: string;
    location: { lat: number; lng: number };
    amount?: number;
    matchCount: number;
    priorityLevel: string;
    trustScore: number;
}

export interface PredictionResult {
    successProbability: number;  // 0..1
    estimatedResolutionTime: string;
    riskFactors: string[];
    improvements: string[];
    seasonalInsights: string[];
    confidence: number;
    predictedDemand: {
        category: string;
        trend: 'rising' | 'stable' | 'declining';
        nextWeekEstimate: number;
    };
}

// ─── Seasonal Patterns ───

const SEASONAL_DEMAND: Record<string, { months: number[]; label: string; categories: string[] }[]> = {
    food: [
        { months: [3, 4], label: 'Festival season — higher food demand', categories: ['food'] },
        { months: [10, 11, 12], label: 'Year-end holiday increase in donations', categories: ['food'] },
    ],
    education: [
        { months: [5, 6], label: 'School admission season — fee requests surge', categories: ['education'] },
        { months: [1, 2], label: 'Exam season — tuition support demand', categories: ['education'] },
    ],
    medicine: [
        { months: [7, 8, 9], label: 'Monsoon season — medical emergencies rise', categories: ['medicine'] },
        { months: [12, 1], label: 'Winter health concerns increase', categories: ['medicine'] },
    ],
    clothing: [
        { months: [11, 12, 1], label: 'Winter clothing demand peak', categories: ['clothing'] },
    ],
    shelter: [
        { months: [6, 7, 8, 9], label: 'Monsoon flooding — shelter demand critical', categories: ['shelter'] },
    ],
};

class PredictionAgent {

    /**
     * Predict outcome for a help request
     */
    async predict(input: PredictionInput): Promise<PredictionResult> {
        const riskFactors: string[] = [];
        const improvements: string[] = [];

        // ── Success Probability ──
        let successProb = 0.5; // Base

        // Match availability
        if (input.matchCount >= 5) successProb += 0.25;
        else if (input.matchCount >= 3) successProb += 0.15;
        else if (input.matchCount >= 1) successProb += 0.05;
        else {
            riskFactors.push('No matches found in area — low supply');
            successProb -= 0.15;
            improvements.push('Consider expanding the search radius or adding more details');
        }

        // Trust score impact
        if (input.trustScore >= 70) successProb += 0.10;
        else if (input.trustScore < 30) {
            riskFactors.push('Low trust score may reduce donor willingness');
            successProb -= 0.10;
            improvements.push('Complete ID verification to boost trust score');
        }

        // Priority impact
        if (input.priorityLevel === 'critical') {
            successProb += 0.08;  // Urgent gets faster response
        } else if (input.priorityLevel === 'low') {
            riskFactors.push('Low priority may result in slower response');
        }

        // Amount impact
        if (input.amount) {
            if (input.amount > 100000) {
                riskFactors.push('High amount — may require multi-donor collaboration');
                successProb -= 0.10;
                improvements.push('Consider breaking the request into smaller milestones');
            } else if (input.amount < 5000) {
                successProb += 0.05; // Small amounts are easier to fulfill
            }
        }

        successProb = Math.max(0.05, Math.min(0.98, successProb));

        // ── Resolution Time ──
        let estimatedTime = '2-6 hours';
        if (input.priorityLevel === 'critical' && input.matchCount >= 3) {
            estimatedTime = '15-45 minutes';
        } else if (input.priorityLevel === 'high') {
            estimatedTime = '1-3 hours';
        } else if (input.matchCount < 2) {
            estimatedTime = '6-24 hours';
        }

        // ── Seasonal Insights ──
        const currentMonth = new Date().getMonth() + 1;
        const seasonalInsights: string[] = [];
        
        const patterns = SEASONAL_DEMAND[input.category] || [];
        for (const pattern of patterns) {
            if (pattern.months.includes(currentMonth)) {
                seasonalInsights.push(pattern.label);
            }
        }
        
        if (seasonalInsights.length === 0) {
            seasonalInsights.push(`${input.category} demand is at normal levels for this period`);
        }

        // ── Demand Prediction ──
        const trend = seasonalInsights.length > 0 && seasonalInsights[0] !== `${input.category} demand is at normal levels for this period`
            ? 'rising' : 'stable';

        // General improvements
        if (improvements.length === 0) {
            improvements.push('Add specific details about beneficiaries for better matching');
            improvements.push('Include photos/documents to increase credibility');
        }

        // Confidence
        const confidence = Math.round(Math.min(0.92, 0.5 + (input.matchCount * 0.05) + (input.trustScore / 200)) * 100) / 100;

        return {
            successProbability: Math.round(successProb * 100) / 100,
            estimatedResolutionTime: estimatedTime,
            riskFactors,
            improvements,
            seasonalInsights,
            confidence,
            predictedDemand: {
                category: input.category,
                trend,
                nextWeekEstimate: Math.floor(Math.random() * 20) + 10, // Simulated
            },
        };
    }
}

export const predictionAgent = new PredictionAgent();
