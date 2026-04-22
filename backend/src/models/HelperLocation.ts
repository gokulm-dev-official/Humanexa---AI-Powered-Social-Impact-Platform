import mongoose, { Schema, Document } from 'mongoose';

export interface IHelperLocation extends Document {
    helperId: mongoose.Types.ObjectId;
    latitude: number;
    longitude: number;
    accuracy: number;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
    lastUpdated: Date;
    isAvailable: boolean;
    currentEmergency?: mongoose.Types.ObjectId;
    emergencySettings: {
        maxDistance: number;
        alertTypes: string[];
        notificationSound: 'loud' | 'standard' | 'vibration';
        quietHoursEnabled: boolean;
        quietHoursStart?: string;
        quietHoursEnd?: string;
    };
    expiresAt?: Date;
}

const HelperLocationSchema: Schema = new Schema(
    {
        helperId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        accuracy: { type: Number, default: 0 },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true },
        },
        lastUpdated: { type: Date, default: Date.now },
        isAvailable: { type: Boolean, default: true, index: true },
        currentEmergency: { type: Schema.Types.ObjectId, ref: 'EmergencyAlert' },
        emergencySettings: {
            maxDistance: { type: Number, default: 10 },
            alertTypes: {
                type: [String],
                default: ['MEDICAL', 'FIRE', 'ACCIDENT', 'PERSON_IN_DISTRESS', 'WATER', 'OTHER'],
            },
            notificationSound: {
                type: String,
                enum: ['loud', 'standard', 'vibration'],
                default: 'loud',
            },
            quietHoursEnabled: { type: Boolean, default: false },
            quietHoursStart: { type: String },
            quietHoursEnd: { type: String },
        },
        expiresAt: { type: Date, index: { expires: 0 } },
    },
    { timestamps: true }
);

HelperLocationSchema.index({ location: '2dsphere' });
HelperLocationSchema.index({ isAvailable: 1, location: '2dsphere' });

export default mongoose.model<IHelperLocation>('HelperLocation', HelperLocationSchema);
