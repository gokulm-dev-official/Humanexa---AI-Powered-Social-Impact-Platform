/**
 * ═══════════════════════════════════════════════════════════════════
 * 🧠 AI Service — Frontend API Client
 * ═══════════════════════════════════════════════════════════════════
 */

import api from './api';

export interface AIProcessResult {
    requestId: string;
    timestamp: string;
    mode: 'NORMAL' | 'EMERGENCY' | 'CRISIS';
    enhancedRequest: {
        originalDescription: string;
        enhancedDescription: string;
        detectedCategory: string;
        detectedKeywords: string[];
    };
    priority: {
        level: string;
        score: number;
        confidence: number;
        emotionDetected: string[];
        urgencyFactors: string[];
        recommendedResponseTime: string;
    };
    trust: {
        overallScore: number;
        level: string;
        fraudRisk: number;
        flags: string[];
        recommendation: string;
    };
    matches: {
        userId: string;
        name: string;
        role: string;
        score: number;
        distance: number;
        reasoning: string;
        estimatedResponseTime: string;
        pastSuccess: number;
    }[];
    routing: {
        notifyCount: number;
        strategy: string;
        estimatedResponseTime: string;
        escalationPlan: string[];
    };
    collaboration?: {
        isNeeded: boolean;
        totalAmount: number;
        donorCount: number;
        splits: { userId: string; name: string; amount: number; percentage: number; reasoning: string }[];
    };
    prediction: {
        successProbability: number;
        estimatedResolutionTime: string;
        riskFactors: string[];
        improvements: string[];
        seasonalInsights: string[];
    };
    explanation: {
        reasoning: string[];
        overallConfidence: number;
    };
    alerts: { type: string; message: string }[];
}

export interface AIChatResponse {
    message: string;
    intent: string;
    suggestions: string[];
}

export interface AIInsights {
    totalProcessed: number;
    avgResponseTime: string;
    successRate: number;
    activeDonors: number;
    urgentPending: number;
    topCategory: string;
    aiConfidence: number;
    trendsThisWeek: { category: string; change: number; direction: string }[];
    matchQuality: { avgScore: number; topMatchRate: number; avgMatchesPerRequest: number };
    fraudStats: { totalScanned: number; flagged: number; blocked: number; clearRate: number };
}

const aiService = {
    /**
     * Full AI pipeline processing
     */
    async processRequest(data: {
        description: string;
        category: string;
        urgency?: string;
        amount?: number;
        location: { lat: number; lng: number; address?: string };
    }): Promise<AIProcessResult> {
        const res = await api.post('/ai/process', data);
        return res.data.data;
    },

    /**
     * Quick text analysis
     */
    async analyzeDescription(description: string) {
        const res = await api.post('/ai/analyze', { description });
        return res.data.data;
    },

    /**
     * Detect priority & emotion
     */
    async detectPriority(description: string, urgency?: string, category?: string) {
        const res = await api.post('/ai/priority', { description, urgency, category });
        return res.data.data;
    },

    /**
     * Get trust score for a user
     */
    async getTrustScore(userId: string) {
        const res = await api.get(`/ai/trust-score/${userId}`);
        return res.data.data;
    },

    /**
     * Find matches for a request
     */
    async findMatches(data: { category: string; location: { lat: number; lng: number }; amount?: number; urgency?: string }) {
        const res = await api.post('/ai/match', data);
        return res.data.data;
    },

    /**
     * Predict outcome
     */
    async predict(data: any) {
        const res = await api.post('/ai/predict', data);
        return res.data.data;
    },

    /**
     * Generate impact story
     */
    async generateStory(data: any) {
        const res = await api.post('/ai/story', data);
        return res.data.data;
    },

    /**
     * Chat with AI assistant
     */
    async chat(message: string, context?: any): Promise<AIChatResponse> {
        const res = await api.post('/ai/chat', { message, context });
        return res.data.data;
    },

    /**
     * Get AI dashboard insights
     */
    async getInsights(): Promise<AIInsights> {
        const res = await api.get('/ai/insights');
        return res.data.data;
    },
};

export default aiService;
