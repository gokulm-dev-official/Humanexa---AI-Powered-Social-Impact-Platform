import mongoose, { Schema, Document } from 'mongoose';

export interface IImpactChat extends Document {
    helperId: mongoose.Types.ObjectId;
    donorId?: mongoose.Types.ObjectId;
    status: 'need_posted' | 'amount_sent' | 'proof_submitted' | 'help_completed' | 'cancelled' | 'refunded';
    donationType?: 'ESCROW' | 'DIRECT';
    countdownDeadline?: Date;
    initialPhoto: string; // The "Need" photo
    finalPhoto?: string;  // The "Helping" photo
    amount?: number;
    paymentInfo?: {
        mobile?: string;
        qrUrl?: string;
    };
    fundedAt?: Date;
    location?: {
        type: 'Point';
        coordinates: [number, number];
    };
    messages: Array<{
        senderId: mongoose.Types.ObjectId;
        text: string;
        createdAt: Date;
    }>;
    aiVerification?: {
        status: string;
        confidence: number;
        verifiedAt: Date;
        report: any;
    };
    // Split donation fields
    splitMode?: boolean;
    targetAmount?: number;
    receivedAmount?: number;
    donorContributions?: Array<{
        donorId: mongoose.Types.ObjectId;
        amount: number;
        donationType: 'ESCROW' | 'DIRECT';
        donatedAt: Date;
    }>;
}

const ImpactChatSchema: Schema = new Schema(
    {
        helperId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        donorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
        status: {
            type: String,
            enum: ['need_posted', 'amount_sent', 'proof_submitted', 'help_completed', 'cancelled', 'refunded'],
            default: 'need_posted'
        },
        donationType: { type: String, enum: ['ESCROW', 'DIRECT'], default: 'ESCROW' },
        initialPhoto: { type: String, required: true },
        finalPhoto: String,
        amount: Number,
        paymentInfo: {
            mobile: String,
            qrUrl: String
        },
        fundedAt: Date,
        countdownDeadline: Date,
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: [Number],
        },
        messages: [
            {
                senderId: { type: Schema.Types.ObjectId, ref: 'User' },
                text: String,
                createdAt: { type: Date, default: Date.now }
            }
        ],
        aiVerification: {
            status: { type: String, enum: ['pending', 'processing', 'passed', 'failed', 'needs_manual_review'], default: 'pending' },
            confidence: Number,
            verifiedAt: Date,
            report: Object
        },
        // Split donation fields
        splitMode: { type: Boolean, default: false },
        targetAmount: { type: Number, default: 0 },
        receivedAmount: { type: Number, default: 0 },
        donorContributions: [
            {
                donorId: { type: Schema.Types.ObjectId, ref: 'User' },
                amount: Number,
                donationType: { type: String, enum: ['ESCROW', 'DIRECT'], default: 'ESCROW' },
                donatedAt: { type: Date, default: Date.now }
            }
        ]
    },
    { timestamps: true }
);

export default mongoose.model<IImpactChat>('ImpactChat', ImpactChatSchema);
