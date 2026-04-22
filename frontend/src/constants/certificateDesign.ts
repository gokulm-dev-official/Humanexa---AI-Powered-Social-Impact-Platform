/**
 * 💎 HUMANEXA ULTRA-PREMIUM CERTIFICATE DESIGN SYSTEM
 * Museum-Grade • Presidential-Level • Heirloom Quality
 * 
 * All measurements are EXACT per the specification document.
 */

// ═════════════════════════════════════════════════════════════════════════
// CANVAS & MEASUREMENTS
// ═════════════════════════════════════════════════════════════════════════

export const CANVAS = {
    // Physical A4 Landscape dimensions
    WIDTH_MM: 297,
    HEIGHT_MM: 210,

    // Digital resolution @ 300 DPI
    WIDTH_PX: 3508,
    HEIGHT_PX: 2480,
    DPI: 300,

    // Safe print area (15mm margin all sides)
    SAFE_AREA: {
        MARGIN_MM: 15,
        WIDTH_MM: 180,
        HEIGHT_MM: 267,
    },

    // Bleed zone
    BLEED_MM: 3,

    // Grid system
    GRID: {
        COLUMNS: 12,
        COLUMN_WIDTH_MM: 15,
        GUTTER_MM: 5,
        BASE_UNIT_MM: 3,
    }
} as const;

// Helper to convert mm to px @ 300 DPI
export const mmToPx = (mm: number): number => Math.round((mm / 25.4) * CANVAS.DPI);

// ═════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY SCALE (Exact Sizes)
// ═════════════════════════════════════════════════════════════════════════

export const TYPOGRAPHY = {
    LEVEL_1_ORG: { PT: 36, MM: 12.7, PX: mmToPx(12.7) },        // Organization
    LEVEL_2_TITLE: { PT: 28, MM: 9.9, PX: mmToPx(9.9) },       // Main Title
    LEVEL_3_TIER: { PT: 64, MM: 22.6, PX: mmToPx(22.6) },      // Tier Name
    LEVEL_4_NAME: { PT: 72, MM: 25.4, PX: mmToPx(25.4) },      // Recipient Name
    LEVEL_5_BODY: { PT: 15, MM: 5.3, PX: mmToPx(5.3) },        // Body Text
    LEVEL_6_META: { PT: 10, MM: 3.5, PX: mmToPx(3.5) },        // Metadata
    LEVEL_7_FINE: { PT: 8, MM: 2.8, PX: mmToPx(2.8) },         // Fine Print
} as const;

// ═════════════════════════════════════════════════════════════════════════
// COLOR SYSTEM (PANTONE + CMYK + RGB + HEX)
// ═════════════════════════════════════════════════════════════════════════

export const COLORS = {
    WELCOME: {
        NAME: 'Welcome Tier',
        PRIMARY: {
            PANTONE: '2925 C',
            CMYK: { C: 70, M: 15, Y: 0, K: 0 },
            RGB: { R: 0, G: 114, B: 206 },
            HEX: '#0072CE',
        },
        SECONDARY: {
            PANTONE: '7737 C',
            CMYK: { C: 65, M: 0, Y: 100, K: 0 },
            RGB: { R: 0, G: 177, B: 64 },
            HEX: '#00B140',
        },
    },

    BRONZE: {
        NAME: 'Bronze Tier',
        PRIMARY: {
            PANTONE: '876 C',
            CMYK: { C: 20, M: 40, Y: 70, K: 20 },
            RGB: { R: 167, G: 124, B: 82 },
            HEX: '#A77C52',
        },
        SECONDARY: {
            PANTONE: '7587 C',
            CMYK: { C: 10, M: 30, Y: 80, K: 0 },
            RGB: { R: 227, G: 168, B: 48 },
            HEX: '#E3A830',
        },
    },

    SILVER: {
        NAME: 'Silver Tier',
        PRIMARY: {
            PANTONE: '877 C',
            CMYK: { C: 30, M: 20, Y: 20, K: 0 },
            RGB: { R: 179, G: 188, B: 191 },
            HEX: '#B3BCBF',
        },
        SECONDARY: {
            PANTONE: 'Cool Gray 9 C',
            CMYK: { C: 50, M: 40, Y: 30, K: 10 },
            RGB: { R: 124, G: 135, B: 142 },
            HEX: '#7C878E',
        },
    },

    GOLD: {
        NAME: 'Gold Tier',
        PRIMARY: {
            PANTONE: '871 C',
            CMYK: { C: 0, M: 20, Y: 80, K: 20 },
            RGB: { R: 212, G: 175, B: 55 },
            HEX: '#D4AF37',
        },
        SECONDARY: {
            PANTONE: '7563 C',
            CMYK: { C: 0, M: 30, Y: 100, K: 0 },
            RGB: { R: 255, G: 184, B: 28 },
            HEX: '#FFB81C',
        },
        DARK: {
            PANTONE: '876 C',
            HEX: '#B8860B',
        },
        PURE: {
            PANTONE: '123 C',
            HEX: '#FFD700',
        },
    },

    PLATINUM: {
        NAME: 'Platinum Tier',
        PRIMARY: {
            PANTONE: '877 C + Metallic Silver',
            CMYK: { C: 25, M: 15, Y: 15, K: 0 },
            RGB: { R: 192, G: 192, B: 192 },
            HEX: '#C0C0C0',
        },
        SECONDARY: {
            PANTONE: '2728 C',
            CMYK: { C: 100, M: 50, Y: 0, K: 0 },
            RGB: { R: 0, G: 114, B: 206 },
            HEX: '#0072CE',
        },
    },

    DIAMOND: {
        NAME: 'Diamond Tier',
        PRIMARY: {
            PANTONE: 'Process Cyan + White',
            CMYK: { C: 10, M: 0, Y: 0, K: 0 },
            RGB: { R: 230, G: 247, B: 255 },
            HEX: '#E6F7FF',
        },
        PRISMATIC: 'rainbow-gradient', // All spectral colors
    },

    // Neutral colors used across all tiers
    NEUTRAL: {
        BLACK_6: '#0F172A',    // PANTONE Black 6 C
        BLACK_NEAR: '#1C1917', // Near-black for contrast
        DARK_BROWN_GOLD: '#92400E', // PANTONE 469 C
        DARK_GOLD: '#78350F',  // PANTONE 4695 C
        SLATE: {
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
        },
    },
} as const;

// ═════════════════════════════════════════════════════════════════════════
// TIER THRESHOLDS
// ═════════════════════════════════════════════════════════════════════════

export const TIER_THRESHOLDS = {
    WELCOME: { acts: 1, name: 'Welcome', description: 'Your Journey Begins' },
    BRONZE: { acts: 5, name: 'Bronze Achiever', description: 'Rising Momentum' },
    SILVER: { acts: 25, name: 'Silver Distinction', description: 'Sustained Excellence' },
    GOLD: { acts: 50, name: 'Gold Guardian', description: 'The Pinnacle Honor' },
    PLATINUM: { acts: 100, name: 'Platinum Luminary', description: 'Legendary Status' },
    DIAMOND: { acts: 250, name: 'Diamond Icon', description: 'Eternal Divinity' },
} as const;

// ═════════════════════════════════════════════════════════════════════════
// FONTS
// ═════════════════════════════════════════════════════════════════════════

export const FONTS = {
    HEADING: "'Playfair Display', serif",
    BODY: "'Inter', sans-serif",
    DECORATIVE: "'Cormorant Garamond', serif",
    SCRIPT: "'Edwardian Script ITC', 'Great Vibes', cursive",
    SERIF_CLASSIC: "'Georgia', serif",
    MONOSPACE: "'JetBrains Mono', monospace",
} as const;

// ═════════════════════════════════════════════════════════════════════════
// LAYOUT POSITIONS (for Gold Tier - see spec for exact coordinates)
// ═════════════════════════════════════════════════════════════════════════

export const GOLD_LAYOUT = {
    BORDER: {
        OUTER: { X: 10, Y: 10, WIDTH: 190, HEIGHT: 277 },
        LINE_1_WIDTH: 5, // px solid
        GAP_1: 3, // mm
        LINE_2_WIDTH: 2, // px intricate scrollwork
        GAP_2: 2, // mm
        LINE_3_WIDTH: 3, // px solid
    },

    CORNER_ORNAMENTS: {
        SIZE: 25, // mm × mm
        INSET: 10, // mm from edges
    },

    HEADER: {
        X: 105, // CENTER X
        Y: 28,
        WIDTH: 180,
        HEIGHT: 35,
    },

    ILLUSTRATION: {
        X: 105, // CENTER
        Y: 110,
        SIZE_PX: 180, // 180px × 180px
        SIZE_MM: 63.5,
    },

    RECIPIENT_NAME: {
        X: 105, // CENTER
        Y: 220,
        FONT_SIZE: 72, // pt
    },

    QR_CODE: {
        X: 40,
        Y: 438,
        SIZE_MM: 130,
        SIZE_PX: mmToPx(130),
    },

    SEAL: {
        X: 125,
        Y: 438,
        DIAMETER_MM: 130,
    },
} as const;

// ═════════════════════════════════════════════════════════════════════════
// CERTIFICATE ID FORMATS
// ═════════════════════════════════════════════════════════════════════════

export const ID_FORMAT = {
    WELCOME: 'HMX-WELCOME-{YEAR}-{INITIALS}-{SEQ}',
    BRONZE: 'HMX-BRONZE-{YEAR}-{INITIALS}-{SEQ}',
    SILVER: 'HMX-SILVER-{YEAR}-{INITIALS}-{SEQ}',
    GOLD: 'HMX-GOLD-{YEAR}-{INITIALS}-{SEQ}',
    PLATINUM: 'HMX-PLATINUM-{YEAR}-{INITIALS}-{SEQ}',
    DIAMOND: 'HMX-DIAMOND-{YEAR}-{INITIALS}-{SEQ}',
} as const;

// ═════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════

export const generateCertificateID = (
    tier: keyof typeof TIER_THRESHOLDS,
    initials: string,
    sequence: number
): string => {
    const year = new Date().getFullYear();
    const seq = sequence.toString().padStart(6, '0');
    return `HMX-${tier.toUpperCase()}-${year}-${initials.toUpperCase()}-${seq}`;
};

export const getTierByActs = (acts: number): keyof typeof TIER_THRESHOLDS => {
    if (acts >= TIER_THRESHOLDS.DIAMOND.acts) return 'DIAMOND';
    if (acts >= TIER_THRESHOLDS.PLATINUM.acts) return 'PLATINUM';
    if (acts >= TIER_THRESHOLDS.GOLD.acts) return 'GOLD';
    if (acts >= TIER_THRESHOLDS.SILVER.acts) return 'SILVER';
    if (acts >= TIER_THRESHOLDS.BRONZE.acts) return 'BRONZE';
    return 'WELCOME';
};

export const getTierColors = (tier: string) => {
    const tierUpper = tier.toUpperCase();
    switch (tierUpper) {
        case 'WELCOME': return COLORS.WELCOME;
        case 'BRONZE': return COLORS.BRONZE;
        case 'SILVER': return COLORS.SILVER;
        case 'GOLD': return COLORS.GOLD;
        case 'PLATINUM': return COLORS.PLATINUM;
        case 'DIAMOND': return COLORS.DIAMOND;
        default: return COLORS.WELCOME;
    }
};
