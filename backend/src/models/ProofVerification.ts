import mongoose, { Schema, Document } from 'mongoose';

export interface IProofVerification extends Document {
    helpRequestId: mongoose.Types.ObjectId;
    uploadedBy: mongoose.Types.ObjectId;
    images: Array<{
        originalUrl: string;
        compressedUrl?: string;
        thumbnailUrl?: string;
        imageHash?: string;
    }>;
    uploadMetadata: {
        timestamp: Date;
        gpsCoordinates?: {
            type: 'Point';
            coordinates: [number, number];
        };
        deviceInfo?: any;
    };
    aiAnalysis: {
        aiGeneratedScore: number;
        manipulationScore: number;
        duplicateScore: number;
        overallConfidence: number;
        flags: string[];
        detailedReport: any;
    };
    manualReviewData?: {
        required: boolean;
        assignedTo?: mongoose.Types.ObjectId;
        status: 'pending' | 'approved' | 'rejected';
        notes?: string;
    };
    verificationStatus: 'pending' | 'processing' | 'passed' | 'failed' | 'needs_manual_review';
}

const ProofVerificationSchema: Schema = new Schema(
    {
        helpRequestId: { type: Schema.Types.ObjectId, ref: 'HelpRequest', required: true, index: true },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        images: [
            {
                originalUrl: { type: String, required: true },
                compressedUrl: String,
                thumbnailUrl: String,
                imageHash: String,
            },
        ],
        uploadMetadata: {
            timestamp: { type: Date, default: Date.now },
            gpsCoordinates: {
                type: { type: String, enum: ['Point'], default: 'Point' },
                coordinates: [Number],
            },
            deviceInfo: Object,
        },
        aiAnalysis: {
            aiGeneratedScore: { type: Number, default: 0 },
            manipulationScore: { type: Number, default: 0 },
            duplicateScore: { type: Number, default: 0 },
            overallConfidence: { type: Number, default: 0 },
            flags: [String],
            detailedReport: Object,
        },
        manualReviewData: {
            required: { type: Boolean, default: false },
            assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
            status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
            notes: String,
        },
        verificationStatus: {
            type: String,
            enum: ['pending', 'processing', 'passed', 'failed', 'needs_manual_review'],
            default: 'pending',
            index: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model<IProofVerification>('ProofVerification', ProofVerificationSchema);
