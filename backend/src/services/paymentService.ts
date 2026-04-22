import Stripe from 'stripe';
import Transaction from '../models/Transaction';
import HelpRequest from '../models/HelpRequest';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
    apiVersion: '2025-01-27.preview.v2' as any,
});

export const createPaymentIntent = async (amount: number, currency: string = 'inr') => {
    return await stripe.paymentIntents.create({
        amount: amount * 100, // cents
        currency,
        automatic_payment_methods: { enabled: true },
    });
};

export const handleWebhook = async (event: Stripe.Event) => {
    const session = event.data.object as any;

    switch (event.type) {
        case 'payment_intent.succeeded':
            // Update transaction status
            await Transaction.findOneAndUpdate(
                { 'paymentGateway.transactionId': session.id },
                { status: 'completed' }
            );
            break;
        case 'payment_intent.payment_failed':
            await Transaction.findOneAndUpdate(
                { 'paymentGateway.transactionId': session.id },
                { status: 'failed' }
            );
            break;
    }
};

export const releaseEscrow = async (helpRequestId: string) => {
    const helpRequest = await HelpRequest.findById(helpRequestId);
    if (!helpRequest) return;

    // In a real app, this would trigger a Stripe Transfer or Payout to the helper
    // For now, we update internal status
    helpRequest.escrow.status = 'released';
    helpRequest.escrow.releasedAt = new Date();
    await helpRequest.save();

    await Transaction.create({
        userId: helpRequest.helperId!,
        helpRequestId: helpRequest._id,
        type: 'payment',
        amount: {
            currency: helpRequest.amount.currency,
            value: helpRequest.amount.value,
            fee: 0,
            netAmount: helpRequest.amount.value,
        },
        paymentMethod: 'wallet',
        paymentGateway: {
            provider: 'manual',
            transactionId: `RELEASE_${helpRequest._id}`,
        },
        status: 'completed',
        escrowStatus: 'released',
    });
};
