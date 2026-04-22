import mongoose, { Schema, Document } from 'mongoose';

export interface IHelpRequest extends Document {
    donorId: mongoose.Types.ObjectId;
    helperId?: mongoose.Types.ObjectId;
    requestType: 'food' | 'medicine' | 'clothing' | 'shelter' | 'emergency';
    title: string;
    description: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    amount: {
        currency: string;
        value: number;
        breakdown: {
            itemCost: number;
            platformFee: number;
            transactionFee: number;
        };
    };
    location: {
        address: string;
        coordinates: {
            type: 'Point';
            coordinates: [number, number]; // [lng, lat]
        };
        radius?: number;
    };
    targetBeneficiaries: {
        count: number;
        ageGroup?: string;
        specificNeeds?: string;
    };
    status: 'open' | 'assigned' | 'in_progress' | 'proof_submitted' | 'under_review' | 'completed' | 'cancelled' | 'expired' | 'disputed' | 'funding' | 'funded';
    timeline: {
        createdAt: Date;
        assignedAt?: Date;
        expectedCompletionBy?: Date;
        actualCompletionAt?: Date;
    };
    escrow: {
        amount: number;
        status: 'held' | 'released' | 'refunded';
        transactionId?: string;
        releasedAt?: Date;
    };
    proof: {
        imageUrls: string[];
        videoUrls: string[];
        submittedAt?: Date;
        gpsCoordinates?: {
            type: 'Point';
            coordinates: [number, number];
        };
        deviceMetadata?: any;
    };
    aiVerification: {
        status: 'pending' | 'processing' | 'passed' | 'failed' | 'needs_manual_review';
        confidence: number;
        flags: string[];
        verifiedAt?: Date;
        reportSummary?: string;
    };
    feedback?: {
        donorRating?: number;
        helperRating?: number;
        comments?: string;
    };
    isBroadcast?: boolean;
    amountRaised?: number;
    views?: number;
    shares?: number;
    expiryAt?: Date;
}

const HelpRequestSchema: Schema = new Schema(
    {
        donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        helperId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
        requestType: { type: String, enum: ['food', 'medicine', 'clothing', 'shelter', 'emergency'], required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        amount: {
            currency: { type: String, default: 'INR' },
            value: { type: Number, required: true },
            breakdown: {
                itemCost: Number,
                platformFee: Number,
                transactionFee: Number,
            },
        },
        location: {
            address: { type: String, required: true },
            coordinates: {
                type: { type: String, enum: ['Point'], default: 'Point' },
                coordinates: { type: [Number], required: true },
            },
            radius: { type: Number, default: 5 }, // km
        },
        targetBeneficiaries: {
            count: { type: Number, default: 1 },
            ageGroup: String,
            specificNeeds: String,
        },
        status: {
            type: String,
            enum: ['open', 'assigned', 'in_progress', 'proof_submitted', 'under_review', 'completed', 'cancelled', 'expired', 'disputed', 'funding', 'funded'],
            default: 'open',
            index: true,
        },
        timeline: {
            createdAt: { type: Date, default: Date.now },
            assignedAt: Date,
            expectedCompletionBy: Date,
            actualCompletionAt: Date,
        },
        escrow: {
            amount: { type: Number, required: true },
            status: { type: String, enum: ['held', 'released', 'refunded'], default: 'held' },
            transactionId: String,
            releasedAt: Date,
        },
        proof: {
            imageUrls: [String],
            videoUrls: [String],
            submittedAt: Date,
            gpsCoordinates: {
                type: { type: String, enum: ['Point'], default: 'Point' },
                coordinates: { type: [Number] },
            },
            deviceMetadata: Object,
        },
        aiVerification: {
            status: { type: String, enum: ['pending', 'processing', 'passed', 'failed', 'needs_manual_review'], default: 'pending' },
            confidence: { type: Number, default: 0 },
            flags: [String],
            verifiedAt: Date,
            reportSummary: String,
        },
        feedback: {
            donorRating: Number,
            helperRating: Number,
            comments: String,
        },
        isBroadcast: { type: Boolean, default: false },
        amountRaised: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        expiryAt: Date,
    },
    { timestamps: true }
);

HelpRequestSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model<IHelpRequest>('HelpRequest', HelpRequestSchema);
