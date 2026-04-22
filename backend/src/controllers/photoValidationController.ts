import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { validatePhoto, validateMultiplePhotos } from '../services/photoValidationService';
import ProofVerification from '../models/ProofVerification';

// POST /api/v1/verification/validate-photo
export const validateSinglePhoto = async (req: AuthRequest, res: Response) => {
    try {
        const { photoMetadata, facilityLat, facilityLon, allowedRadius } = req.body;

        if (!photoMetadata || !facilityLat || !facilityLon) {
            return res.status(400).json({
                status: 'fail',
                message: 'photoMetadata, facilityLat, facilityLon are required.',
            });
        }

        const result = validatePhoto(
            photoMetadata,
            { latitude: facilityLat, longitude: facilityLon },
            allowedRadius || 50,
            120 // 2 minutes tolerance
        );

        res.status(200).json({
            status: 'success',
            data: { validation: result },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// POST /api/v1/verification/validate-batch
export const validateBatchPhotos = async (req: AuthRequest, res: Response) => {
    try {
        const { photos, facilityLat, facilityLon, allowedRadius } = req.body;

        if (!photos || !Array.isArray(photos) || !facilityLat || !facilityLon) {
            return res.status(400).json({
                status: 'fail',
                message: 'photos array, facilityLat, facilityLon are required.',
            });
        }

        const result = validateMultiplePhotos(
            photos,
            { latitude: facilityLat, longitude: facilityLon },
            allowedRadius || 50
        );

        res.status(200).json({
            status: 'success',
            data: {
                allValid: result.allValid,
                totalPhotos: photos.length,
                validCount: result.results.filter((r) => r.isValid).length,
                invalidCount: result.results.filter((r) => !r.isValid).length,
                results: result.results,
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// POST /api/v1/verification/upload-proof
export const uploadProof = async (req: AuthRequest, res: Response) => {
    try {
        const { requestId, photos, facilityLat, facilityLon } = req.body;

        if (!requestId || !photos || !Array.isArray(photos) || photos.length < 1) {
            return res.status(400).json({
                status: 'fail',
                message: 'requestId and at least 1 photo are required.',
            });
        }

        // Validate all photos
        const validation = validateMultiplePhotos(
            photos,
            { latitude: facilityLat || 0, longitude: facilityLon || 0 },
            50
        );

        const images = photos.map((p: any, i: number) => ({
            originalUrl: p.url || `mock_photo_${i}`,
            imageHash: `hash_${Date.now()}_${i}`,
        }));

        const proof = await ProofVerification.create({
            helpRequestId: requestId,
            uploadedBy: req.user!._id,
            images,
            uploadMetadata: {
                timestamp: new Date(),
                gpsCoordinates: facilityLat ? {
                    type: 'Point',
                    coordinates: [facilityLon, facilityLat],
                } : undefined,
                deviceInfo: { userAgent: req.headers['user-agent'] },
            },
            aiAnalysis: {
                aiGeneratedScore: 0,
                manipulationScore: 0,
                duplicateScore: 0,
                overallConfidence: validation.allValid ? 95 : 40,
                flags: validation.results.filter((r) => !r.isValid).flatMap((r) => r.errors.map((e) => e.code)),
            },
            verificationStatus: validation.allValid ? 'passed' : 'needs_manual_review',
        });

        res.status(201).json({
            status: 'success',
            data: {
                proof,
                validation: {
                    allValid: validation.allValid,
                    validCount: validation.results.filter((r) => r.isValid).length,
                    invalidCount: validation.results.filter((r) => !r.isValid).length,
                },
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// GET /api/v1/verification/task/:taskId/validation
export const getTaskValidation = async (req: AuthRequest, res: Response) => {
    try {
        const proofs = await ProofVerification.find({ helpRequestId: req.params.taskId })
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            status: 'success',
            data: { proofs },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
