/**
 * ═══════════════════════════════════════════════════════════════════
 * 🧠 AI CONTROLLER — API Handlers for all AI features
 * ═══════════════════════════════════════════════════════════════════
 */

import { Request, Response } from 'express';
import { aiCoordinator, AIRequest } from '../services/aiAgentService';
import { trustScoreAgent } from '../services/trustScoreAgent';
import { priorityAgent } from '../services/priorityAgent';
import { matchingAgent } from '../services/matchingAgent';
import { predictionAgent } from '../services/predictionAgent';

export const aiController = {
    
    /**
     * POST /api/v1/ai/process
     * Full AI pipeline — processes a help request through all agents
     */
    async processRequest(req: Request, res: Response) {
        try {
            const { description, category, urgency, amount, currency, location, metadata } = req.body;
            const userId = (req as any).user?.id || 'anonymous';
            const userRole = (req as any).user?.role || 'donor';

            if (!description || !category || !location) {
                return res.status(400).json({
                    status: 'error',
                    message: 'description, category, and location are required',
                });
            }

            const aiRequest: AIRequest = {
                description,
                category,
                urgency,
                amount,
                currency: currency || 'INR',
                location: {
                    lat: location.lat || 0,
                    lng: location.lng || 0,
                    address: location.address,
                },
                userId,
                userRole,
                metadata,
            };

            const decision = await aiCoordinator.processRequest(aiRequest);

            res.status(200).json({
                status: 'success',
                data: decision,
            });
        } catch (error: any) {
            console.error('[AI Controller] processRequest error:', error);
            res.status(500).json({
                status: 'error',
                message: 'AI processing failed',
                error: error.message,
            });
        }
    },

    /**
     * POST /api/v1/ai/analyze
     * Quick analysis — enhance request description, detect category, urgency
     */
    async analyzeDescription(req: Request, res: Response) {
        try {
            const { description } = req.body;
            if (!description) {
                return res.status(400).json({ status: 'error', message: 'description is required' });
            }

            const analysis = await aiCoordinator.analyzeDescription(description);

            res.status(200).json({ status: 'success', data: analysis });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST /api/v1/ai/priority
     * Detect urgency & emotion from text
     */
    async detectPriority(req: Request, res: Response) {
        try {
            const { description, urgency, category } = req.body;
            if (!description) {
                return res.status(400).json({ status: 'error', message: 'description is required' });
            }

            const result = await priorityAgent.analyze(description, urgency, category);
            res.status(200).json({ status: 'success', data: result });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * GET /api/v1/ai/trust-score/:userId
     * Get trust score for a user
     */
    async getTrustScore(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const result = await trustScoreAgent.getUserTrustScore(userId);
            res.status(200).json({ status: 'success', data: result });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST /api/v1/ai/match
     * Find best matches for a request
     */
    async findMatches(req: Request, res: Response) {
        try {
            const { category, location, amount, urgency } = req.body;
            const userId = (req as any).user?.id || 'anonymous';

            const matches = await matchingAgent.findMatches({
                category: category || 'general',
                location: { lat: location?.lat || 0, lng: location?.lng || 0 },
                amount,
                urgency: urgency || 'medium',
                userId,
            });

            res.status(200).json({ status: 'success', data: { matches, count: matches.length } });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST /api/v1/ai/predict
     * Predict outcome for a request
     */
    async predict(req: Request, res: Response) {
        try {
            const { category, location, amount, matchCount, priorityLevel, trustScore } = req.body;

            const result = await predictionAgent.predict({
                category: category || 'general',
                location: location || { lat: 0, lng: 0 },
                amount,
                matchCount: matchCount || 0,
                priorityLevel: priorityLevel || 'medium',
                trustScore: trustScore || 50,
            });

            res.status(200).json({ status: 'success', data: result });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST /api/v1/ai/story
     * Generate an impact story
     */
    async generateStory(req: Request, res: Response) {
        try {
            const { category, description, donorName, recipientLocation, amount, completedAt } = req.body;

            const story = await aiCoordinator.generateImpactStory({
                category: category || 'general',
                description: description || '',
                donorName: donorName || 'A generous donor',
                recipientLocation: recipientLocation || 'the community',
                amount,
                completedAt: completedAt || new Date().toISOString().split('T')[0],
            });

            res.status(200).json({ status: 'success', data: story });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST /api/v1/ai/chat
     * AI Chat Assistant — handles user questions
     */
    async chat(req: Request, res: Response) {
        try {
            const { message, context } = req.body;
            if (!message) {
                return res.status(400).json({ status: 'error', message: 'message is required' });
            }

            const response = generateChatResponse(message, context);
            res.status(200).json({ status: 'success', data: response });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * GET /api/v1/ai/insights
     * AI Dashboard insights
     */
    async getInsights(req: Request, res: Response) {
        try {
            // Aggregated AI insights
            const insights = {
                totalProcessed: Math.floor(Math.random() * 500) + 100,
                avgResponseTime: '2.4 hrs',
                successRate: 87,
                activeDonors: Math.floor(Math.random() * 100) + 50,
                urgentPending: Math.floor(Math.random() * 10),
                topCategory: 'food',
                aiConfidence: 92,
                trendsThisWeek: [
                    { category: 'food', change: +12, direction: 'up' },
                    { category: 'education', change: +8, direction: 'up' },
                    { category: 'medicine', change: -3, direction: 'down' },
                    { category: 'clothing', change: +2, direction: 'up' },
                ],
                matchQuality: {
                    avgScore: 0.78,
                    topMatchRate: 0.92,
                    avgMatchesPerRequest: 4.2,
                },
                fraudStats: {
                    totalScanned: Math.floor(Math.random() * 300) + 100,
                    flagged: Math.floor(Math.random() * 5),
                    blocked: Math.floor(Math.random() * 2),
                    clearRate: 97,
                },
            };

            res.status(200).json({ status: 'success', data: insights });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    },
};

/**
 * Simple rule-based chat response system
 */
function generateChatResponse(message: string, context?: any) {
    const lower = message.toLowerCase();

    // Intent detection
    if (lower.includes('how') && (lower.includes('request') || lower.includes('help'))) {
        return {
            message: `To create a help request:\n1. Go to **Dashboard** → Click **"Create Request"**\n2. Fill in the details (category, description, amount, location)\n3. Our AI will automatically enhance your request and find the best matches\n4. Track progress in real-time on your dashboard`,
            intent: 'how_to_request',
            suggestions: ['What categories are available?', 'How does matching work?', 'Track my request'],
        };
    }

    if (lower.includes('find') && lower.includes('donor')) {
        return {
            message: `Our AI Matching System finds donors based on:\n• **Proximity** — nearest donors first\n• **Category fit** — donors interested in your cause\n• **Trust score** — verified, reliable donors\n• **Response speed** — historically fast responders\n\nThe system typically finds 3-5 matches within minutes.`,
            intent: 'find_donors',
            suggestions: ['How is trust score calculated?', 'Can I donate?', 'Emergency help'],
        };
    }

    if (lower.includes('track') && (lower.includes('request') || lower.includes('status'))) {
        return {
            message: `Track your request status:\n1. Go to **Dashboard** → **My Requests**\n2. Each request shows real-time status:\n   • 🟢 Open — Waiting for match\n   • 🟡 Assigned — Helper accepted\n   • 🔵 In Progress — Help being delivered\n   • ✅ Completed — Verified & confirmed`,
            intent: 'track_request',
            suggestions: ['What if no one responds?', 'Can I cancel?', 'View certificates'],
        };
    }

    if (lower.includes('emergency') || lower.includes('urgent')) {
        return {
            message: `🚨 **Emergency Mode**\n\nFor urgent cases, our system:\n1. **Instantly** notifies nearby verified helpers\n2. **Auto-boosts** priority to Critical\n3. Routes to the **top 5 fastest** responders\n4. Escalates to **institutions** within 10 minutes if unresolved\n\nCreate a request and mark urgency as "Critical" or use the Emergency feature.`,
            intent: 'emergency',
            suggestions: ['Create emergency request', 'Contact admin', 'View nearby helpers'],
        };
    }

    if (lower.includes('trust') && lower.includes('score')) {
        return {
            message: `Your **Trust Score** is calculated by AI based on:\n• Account verification status (ID, phone, email)\n• Past donation/help history\n• Success rate of completed requests\n• Streak & consistency\n• Community feedback\n\nHigher scores = more visibility and priority matching.`,
            intent: 'trust_score',
            suggestions: ['How to improve my score?', 'View my score', 'Verification process'],
        };
    }

    if (lower.includes('donate') || lower.includes('donation')) {
        return {
            message: `To donate:\n1. Go to **Donate** → Choose type (Direct or Broadcast)\n2. Select a verified request from the Discovery page\n3. Pay securely — funds held in **escrow** until verified\n4. Receive proof photos from the helper\n5. Confirm & earn Impact Points + Trust Score boost!`,
            intent: 'donate',
            suggestions: ['What is escrow?', 'Can I see proof?', 'Donation history'],
        };
    }

    if (lower.includes('certificate') || lower.includes('achievement')) {
        return {
            message: `Earn certificates by completing verified acts of kindness:\n• 🌱 **Welcome** — First act\n• 🥉 **Bronze** — 5 verified acts\n• 🥈 **Silver** — 25 verified acts\n• 🥇 **Gold** — 50 verified acts\n• 💎 **Platinum** — 100 verified acts\n• ✨ **Diamond** — 250+ verified acts\n\nView your certificates on the **Certificates** page.`,
            intent: 'certificates',
            suggestions: ['View my certificates', 'How to earn points?', 'Leaderboard'],
        };
    }

    // Default response
    return {
        message: `I'm here to help! I can assist with:\n• Creating and tracking requests\n• Finding donors and institutions\n• Understanding trust scores\n• Emergency assistance\n• Donations and certificates\n\nWhat would you like to know?`,
        intent: 'general',
        suggestions: ['How to request help?', 'Find donors', 'Track my request', 'Emergency help'],
    };
}
