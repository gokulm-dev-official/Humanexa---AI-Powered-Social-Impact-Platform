/**
 * Photo Validation Service — Feature 2
 * Validates GPS coordinates, timestamp, and quality of uploaded proof photos.
 * Uses EXIF metadata extraction for strict geotag verification.
 */

export interface PhotoValidationResult {
    isValid: boolean;
    gps: {
        found: boolean;
        latitude?: number;
        longitude?: number;
        distanceFromFacility?: number;
        withinRadius: boolean;
    };
    timestamp: {
        found: boolean;
        photoTime?: Date;
        serverTime: Date;
        deviationSeconds?: number;
        withinTolerance: boolean;
    };
    quality: {
        resolution: { width: number; height: number };
        fileSize: number;
        format: string;
        isValid: boolean;
    };
    errors: Array<{
        code: 'NO_GPS' | 'WRONG_LOCATION' | 'TIME_MISMATCH' | 'LOW_QUALITY' | 'EDITED';
        message: string;
        details: any;
    }>;
}

// Haversine distance in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Validate a photo using provided metadata.
 * In production, EXIF data would be extracted from the image buffer using `sharp` or `exif-parser`.
 * For this implementation, metadata is passed from the client (which reads EXIF via browser APIs).
 */
export const validatePhoto = (
    photoMetadata: {
        gpsLatitude?: number;
        gpsLongitude?: number;
        timestamp?: string | Date;
        width?: number;
        height?: number;
        fileSize?: number;
        format?: string;
    },
    facilityCoords: { latitude: number; longitude: number },
    allowedRadiusMeters: number = 50,
    timeToleranceSeconds: number = 120
): PhotoValidationResult => {
    const errors: PhotoValidationResult['errors'] = [];
    const serverTime = new Date();

    // --- GPS Validation ---
    let gpsResult: PhotoValidationResult['gps'] = {
        found: false,
        withinRadius: false,
    };

    if (photoMetadata.gpsLatitude != null && photoMetadata.gpsLongitude != null) {
        const distance = calculateDistanceMeters(
            photoMetadata.gpsLatitude,
            photoMetadata.gpsLongitude,
            facilityCoords.latitude,
            facilityCoords.longitude
        );

        gpsResult = {
            found: true,
            latitude: photoMetadata.gpsLatitude,
            longitude: photoMetadata.gpsLongitude,
            distanceFromFacility: Math.round(distance),
            withinRadius: distance <= allowedRadiusMeters,
        };

        if (!gpsResult.withinRadius) {
            errors.push({
                code: 'WRONG_LOCATION',
                message: `Photo was taken ${Math.round(distance)}m from facility. Must be within ${allowedRadiusMeters}m.`,
                details: {
                    photoLat: photoMetadata.gpsLatitude,
                    photoLng: photoMetadata.gpsLongitude,
                    facilityLat: facilityCoords.latitude,
                    facilityLng: facilityCoords.longitude,
                    distance: Math.round(distance),
                    required: allowedRadiusMeters,
                },
            });
        }
    } else {
        errors.push({
            code: 'NO_GPS',
            message: 'No GPS data found in photo. Location services must be enabled.',
            details: {},
        });
    }

    // --- Timestamp Validation ---
    let timestampResult: PhotoValidationResult['timestamp'] = {
        found: false,
        serverTime,
        withinTolerance: false,
    };

    if (photoMetadata.timestamp) {
        const photoTime = new Date(photoMetadata.timestamp);
        const deviationMs = Math.abs(serverTime.getTime() - photoTime.getTime());
        const deviationSeconds = Math.round(deviationMs / 1000);

        timestampResult = {
            found: true,
            photoTime,
            serverTime,
            deviationSeconds,
            withinTolerance: deviationSeconds <= timeToleranceSeconds,
        };

        if (!timestampResult.withinTolerance) {
            errors.push({
                code: 'TIME_MISMATCH',
                message: `Photo timestamp deviates by ${deviationSeconds}s. Maximum allowed is ${timeToleranceSeconds}s (2 minutes).`,
                details: {
                    photoTime: photoTime.toISOString(),
                    serverTime: serverTime.toISOString(),
                    deviationSeconds,
                    maxAllowed: timeToleranceSeconds,
                },
            });
        }
    } else {
        errors.push({
            code: 'TIME_MISMATCH',
            message: 'No timestamp found in photo metadata.',
            details: {},
        });
    }

    // --- Quality Validation ---
    const width = photoMetadata.width || 0;
    const height = photoMetadata.height || 0;
    const fileSize = photoMetadata.fileSize || 0;
    const format = (photoMetadata.format || 'unknown').toLowerCase();
    const validFormats = ['jpeg', 'jpg', 'png', 'webp'];
    const isFormatValid = validFormats.includes(format);
    const isResolutionValid = width >= 640 && height >= 480;

    const qualityResult: PhotoValidationResult['quality'] = {
        resolution: { width, height },
        fileSize,
        format,
        isValid: isFormatValid && isResolutionValid,
    };

    if (!qualityResult.isValid) {
        errors.push({
            code: 'LOW_QUALITY',
            message: `Photo quality insufficient. Min resolution: 640x480. Format: JPEG/PNG.`,
            details: { width, height, format, isFormatValid, isResolutionValid },
        });
    }

    return {
        isValid: errors.length === 0,
        gps: gpsResult,
        timestamp: timestampResult,
        quality: qualityResult,
        errors,
    };
};

/**
 * Validate multiple photos for a verification task submission.
 */
export const validateMultiplePhotos = (
    photos: Array<{
        gpsLatitude?: number;
        gpsLongitude?: number;
        timestamp?: string | Date;
        width?: number;
        height?: number;
        fileSize?: number;
        format?: string;
    }>,
    facilityCoords: { latitude: number; longitude: number },
    allowedRadiusMeters: number = 50
): { allValid: boolean; results: PhotoValidationResult[] } => {
    const results = photos.map((photo) => validatePhoto(photo, facilityCoords, allowedRadiusMeters));
    return {
        allValid: results.every((r) => r.isValid),
        results,
    };
};

export const getDistanceMeters = calculateDistanceMeters;
