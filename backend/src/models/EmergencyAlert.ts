import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencyAlert extends Document {
    alertId: string;
    donorId: mongoose.Types.ObjectId;
    donorName: string;
    donorPhone: string;
    emergencyType: 'MEDICAL' | 'FIRE' | 'ACCIDENT' | 'PERSON_IN_DISTRESS' | 'WATER' | 'OTHER';
    description?: string;
    photo?: string;
    location: {
        latitude: number;
        longitude: number;
        address: string;
        accuracy: number;
        coordinates: {
            type: 'Point';
            coordinates: [number, number];
        };
    };
    status: 'ACTIVE' | 'ACCEPTED' | 'RESOLVED' | 'EXPIRED' | 'CANCELLED';
    notifiedHelpers: mongoose.Types.ObjectId[];
    acceptedBy?: mongoose.Types.ObjectId;
    acceptedAt?: Date;
    resolvedAt?: Date;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const EmergencyAlertSchema: Schema = new Schema(
    {
        alertId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        donorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        donorName: { type: String, required: true },
        donorPhone: { type: String, required: true },
        emergencyType: {
            type: String,
            enum: ['MEDICAL', 'FIRE', 'ACCIDENT', 'PERSON_IN_DISTRESS', 'WATER', 'OTHER'],
            required: true,
        },
        description: { type: String, maxlength: 500 },
        photo: { type: String },
        location: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            address: { type: String, default: 'Unknown Location' },
            accuracy: { type: Number, default: 0 },
            coordinates: {
                type: { type: String, enum: ['Point'], default: 'Point' },
                coordinates: { type: [Number], required: true },
            },
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'ACCEPTED', 'RESOLVED', 'EXPIRED', 'CANCELLED'],
            default: 'ACTIVE',
            index: true,
        },
        notifiedHelpers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        acceptedAt: { type: Date },
        resolvedAt: { type: Date },
        expiresAt: { type: Date, required: true, index: true },
    },
    { timestamps: true }
);

EmergencyAlertSchema.index({ 'location.coordinates': '2dsphere' });
EmergencyAlertSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model<IEmergencyAlert>('EmergencyAlert', EmergencyAlertSchema);
