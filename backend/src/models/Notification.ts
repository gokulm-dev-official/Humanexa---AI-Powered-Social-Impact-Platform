import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'system' | 'transaction' | 'request' | 'warning' | 'achievement';
    title: string;
    message: string;
    actionUrl?: string;
    priority: 'low' | 'medium' | 'high';
    channels: {
        email: boolean;
        sms: boolean;
        push: boolean;
        inApp: boolean;
    };
    status: 'pending' | 'sent' | 'failed' | 'read';
    readAt?: Date;
}

const NotificationSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: { type: String, enum: ['system', 'transaction', 'request', 'warning', 'achievement'], required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        actionUrl: String,
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
        channels: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: true },
            inApp: { type: Boolean, default: true },
        },
        status: { type: String, enum: ['pending', 'sent', 'failed', 'read'], default: 'pending', index: true },
        readAt: Date,
    },
    { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
