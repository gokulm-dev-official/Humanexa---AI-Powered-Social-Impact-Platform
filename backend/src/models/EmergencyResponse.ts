import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencyResponse extends Document {
    alertId: mongoose.Types.ObjectId;
    helperId: mongoose.Types.ObjectId;
    helperName: string;
    status: 'ACCEPTED' | 'EN_ROUTE' | 'ARRIVED' | 'RESOLVED' | 'CANCELLED';
    acceptedAt: Date;
    arrivedAt?: Date;
    resolvedAt?: Date;
    responseTime?: number;
    distance: number;
    route: Array<{
        lat: number;
        lng: number;
        timestamp: Date;
    }>;
}

const EmergencyResponseSchema: Schema = new Schema(
    {
        alertId: {
            type: Schema.Types.ObjectId,
            ref: 'EmergencyAlert',
            required: true,
            index: true,
        },
        helperId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        helperName: { type: String, required: true },
        status: {
            type: String,
            enum: ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'RESOLVED', 'CANCELLED'],
            default: 'ACCEPTED',
        },
        acceptedAt: { type: Date, default: Date.now },
        arrivedAt: { type: Date },
        resolvedAt: { type: Date },
        responseTime: { type: Number },
        distance: { type: Number, required: true },
        route: [
            {
                lat: Number,
                lng: Number,
                timestamp: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

EmergencyResponseSchema.index({ alertId: 1, helperId: 1 }, { unique: true });

export default mongoose.model<IEmergencyResponse>('EmergencyResponse', EmergencyResponseSchema);
