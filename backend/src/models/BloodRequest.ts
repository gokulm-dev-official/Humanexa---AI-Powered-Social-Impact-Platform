import mongoose, { Schema, Document } from 'mongoose';

export interface IBloodRequest extends Document {
    requesterId: mongoose.Types.ObjectId;
    bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    urgency: 'normal' | 'urgent' | 'critical';
    unitsNeeded: number;
    hospitalName: string;
    contactNumber: string;
    description?: string;
    location: {
        type: 'Point';
        coordinates: [number, number]; // [lng, lat]
        address?: string;
    };
    status: 'active' | 'fulfilled' | 'cancelled' | 'expired';
    respondents: Array<{
        donorId: mongoose.Types.ObjectId;
        status: 'offered' | 'accepted' | 'completed' | 'declined';
        respondedAt: Date;
        contactShared: boolean;
    }>;
    expiresAt: Date;
    fulfilledAt?: Date;
}

const BloodRequestSchema: Schema = new Schema(
    {
        requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        bloodGroup: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            required: true,
        },
        urgency: {
            type: String,
            enum: ['normal', 'urgent', 'critical'],
            default: 'urgent',
        },
        unitsNeeded: { type: Number, default: 1, min: 1 },
        hospitalName: { type: String, required: true },
        contactNumber: { type: String, required: true },
        description: String,
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true },
            address: String,
        },
        status: {
            type: String,
            enum: ['active', 'fulfilled', 'cancelled', 'expired'],
            default: 'active',
            index: true,
        },
        respondents: [
            {
                donorId: { type: Schema.Types.ObjectId, ref: 'User' },
                status: { type: String, enum: ['offered', 'accepted', 'completed', 'declined'], default: 'offered' },
                respondedAt: { type: Date, default: Date.now },
                contactShared: { type: Boolean, default: false },
            },
        ],
        expiresAt: { type: Date, default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) }, // 48h
        fulfilledAt: Date,
    },
    { timestamps: true }
);

BloodRequestSchema.index({ location: '2dsphere' });
BloodRequestSchema.index({ bloodGroup: 1, status: 1 });

export default mongoose.model<IBloodRequest>('BloodRequest', BloodRequestSchema);
