import mongoose, { Schema, Document } from 'mongoose';

export interface IDonationReceipt extends Document {
    receiptId: string;
    transactionId: mongoose.Types.ObjectId;
    donorId: mongoose.Types.ObjectId;
    requestId: mongoose.Types.ObjectId;

    donationType: 'ESCROW' | 'DIRECT';

    amounts: {
        donation: number;
        platformFee: number;
        gatewayFee: number;
        totalPaid: number;
        institutionReceives: number;
    };

    donor: {
        name: string;
        email: string;
        phone: string;
        panNumber?: string;
    };

    institution: {
        name: string;
        registrationNumber?: string;
        section80G?: string;
        section80GValidTill?: Date;
    };

    taxInfo: {
        isEligible: boolean;
        section: string;
        deductiblePercent: number;
        deductibleAmount: number;
    };

    escrowTimeline?: {
        lockedAt: Date;
        stage1ReleaseDate?: Date;
        stage2ReleaseDate?: Date;
        reviewPeriodStart?: Date;
        reviewPeriodEnd?: Date;
    };

    pdfUrl?: string;
    emailSent: boolean;
    verificationHash: string;
    qrCodeUrl?: string;

    createdAt: Date;
    updatedAt: Date;
}

const DonationReceiptSchema: Schema = new Schema(
    {
        receiptId: { type: String, required: true, unique: true, index: true },
        transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true, index: true },
        donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        requestId: { type: Schema.Types.ObjectId, ref: 'HelpRequest', required: true, index: true },

        donationType: { type: String, enum: ['ESCROW', 'DIRECT'], required: true },

        amounts: {
            donation: { type: Number, required: true },
            platformFee: { type: Number, default: 0 },
            gatewayFee: { type: Number, default: 0 },
            totalPaid: { type: Number, required: true },
            institutionReceives: { type: Number, required: true },
        },

        donor: {
            name: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, default: '' },
            panNumber: { type: String },
        },

        institution: {
            name: { type: String, required: true },
            registrationNumber: { type: String },
            section80G: { type: String },
            section80GValidTill: { type: Date },
        },

        taxInfo: {
            isEligible: { type: Boolean, default: true },
            section: { type: String, default: '80G' },
            deductiblePercent: { type: Number, default: 100 },
            deductibleAmount: { type: Number, default: 0 },
        },

        escrowTimeline: {
            lockedAt: { type: Date },
            stage1ReleaseDate: { type: Date },
            stage2ReleaseDate: { type: Date },
            reviewPeriodStart: { type: Date },
            reviewPeriodEnd: { type: Date },
        },

        pdfUrl: { type: String },
        emailSent: { type: Boolean, default: false },
        verificationHash: { type: String, required: true },
        qrCodeUrl: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model<IDonationReceipt>('DonationReceipt', DonationReceiptSchema);
