import mongoose, { Schema, Document } from 'mongoose';

export interface IGovernmentIntegration extends Document {
    userId: mongoose.Types.ObjectId;
    certificateType: 'volunteer' | 'donor' | 'award' | '30_days_streak' | '6_months_impact' | 'annual_impact' | 'government_honor' | 'daily_donor_champion' | 'daily_helper_champion';
    year: number;
    totalPoints: number;
    impactSummary: any;
    certificateUrl?: string;
    certificateNumber: string;
    issuedAt: Date;
    expiresAt?: Date;
    governmentAcknowledgment?: {
        acknowledged: boolean;
        acknowledgmentId?: string;
        issuedBy?: string;
    };
}

const GovernmentIntegrationSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        certificateType: { type: String, enum: ['volunteer', 'donor', 'award', '30_days_streak', '6_months_impact', 'annual_impact', 'government_honor', 'daily_donor_champion', 'daily_helper_champion'], required: true },
        year: { type: Number, required: true },
        totalPoints: { type: Number, required: true },
        impactSummary: { type: Object, required: true },
        certificateUrl: String,
        certificateNumber: { type: String, required: true, unique: true },
        issuedAt: { type: Date, default: Date.now },
        expiresAt: Date,
        governmentAcknowledgment: {
            acknowledged: { type: Boolean, default: false },
            acknowledgmentId: String,
            issuedBy: String,
        },
    },
    { timestamps: true }
);

export default mongoose.model<IGovernmentIntegration>('GovernmentIntegration', GovernmentIntegrationSchema);
