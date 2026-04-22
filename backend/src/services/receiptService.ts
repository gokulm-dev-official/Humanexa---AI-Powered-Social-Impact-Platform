import DonationReceipt from '../models/DonationReceipt';
import Transaction from '../models/Transaction';
import HelpRequest from '../models/HelpRequest';
import User from '../models/User';
import crypto from 'crypto';
import mongoose from 'mongoose';

function generateReceiptId(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `RCPT-${y}-${m}-${d}-${rand}`;
}

function generateVerificationHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16).toUpperCase();
}

export const generateReceipt = async (
    transactionId: string,
    donorId: string,
    requestId: string,
    donationType: 'ESCROW' | 'DIRECT',
    amount: number
) => {
    const donor = await User.findById(donorId);
    let request = await HelpRequest.findById(requestId).populate('donorId', 'profile.fullName');
    
    // Fallback to ImpactChat if not a standard HelpRequest
    if (!request) {
        const impactChat = await mongoose.model('ImpactChat').findById(requestId).populate('helperId', 'profile.fullName');
        if (impactChat) {
            // Mock a request object for receipt compatibility
            request = {
                title: 'Live Impact Signal Assistance',
                donorId: { profile: { fullName: (impactChat as any).helperId?.profile?.fullName || 'Citizen Response' } }
            } as any;
        }
    }

    if (!donor) throw new Error('Donor not found');

    const receiptId = generateReceiptId();
    const platformFee = Math.round(amount * 0.03);
    const gatewayFee = Math.round(amount * 0.02);
    const totalPaid = amount + platformFee + gatewayFee;

    const institutionName = (request?.donorId as any)?.profile?.fullName || 'Social Kind Institution';

    const hashData = `${receiptId}-${donorId}-${amount}-${Date.now()}`;
    const verificationHash = generateVerificationHash(hashData);

    const now = new Date();
    const escrowTimeline = donationType === 'ESCROW' ? {
        lockedAt: now,
        stage1ReleaseDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
        stage2ReleaseDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
        reviewPeriodStart: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
        reviewPeriodEnd: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
    } : undefined;

    const receipt = await DonationReceipt.create({
        receiptId,
        transactionId,
        donorId,
        requestId,
        donationType,
        amounts: {
            donation: amount,
            platformFee,
            gatewayFee,
            totalPaid,
            institutionReceives: amount,
        },
        donor: {
            name: donor.profile?.fullName || 'Anonymous Donor',
            email: donor.email,
            phone: donor.phoneNumber || '',
        },
        institution: {
            name: institutionName,
            section80G: 'ABCDE1234F',
            section80GValidTill: new Date('2027-03-31'),
        },
        taxInfo: {
            isEligible: true,
            section: '80G',
            deductiblePercent: 100,
            deductibleAmount: amount,
        },
        escrowTimeline,
        emailSent: false,
        verificationHash,
    });

    // Update transaction with receipt info
    await Transaction.findByIdAndUpdate(transactionId, {
        receiptId: receipt.receiptId,
        receiptGenerated: true,
    });

    return receipt;
};

export const getReceiptById = async (receiptId: string) => {
    return await DonationReceipt.findOne({ receiptId })
        .populate('donorId', 'profile.fullName email phoneNumber')
        .populate('requestId', 'title requestType');
};

export const verifyReceipt = async (verificationHash: string) => {
    const receipt = await DonationReceipt.findOne({ verificationHash });
    return receipt ? { valid: true, receiptId: receipt.receiptId, amount: receipt.amounts.donation } : { valid: false };
};

export const sendReceiptEmail = async (receiptId: string) => {
    const receipt = await DonationReceipt.findOne({ receiptId });
    if (!receipt) throw new Error('Receipt not found');

    // Mock email sending
    console.log(`[EMAIL] Receipt ${receiptId} sent to ${receipt.donor.email}`);
    console.log(`  Amount: ₹${receipt.amounts.donation}`);
    console.log(`  Type: ${receipt.donationType}`);
    console.log(`  Tax Deductible: ₹${receipt.taxInfo.deductibleAmount}`);

    receipt.emailSent = true;
    await receipt.save();

    return { sent: true, email: receipt.donor.email };
};
