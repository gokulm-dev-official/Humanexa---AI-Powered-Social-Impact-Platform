/**
 * ═══════════════════════════════════════════════════════════════════
 * 📝 STORY AGENT — Impact Narrative Generator
 * ═══════════════════════════════════════════════════════════════════
 * 
 * After a help request is completed, generates a human-readable
 * impact story suitable for:
 *   - Social media sharing
 *   - NGO reports
 *   - Platform feed
 *   - Awareness campaigns
 */

// ─── Types ───

interface StoryInput {
    category: string;
    description: string;
    donorName: string;
    recipientLocation: string;
    amount?: number;
    completedAt: string;
}

interface StoryOutput {
    headline: string;
    shortStory: string;       // 1-2 sentences
    fullStory: string;        // 3-5 sentences
    socialCaption: string;    // For Twitter/LinkedIn
    tags: string[];
    impactMetric: string;
}

// ─── Story Templates ───

const STORY_TEMPLATES: Record<string, { headlines: string[]; openings: string[]; closings: string[] }> = {
    food: {
        headlines: [
            'Nourishing Lives, One Meal at a Time',
            'From Hunger to Hope',
            'A Warm Meal Changed Everything',
        ],
        openings: [
            'In {location}, a family was struggling with food insecurity.',
            'When meals became uncertain in {location}, a stranger stepped in.',
            'What started as a call for help became a story of human connection.',
        ],
        closings: [
            'Because of one person\'s generosity, no one went hungry that night.',
            'This act of kindness proves that community can conquer hunger.',
            'Today, the table is set — not just with food, but with hope.',
        ],
    },
    medicine: {
        headlines: [
            'Healing Through Humanity',
            'When Medicine Meets Compassion',
            'A Prescription for Hope',
        ],
        openings: [
            'A patient in {location} needed urgent medical support.',
            'Healthcare became accessible for someone in {location} thanks to a donor.',
            'When medical bills seemed insurmountable, help arrived.',
        ],
        closings: [
            'Health was restored, and faith in humanity renewed.',
            'Because someone cared, treatment was possible.',
            'The road to recovery began with a single act of compassion.',
        ],
    },
    education: {
        headlines: [
            'Opening Doors to the Future',
            'Education, Funded by Kindness',
            'A Student\'s Dream, Made Possible',
        ],
        openings: [
            'A student in {location} was at risk of dropping out.',
            'Education almost became a luxury — until a donor changed everything.',
            'Dreams of learning were fading in {location}, but hope prevailed.',
        ],
        closings: [
            'Education is a light that cannot be extinguished once ignited.',
            'This student\'s future is now brighter, thanks to generosity.',
            'Knowledge has no barriers when kindness leads the way.',
        ],
    },
    emergency: {
        headlines: [
            'When Every Second Counts',
            'Emergency Response, Powered by People',
            'Humanity in Action During Crisis',
        ],
        openings: [
            'An emergency unfolded in {location}, and time was critical.',
            'In the face of crisis in {location}, the community responded instantly.',
            'When disaster struck, strangers became heroes.',
        ],
        closings: [
            'In emergencies, the speed of human response saves lives.',
            'This is what happens when technology meets compassion.',
            'Every emergency response tells a story of resilience.',
        ],
    },
    general: {
        headlines: [
            'Impact Made Visible',
            'Connection Through Compassion',
            'One Act, Infinite Ripples',
        ],
        openings: [
            'In {location}, a request for help reached the right person.',
            'What seemed like a small act of kindness created a ripple effect.',
            'Two strangers connected through a shared purpose.',
        ],
        closings: [
            'Small acts of kindness create waves of change.',
            'This is proof that humanity is alive and well.',
            'When we choose to help, the world gets a little better.',
        ],
    },
};

class StoryAgent {

    /**
     * Generate an impact story from request data
     */
    generate(input: StoryInput): StoryOutput {
        const templates = STORY_TEMPLATES[input.category] || STORY_TEMPLATES.general;
        
        const headline = this.pickRandom(templates.headlines);
        const opening = this.pickRandom(templates.openings).replace('{location}', input.recipientLocation || 'a community in need');
        const closing = this.pickRandom(templates.closings);

        const amountText = input.amount ? `₹${input.amount.toLocaleString()} in support` : 'crucial support';
        const donorRef = input.donorName || 'A generous donor';

        const shortStory = `${donorRef} provided ${amountText} for ${input.category} assistance in ${input.recipientLocation || 'their community'}. ${closing}`;

        const fullStory = `${opening} ${donorRef} responded through the Social Kind platform, providing ${amountText}. ${input.description ? `The request described: "${input.description.substring(0, 120)}${input.description.length > 120 ? '...' : ''}"` : ''} On ${input.completedAt}, the help was successfully delivered and verified. ${closing}`;

        const socialCaption = `🌟 ${headline}\n\n${shortStory}\n\n#SocialKind #ImpactStory #HumanityInAction #${input.category.charAt(0).toUpperCase() + input.category.slice(1)}`;

        const tags = [
            '#SocialKind',
            '#VerifiedImpact',
            `#${input.category.charAt(0).toUpperCase() + input.category.slice(1)}`,
            '#HumanityInAction',
            '#TransparentGiving',
        ];

        const impactMetric = input.amount
            ? `₹${input.amount.toLocaleString()} verified impact`
            : '1 verified social impact act';

        return {
            headline,
            shortStory,
            fullStory,
            socialCaption,
            tags,
            impactMetric,
        };
    }

    private pickRandom(arr: string[]): string {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}

export const storyAgent = new StoryAgent();
