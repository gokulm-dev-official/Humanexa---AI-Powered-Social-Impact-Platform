import mongoose, { Schema, Document } from 'mongoose';

export interface ICreditHistory extends Document {
    userId: mongoose.Types.ObjectId;
    activityType: 'donation' | 'help_completed' | 'referral' | 'bonus' | 'penalty';
    points: number;
    multiplier: number;
    reason: string;
    helpRequestId?: mongoose.Types.ObjectId;
    transactionId?: mongoose.Types.ObjectId;
    year: number;
    month: number;
    validUntil: Date;
    metadata?: any;
}

const CreditHistorySchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        activityType: {
            type: String,
            enum: ['donation', 'help_completed', 'referral', 'bonus', 'penalty'],
            required: true
        },
        points: { type: Number, required: true },
        multiplier: { type: Number, default: 1 },
        reason: { type: String, required: true },
        helpRequestId: { type: Schema.Types.ObjectId, ref: 'HelpRequest' },
        transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
        year: { type: Number, required: true },
        month: { type: Number, required: true },
        validUntil: { type: Date, required: true },
        metadata: Object,
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

CreditHistorySchema.index({ userId: 1, year: 1 });

export default mongoose.model<ICreditHistory>('CreditHistory', CreditHistorySchema);
