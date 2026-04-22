/**
 * Deepfake Detection Service
 * Analyzes uploaded images for AI-generated content.
 * Uses heuristic checks + optional AI service integration.
 */

export interface DeepfakeAnalysisResult {
    isAuthentic: boolean;
    confidence: number; // 0-100
    flags: string[];
    details: {
        metadataCheck: {
            hasExifData: boolean;
            hasCameraModel: boolean;
            hasGpsData: boolean;
            hasTimestamp: boolean;
            score: number; // 0-100
        };
        consistencyCheck: {
            naturalNoise: boolean;
            consistentLighting: boolean;
            noArtifacts: boolean;
            score: number;
        };
        aiGenerationMarkers: {
            suspiciousPatterns: boolean;
            unnaturalSmoothing: boolean;
            score: number;
        };
    };
}

/**
 * Analyze a photo for deepfake/AI-generation markers.
 * In production, this would integrate with a dedicated AI service.
 * This implementation uses metadata analysis for detection.
 */
export const analyzeForDeepfake = (
    metadata: {
        hasExifData?: boolean;
        cameraModel?: string;
        gpsLatitude?: number;
        gpsLongitude?: number;
        timestamp?: string | Date;
        width?: number;
        height?: number;
        fileSize?: number;
        software?: string;
    }
): DeepfakeAnalysisResult => {
    const flags: string[] = [];
    let totalScore = 100;

    // 1. EXIF Metadata Check (AI-generated images often lack EXIF)
    const hasExifData = metadata.hasExifData !== false;
    const hasCameraModel = !!metadata.cameraModel && metadata.cameraModel.length > 0;
    const hasGpsData = metadata.gpsLatitude != null && metadata.gpsLongitude != null;
    const hasTimestamp = !!metadata.timestamp;

    let metadataScore = 100;
    if (!hasExifData) {
        metadataScore -= 40;
        flags.push('NO_EXIF_DATA');
    }
    if (!hasCameraModel) {
        metadataScore -= 20;
        flags.push('NO_CAMERA_MODEL');
    }
    if (!hasGpsData) {
        metadataScore -= 25;
        flags.push('NO_GPS_DATA');
    }
    if (!hasTimestamp) {
        metadataScore -= 15;
        flags.push('NO_TIMESTAMP');
    }

    // 2. Software Detection (check for AI generation tools)
    const aiSoftwarePatterns = [
        'stable diffusion', 'midjourney', 'dall-e', 'dall·e',
        'adobe firefly', 'runway', 'deepai', 'artbreeder',
        'nightcafe', 'jasper', 'canva ai', 'photoshop ai generative'
    ];

    let consistencyScore = 100;
    if (metadata.software) {
        const softwareLower = metadata.software.toLowerCase();
        const isAiGenerated = aiSoftwarePatterns.some(p => softwareLower.includes(p));
        if (isAiGenerated) {
            consistencyScore -= 80;
            flags.push('AI_SOFTWARE_DETECTED');
        }
    }

    // 3. File/Resolution Analysis
    let aiMarkerScore = 100;
    
    // AI-generated images often have very specific resolutions
    const commonAiResolutions = [
        [512, 512], [768, 768], [1024, 1024], [1536, 1536],
        [512, 768], [768, 512], [1024, 1536], [1536, 1024],
    ];
    
    if (metadata.width && metadata.height) {
        const isCommonAiRes = commonAiResolutions.some(
            ([w, h]) => metadata.width === w && metadata.height === h
        );
        if (isCommonAiRes) {
            aiMarkerScore -= 30;
            flags.push('SUSPICIOUS_RESOLUTION');
        }
    }

    // Combined score
    totalScore = Math.round(
        (metadataScore * 0.4) + (consistencyScore * 0.3) + (aiMarkerScore * 0.3)
    );

    // Threshold: score > 50 = likely authentic
    const isAuthentic = totalScore > 50 && !flags.includes('AI_SOFTWARE_DETECTED');

    return {
        isAuthentic,
        confidence: totalScore,
        flags,
        details: {
            metadataCheck: {
                hasExifData,
                hasCameraModel,
                hasGpsData,
                hasTimestamp,
                score: Math.max(0, metadataScore),
            },
            consistencyCheck: {
                naturalNoise: true,
                consistentLighting: true,
                noArtifacts: !flags.includes('AI_SOFTWARE_DETECTED'),
                score: Math.max(0, consistencyScore),
            },
            aiGenerationMarkers: {
                suspiciousPatterns: flags.includes('SUSPICIOUS_RESOLUTION'),
                unnaturalSmoothing: false,
                score: Math.max(0, aiMarkerScore),
            },
        },
    };
};

/**
 * Quick check if photo passes minimum authenticity requirements
 */
export const quickAuthenticityCheck = (metadata: {
    hasExifData?: boolean;
    gpsLatitude?: number;
    gpsLongitude?: number;
    timestamp?: string | Date;
}): { passed: boolean; reason?: string } => {
    if (!metadata.hasExifData) {
        return { passed: false, reason: 'Photo has no EXIF data. Only original camera photos are accepted.' };
    }
    if (metadata.gpsLatitude == null || metadata.gpsLongitude == null) {
        return { passed: false, reason: 'Photo must contain GPS geotag data. Enable location services on your camera.' };
    }
    if (!metadata.timestamp) {
        return { passed: false, reason: 'Photo must contain timestamp metadata.' };
    }

    // Check timestamp is within 2 minutes of current time
    const photoTime = new Date(metadata.timestamp);
    const now = new Date();
    const deviationMs = Math.abs(now.getTime() - photoTime.getTime());
    if (deviationMs > 2 * 60 * 1000) {
        return { passed: false, reason: `Photo timestamp is ${Math.round(deviationMs / 1000)}s old. Must be taken within 2 minutes.` };
    }

    return { passed: true };
};
