import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    performedBy: mongoose.Types.ObjectId;
    action: string;
    targetEntity: {
        type: string;
        id: mongoose.Types.ObjectId;
    };
    changes?: {
        before: any;
        after: any;
    };
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

const AuditLogSchema: Schema = new Schema(
    {
        performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        action: { type: String, required: true },
        targetEntity: {
            type: { type: String, required: true },
            id: { type: Schema.Types.ObjectId, required: true },
        },
        changes: {
            before: Object,
            after: Object,
        },
        reason: String,
        ipAddress: String,
        userAgent: String,
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
