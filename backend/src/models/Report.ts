import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
    reportedBy: mongoose.Types.ObjectId;
    reportedEntity: {
        type: 'user' | 'help_request' | 'helper' | 'proof';
        id: mongoose.Types.ObjectId;
    };
    reason: string;
    description: string;
    evidence: string[];
    status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
    assignedTo?: mongoose.Types.ObjectId;
    resolution?: string;
    resolvedAt?: Date;
}

const ReportSchema: Schema = new Schema(
    {
        reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        reportedEntity: {
            type: { type: String, enum: ['user', 'help_request', 'helper', 'proof'], required: true },
            id: { type: Schema.Types.ObjectId, required: true },
        },
        reason: { type: String, required: true },
        description: { type: String, required: true },
        evidence: [String],
        status: { type: String, enum: ['pending', 'investigating', 'resolved', 'dismissed'], default: 'pending', index: true },
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
        resolution: String,
        resolvedAt: Date,
    },
    { timestamps: true }
);

export default mongoose.model<IReport>('Report', ReportSchema);
