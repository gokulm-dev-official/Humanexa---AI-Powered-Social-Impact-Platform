import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    user: mongoose.Types.ObjectId;
    type: 'donation' | 'payout' | 'escrow_lock' | 'escrow_release';
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    referenceId: string;
    metadata: any;

    // Enhancement 1: Donation type (Escrow vs Direct)
    donationType?: 'ESCROW' | 'DIRECT';
    escrowStatus?: 'LOCKED' | 'STAGE1_RELEASED' | 'STAGE2_RELEASED' | 'REFUNDED' | null;
    proofRequired?: boolean;
    reviewPeriod?: number; // days
    directTransfer?: boolean;
    transferredAt?: Date;

    // Receipt fields
    receiptId?: string;
    receiptGenerated?: boolean;
    receiptUrl?: string;

    createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['donation', 'payout', 'escrow_lock', 'escrow_release'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    referenceId: { type: String, required: true, unique: true },
    metadata: { type: Schema.Types.Mixed },

    // Donation type
    donationType: { type: String, enum: ['ESCROW', 'DIRECT'], default: 'ESCROW' },
    escrowStatus: { type: String, enum: ['LOCKED', 'STAGE1_RELEASED', 'STAGE2_RELEASED', 'REFUNDED', null], default: null },
    proofRequired: { type: Boolean, default: true },
    reviewPeriod: { type: Number, default: 7 },
    directTransfer: { type: Boolean, default: false },
    transferredAt: { type: Date },

    // Receipt
    receiptId: { type: String, index: true },
    receiptGenerated: { type: Boolean, default: false },
    receiptUrl: { type: String },
}, { timestamps: true });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
