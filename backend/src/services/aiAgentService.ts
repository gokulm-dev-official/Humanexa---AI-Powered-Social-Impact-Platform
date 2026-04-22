/**
 * ═══════════════════════════════════════════════════════════════════
 * 🧠 AI COORDINATOR AGENT — Central Orchestrator
 * ═══════════════════════════════════════════════════════════════════
 * 
 * The brain of the HUMANEXA AI system. Receives all incoming requests,
 * delegates to specialized agents, aggregates results, and returns
 * a unified AI decision with full explainability.
 * 
 * Agents managed:
 *   1. Matching Agent      — connects users ↔ donors ↔ institutions
 *   2. Priority Agent      — urgency & emotion detection
 *   3. Verification Agent  — fraud detection & trust scoring
 *   4. Routing Agent       — notification optimization
 *   5. Collaboration Agent — multi-donor splitting
 *   6. Prediction Agent    — forecasting future needs
 *   7. Impact Agent        — success tracking & scoring
 *   8. Story Agent         — impact narrative generation
 */

import { matchingAgent, MatchResult } from './matchingAgent';
import { priorityAgent, PriorityResult } from './priorityAgent';
import { trustScoreAgent, TrustResult } from './trustScoreAgent';
import { collaborationAgent, CollaborationPlan } from './collaborationAgent';
import { predictionAgent, PredictionResult } from './predictionAgent';
import { storyAgent } from './storyAgent';

// ─── Types ───

export interface AIRequest {
    requestId?: string;
    description: string;
    category: 'food' | 'medicine' | 'clothing' | 'shelter' | 'emergency' | 'education' | 'blood' | 'general';
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    amount?: number;
    currency?: string;
    location: {
        lat: number;
        lng: number;
        address?: string;
    };
    userId: string;
    userRole: 'donor' | 'helper' | 'institution';
    metadata?: Record<string, any>;
}

export interface AIDecision {
    requestId: string;
    timestamp: string;
    mode: 'NORMAL' | 'EMERGENCY' | 'CRISIS';
    
    // Step 1: Enhanced request
    enhancedRequest: {
        originalDescription: string;
        enhancedDescription: string;
        detectedCategory: string;
        detectedKeywords: string[];
        structuredFields: Record<string, any>;
    };
    
    // Step 2: Priority
    priority: PriorityResult;
    
    // Step 3: Trust
    trust: TrustResult;
    
    // Step 4: Matches
    matches: MatchResult[];
    
    // Step 5: Routing
    routing: {
        notifyCount: number;
        strategy: 'sequential' | 'parallel' | 'broadcast';
        estimatedResponseTime: string;
        escalationPlan: string[];
    };
    
    // Step 6: Collaboration (if applicable)
    collaboration?: CollaborationPlan;
    
    // Step 7: Prediction
    prediction: PredictionResult;
    
    // Step 8: AI Explanation
    explanation: {
        reasoning: string[];
        confidenceFactors: { factor: string; weight: number }[];
        overallConfidence: number;
    };
    
    // Alerts
    alerts: { type: 'info' | 'warning' | 'critical'; message: string }[];
}

// ─── Emergency keywords for mode detection ───

const EMERGENCY_KEYWORDS = [
    'emergency', 'urgent', 'critical', 'dying', 'accident', 'blood',
    'ambulance', 'hospital', 'life-threatening', 'flood', 'earthquake',
    'disaster', 'fire', 'collapse', 'rescue', 'help immediately',
    'please help', 'heart attack', 'stroke', 'bleeding', 'severe'
];

const CRISIS_KEYWORDS = [
    'flood', 'earthquake', 'tsunami', 'cyclone', 'pandemic',
    'mass', 'disaster', 'large-scale', 'multiple victims', 'refugee'
];

const EMOTION_INDICATORS = {
    panic: ['please', 'help', '😭', '🙏', 'please help', 'begging', 'desperate'],
    stress: ['urgent', 'immediately', 'asap', 'quickly', 'fast'],
    grief: ['lost', 'passed away', 'death', 'funeral'],
    fear: ['scared', 'afraid', 'dangerous', 'threatened'],
};

// ─── The Coordinator ───

class AICoordinatorService {
    
    /**
     * Main entry point: Process an incoming request through all agents
     */
    async processRequest(request: AIRequest): Promise<AIDecision> {
        const startTime = Date.now();
        const requestId = request.requestId || `AI-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const alerts: AIDecision['alerts'] = [];
        const reasoning: string[] = [];
        
        // ── Step 1: Analyze & Enhance Request ──
        reasoning.push('Step 1: Analyzing and enhancing raw request input');
        const enhanced = this.analyzeAndEnhance(request);
        
        // ── Detect Mode ──
        const mode = this.detectMode(request.description, request.urgency);
        if (mode === 'EMERGENCY') {
            alerts.push({ type: 'critical', message: '🚨 EMERGENCY MODE ACTIVATED — Fast-tracking all agents' });
            reasoning.push('Emergency keywords detected — all agents operating in fast-track mode');
        }
        if (mode === 'CRISIS') {
            alerts.push({ type: 'critical', message: '🔴 CRISIS MODE — Mass event detected, activating institution routing' });
            reasoning.push('Crisis-level event detected — engaging mass notification and institution priority');
        }
        
        // ── Step 2: Priority & Emotion Detection ──
        reasoning.push('Step 2: Running priority & emotion analysis');
        const priority = await priorityAgent.analyze(request.description, request.urgency, request.category);
        
        if (priority.level === 'critical') {
            alerts.push({ type: 'critical', message: `Priority: CRITICAL — ${priority.emotionDetected.join(', ')} detected` });
        }
        
        // ── Step 3: Verify & Trust Score ──
        reasoning.push('Step 3: Running verification and trust scoring');
        const trust = await trustScoreAgent.evaluate({
            userId: request.userId,
            description: request.description,
            amount: request.amount,
            category: request.category,
        });
        
        if (trust.fraudRisk > 0.6) {
            alerts.push({ type: 'warning', message: `⚠️ Elevated fraud risk detected (${Math.round(trust.fraudRisk * 100)}%)` });
            reasoning.push(`Fraud risk flag at ${Math.round(trust.fraudRisk * 100)}% — manual review recommended`);
        }
        
        // ── Step 4: Match Resources ──
        reasoning.push('Step 4: Running matching algorithm');
        const matches = await matchingAgent.findMatches({
            category: request.category,
            location: request.location,
            amount: request.amount,
            urgency: priority.level,
            userId: request.userId,
        });
        
        reasoning.push(`Found ${matches.length} potential matches ranked by composite score`);
        
        // ── Step 5: Optimize Routing ──
        reasoning.push('Step 5: Computing optimal routing strategy');
        const routing = this.computeRouting(matches, priority, mode);
        
        // ── Step 6: Collaboration (if large amount) ──
        let collaboration: CollaborationPlan | undefined;
        if (request.amount && request.amount > 10000) {
            reasoning.push('Step 6: Large amount detected — computing collaboration split');
            collaboration = await collaborationAgent.planSplit({
                totalAmount: request.amount,
                currency: request.currency || 'INR',
                matches,
                category: request.category,
            });
        }
        
        // ── Step 7: Prediction ──
        reasoning.push('Step 7: Running predictive analysis');
        const prediction = await predictionAgent.predict({
            category: request.category,
            location: request.location,
            amount: request.amount,
            matchCount: matches.length,
            priorityLevel: priority.level,
            trustScore: trust.overallScore,
        });
        
        // ── Step 8: Compile Decision ──
        const processingTime = Date.now() - startTime;
        reasoning.push(`All agents completed in ${processingTime}ms`);
        
        const confidenceFactors = [
            { factor: 'Priority Detection Accuracy', weight: priority.confidence },
            { factor: 'Trust Score Reliability', weight: trust.overallScore / 100 },
            { factor: 'Match Quality', weight: matches.length > 0 ? matches[0].score : 0 },
            { factor: 'Prediction Confidence', weight: prediction.confidence },
        ];
        
        const overallConfidence = confidenceFactors.reduce((sum, f) => sum + f.weight, 0) / confidenceFactors.length;

        return {
            requestId,
            timestamp: new Date().toISOString(),
            mode,
            enhancedRequest: enhanced,
            priority,
            trust,
            matches,
            routing,
            collaboration,
            prediction,
            explanation: {
                reasoning,
                confidenceFactors,
                overallConfidence: Math.round(overallConfidence * 100) / 100,
            },
            alerts,
        };
    }

    /**
     * Analyze and enhance the raw request description
     */
    private analyzeAndEnhance(request: AIRequest) {
        const description = request.description.trim();
        const keywords = this.extractKeywords(description);
        const detectedCategory = this.inferCategory(description, request.category);
        
        // Build enhanced description
        let enhanced = description;
        if (description.length < 30) {
            // Short input → expand
            const categoryLabel = {
                food: 'food and nutrition assistance',
                medicine: 'medical supplies and healthcare support',
                clothing: 'clothing and essential materials',
                shelter: 'housing and shelter support',
                emergency: 'emergency humanitarian assistance',
                education: 'educational support and tuition assistance',
                blood: 'urgent blood donation requirement',
                general: 'general humanitarian support',
            }[detectedCategory] || 'humanitarian support';
            
            enhanced = `Request for ${categoryLabel}. ${description}${request.amount ? ` Amount needed: ₹${request.amount.toLocaleString()}.` : ''} Location: ${request.location.address || 'Provided via GPS'}.`;
        }
        
        return {
            originalDescription: description,
            enhancedDescription: enhanced,
            detectedCategory,
            detectedKeywords: keywords,
            structuredFields: {
                category: detectedCategory,
                estimatedAmount: request.amount,
                location: request.location.address,
                beneficiaryCount: this.extractBeneficiaryCount(description),
            },
        };
    }

    /**
     * Detect system mode based on input
     */
    private detectMode(description: string, urgency?: string): 'NORMAL' | 'EMERGENCY' | 'CRISIS' {
        const lower = description.toLowerCase();
        
        if (CRISIS_KEYWORDS.some(k => lower.includes(k))) return 'CRISIS';
        if (urgency === 'critical') return 'EMERGENCY';
        if (EMERGENCY_KEYWORDS.filter(k => lower.includes(k)).length >= 2) return 'EMERGENCY';
        if (EMERGENCY_KEYWORDS.some(k => lower.includes(k))) return 'EMERGENCY';
        
        return 'NORMAL';
    }

    /**
     * Compute optimal routing strategy
     */
    private computeRouting(
        matches: MatchResult[],
        priority: PriorityResult,
        mode: string
    ) {
        let strategy: 'sequential' | 'parallel' | 'broadcast' = 'sequential';
        let notifyCount = Math.min(matches.length, 5);
        let estimatedResponseTime = '2-4 hours';
        
        if (mode === 'CRISIS') {
            strategy = 'broadcast';
            notifyCount = matches.length;
            estimatedResponseTime = '5-15 minutes';
        } else if (mode === 'EMERGENCY' || priority.level === 'critical') {
            strategy = 'parallel';
            notifyCount = Math.min(matches.length, 10);
            estimatedResponseTime = '10-30 minutes';
        } else if (priority.level === 'high') {
            strategy = 'parallel';
            notifyCount = Math.min(matches.length, 7);
            estimatedResponseTime = '1-2 hours';
        }

        const escalationPlan = [
            `T+0: Notify top ${notifyCount} matches via ${strategy} strategy`,
            priority.level === 'critical' ? 'T+5min: If no response → escalate to institutions' : 'T+30min: If no response → expand search radius',
            'T+1hr: If still unresolved → alert admin for manual intervention',
            mode === 'CRISIS' ? 'T+0: Simultaneously contact emergency services' : '',
        ].filter(Boolean);

        return { notifyCount, strategy, estimatedResponseTime, escalationPlan };
    }

    /**
     * Extract keywords from description
     */
    private extractKeywords(text: string): string[] {
        const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'i', 'we', 'they', 'it', 'for', 'to', 'and', 'in', 'of', 'on', 'at', 'my', 'need', 'help', 'please']);
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.has(w));
    }

    /**
     * Infer category from description
     */
    private inferCategory(text: string, providedCategory: string): string {
        const lower = text.toLowerCase();
        const categoryMap: Record<string, string[]> = {
            food: ['food', 'hungry', 'meal', 'eat', 'nutrition', 'groceries', 'rice', 'wheat'],
            medicine: ['medicine', 'medical', 'hospital', 'doctor', 'health', 'treatment', 'surgery', 'prescription'],
            blood: ['blood', 'transfusion', 'donor', 'b+', 'o+', 'a+', 'ab+', 'blood group'],
            education: ['education', 'school', 'college', 'fees', 'tuition', 'student', 'books', 'scholarship'],
            shelter: ['shelter', 'house', 'home', 'rent', 'homeless', 'accommodation'],
            clothing: ['clothing', 'clothes', 'dress', 'wear', 'blanket', 'winter'],
            emergency: ['emergency', 'urgent', 'accident', 'ambulance', 'fire', 'flood', 'disaster'],
        };
        
        for (const [cat, keywords] of Object.entries(categoryMap)) {
            if (keywords.some(k => lower.includes(k))) return cat;
        }
        
        return providedCategory || 'general';
    }

    /**
     * Extract beneficiary count from text
     */
    private extractBeneficiaryCount(text: string): number {
        const match = text.match(/(\d+)\s*(people|persons|children|kids|families|students|members|individuals)/i);
        return match ? parseInt(match[1]) : 1;
    }

    // ─── Quick Helper Methods ───

    /**
     * Analyze a request description quickly (for the form enhancer)
     */
    async analyzeDescription(description: string) {
        const keywords = this.extractKeywords(description);
        const category = this.inferCategory(description, 'general');
        const mode = this.detectMode(description);
        const emotions = this.detectEmotions(description);
        
        return {
            keywords,
            category,
            mode,
            emotions,
            isUrgent: mode !== 'NORMAL',
            enhancedDescription: description.length < 30
                ? `Request for ${category} assistance: ${description}`
                : description,
            suggestedFields: {
                urgency: mode === 'EMERGENCY' ? 'critical' : mode === 'CRISIS' ? 'critical' : emotions.length > 0 ? 'high' : 'medium',
                category,
            },
        };
    }

    /**
     * Detect emotions in text
     */
    private detectEmotions(text: string): string[] {
        const lower = text.toLowerCase();
        const detected: string[] = [];
        
        for (const [emotion, indicators] of Object.entries(EMOTION_INDICATORS)) {
            if (indicators.some(ind => lower.includes(ind))) {
                detected.push(emotion);
            }
        }
        
        return detected;
    }

    /**
     * Generate an impact story for a completed help request
     */
    async generateImpactStory(requestData: {
        category: string;
        description: string;
        donorName: string;
        recipientLocation: string;
        amount?: number;
        completedAt: string;
    }) {
        return storyAgent.generate(requestData);
    }
}

export const aiCoordinator = new AICoordinatorService();
