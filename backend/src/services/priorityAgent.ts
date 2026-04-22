/**
 * ═══════════════════════════════════════════════════════════════════
 * ⚡ PRIORITY & EMOTION AGENT — Urgency Intelligence
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Detects urgency level and emotional state from text using:
 *   - Keyword-based urgency classification
 *   - Sentiment/emotion analysis (panic, stress, grief, fear)
 *   - Category-based priority boosting (medical > general)
 *   - Emoji and punctuation analysis
 */

// ─── Types ───

export interface PriorityResult {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;         // 0..100
    confidence: number;    // 0..1
    emotionDetected: string[];
    urgencyFactors: string[];
    categoryBoost: number; // 0..1 extra weight
    recommendedResponseTime: string;
}

// ─── Keyword Banks ───

const URGENCY_KEYWORDS: Record<string, { words: string[]; weight: number }> = {
    critical: {
        words: ['dying', 'life-threatening', 'critical', 'emergency', 'ambulance', 'heart attack', 'stroke', 'bleeding heavily', 'collapse', 'unconscious', 'drowning', 'accident'],
        weight: 1.0,
    },
    high: {
        words: ['urgent', 'immediately', 'asap', 'quickly', 'serious', 'severe', 'hospital', 'surgery', 'blood needed', 'starving', 'homeless', 'no food', 'eviction'],
        weight: 0.75,
    },
    medium: {
        words: ['need', 'help', 'support', 'assistance', 'require', 'important', 'soon', 'worried'],
        weight: 0.45,
    },
    low: {
        words: ['sometime', 'when possible', 'not urgent', 'convenient', 'general', 'inquiry'],
        weight: 0.15,
    },
};

const EMOTION_PATTERNS: Record<string, { indicators: string[]; emojis: string[] }> = {
    panic: {
        indicators: ['please help', 'begging', 'desperate', 'anyone', 'save', 'can\'t breathe'],
        emojis: ['😭', '🆘', '😱', '🙏🙏', '❗❗'],
    },
    stress: {
        indicators: ['urgent', 'quickly', 'running out', 'deadline', 'tomorrow', 'today', 'now'],
        emojis: ['😰', '😓', '⏰', '🔴'],
    },
    grief: {
        indicators: ['passed away', 'die', 'death', 'funeral', 'lost', 'orphan', 'widow'],
        emojis: ['😢', '💔', '🕊️'],
    },
    fear: {
        indicators: ['scared', 'afraid', 'danger', 'threatened', 'violence', 'abuse', 'unsafe'],
        emojis: ['😨', '🚨', '😰'],
    },
    hope: {
        indicators: ['grateful', 'thank', 'bless', 'hope', 'dream', 'opportunity'],
        emojis: ['🙏', '🌟', '✨', '💖'],
    },
};

const CATEGORY_PRIORITY_BOOST: Record<string, number> = {
    emergency: 0.35,
    blood: 0.30,
    medicine: 0.25,
    food: 0.15,
    shelter: 0.15,
    education: 0.05,
    clothing: 0.05,
    general: 0.0,
};

class PriorityAgent {
    
    /**
     * Analyze a request for urgency and emotion
     */
    async analyze(
        description: string,
        explicitUrgency?: string,
        category?: string
    ): Promise<PriorityResult> {
        const lower = description.toLowerCase();
        
        // ── 1. Keyword-based urgency scoring ──
        let urgencyScore = 0;
        const urgencyFactors: string[] = [];
        
        for (const [level, config] of Object.entries(URGENCY_KEYWORDS)) {
            const matchedWords = config.words.filter(w => lower.includes(w));
            if (matchedWords.length > 0) {
                urgencyScore = Math.max(urgencyScore, config.weight);
                urgencyFactors.push(`${level} keywords: ${matchedWords.join(', ')}`);
            }
        }

        // ── 2. Explicit urgency override ──
        if (explicitUrgency) {
            const explicitMap: Record<string, number> = {
                critical: 1.0, high: 0.75, medium: 0.45, low: 0.15,
            };
            const explicitScore = explicitMap[explicitUrgency] || 0.45;
            urgencyScore = Math.max(urgencyScore, explicitScore);
            urgencyFactors.push(`Explicit urgency: ${explicitUrgency}`);
        }

        // ── 3. Emotion detection ──
        const emotionDetected: string[] = [];
        let emotionBoost = 0;
        
        for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS)) {
            const wordMatch = patterns.indicators.some(ind => lower.includes(ind));
            const emojiMatch = patterns.emojis.some(e => description.includes(e));
            
            if (wordMatch || emojiMatch) {
                emotionDetected.push(emotion);
                if (emotion === 'panic' || emotion === 'fear') emotionBoost += 0.15;
                if (emotion === 'stress') emotionBoost += 0.10;
                if (emotion === 'grief') emotionBoost += 0.08;
            }
        }

        // ── 4. Punctuation intensity ──
        const exclamationCount = (description.match(/!/g) || []).length;
        const capsRatio = (description.match(/[A-Z]/g) || []).length / Math.max(description.length, 1);
        
        if (exclamationCount >= 3) {
            emotionBoost += 0.05;
            urgencyFactors.push('High punctuation intensity');
        }
        if (capsRatio > 0.5) {
            emotionBoost += 0.05;
            urgencyFactors.push('Predominant uppercase text (possible distress)');
        }

        // ── 5. Category boost ──
        const categoryBoost = CATEGORY_PRIORITY_BOOST[category || 'general'] || 0;
        if (categoryBoost > 0) {
            urgencyFactors.push(`Category priority: ${category} (+${Math.round(categoryBoost * 100)}%)`);
        }

        // ── 6. Final score ──
        const finalScore = Math.min(1, urgencyScore + emotionBoost + categoryBoost);
        const scorePercent = Math.round(finalScore * 100);

        // Determine level
        let level: PriorityResult['level'] = 'low';
        if (finalScore >= 0.85) level = 'critical';
        else if (finalScore >= 0.6) level = 'high';
        else if (finalScore >= 0.35) level = 'medium';

        // Recommended response time
        const responseTimeMap: Record<string, string> = {
            critical: '< 15 minutes',
            high: '< 1 hour',
            medium: '< 4 hours',
            low: '< 24 hours',
        };

        // Confidence (higher when we have more data points)
        const dataPoints = urgencyFactors.length + emotionDetected.length;
        const confidence = Math.min(0.98, 0.5 + (dataPoints * 0.08));

        return {
            level,
            score: scorePercent,
            confidence: Math.round(confidence * 100) / 100,
            emotionDetected,
            urgencyFactors,
            categoryBoost,
            recommendedResponseTime: responseTimeMap[level],
        };
    }
}

export const priorityAgent = new PriorityAgent();
