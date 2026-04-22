import ImpactChat, { IImpactChat } from '../models/ImpactChat';
import Transaction from '../models/Transaction';
import NotificationService from './notificationService';
import { getIo } from '../socket';
import { v4 as uuidv4 } from 'uuid';

/**
 * CleanupService handles automatic tasks like 24h refunds.
 */
class CleanupService {
    private interval: NodeJS.Timeout | null = null;

    start() {
        // Run every hour for 24h refunds
        this.interval = setInterval(() => this.processRefunds(), 3600000);
        // Run every 5 minutes for 30m refunds
        setInterval(() => this.processShortTermRefunds(), 300000);
        console.log('Cleanup Service: Initialized (24h & 30m Refund Monitors)');

        // Initial run
        this.processRefunds();
    }

    async processRefunds() {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // Find chats that were funded more than 24h ago but not completed
            const expiredChats = await ImpactChat.find({
                status: 'amount_sent',
                fundedAt: { $lt: twentyFourHoursAgo }
            });

            if (expiredChats.length === 0) return;

            console.log(`Cleanup Service: Found ${expiredChats.length} expired impact sessions. Refunding...`);

            for (const chat of expiredChats as any[]) {
                // 1. Update status
                chat.status = 'refunded';
                await chat.save();

                // 2. Record Transaction
                if (chat.donorId && chat.amount) {
                    await Transaction.create({
                        user: chat.donorId,
                        type: 'payout', // Technically a refund payout
                        amount: chat.amount,
                        status: 'completed',
                        referenceId: `REF-${uuidv4()}`,
                        metadata: { chatId: chat._id, reason: 'TIMEOUT_24H' }
                    });

                    // 3. Notify Donor
                    NotificationService.sendSignal(chat.donorId.toString(), {
                        text: `Auto-Refund Triggered: Helper failed to provide proof within 24h. ₹${chat.amount} returned to source.`,
                        type: 'warning'
                    });

                    // 4. Notify Helper
                    NotificationService.sendSignal(chat.helperId.toString(), {
                        text: `Time Expired: The impact request was cancelled and refunded because help proof was not provided in 24h.`,
                        type: 'warning'
                    });

                    // 5. Emit Socket Event
                    const io = getIo();
                    if (io) {
                        io.to(chat._id.toString()).emit('impact:refunded', chat);
                        io.emit('impact:cancelled', chat); // Removal from live boards if any
                    }
                }
            }
        } catch (err) {
            console.error('Cleanup Service error:', err);
        }
    }

    async processShortTermRefunds() {
        try {
            const now = new Date();

            // Find chats where countdown expired and still 'amount_sent'
            const expiredChats = await ImpactChat.find({
                status: 'amount_sent',
                countdownDeadline: { $lt: now }
            });

            if (expiredChats.length === 0) return;

            console.log(`Cleanup Service: Found ${expiredChats.length} short-term expired impacts. Refunding...`);

            for (const chat of expiredChats as any[]) {
                chat.status = 'refunded';
                await chat.save();

                if (chat.donorId && chat.amount) {
                    await Transaction.create({
                        user: chat.donorId,
                        type: 'payout', 
                        amount: chat.amount,
                        status: 'completed',
                        referenceId: `REF30-${uuidv4()}`,
                        metadata: { chatId: chat._id, reason: 'TIMEOUT_30M_ESCROW' }
                    });

                    NotificationService.sendSignal(chat.donorId.toString(), {
                        text: `Auto-Refund Secured: Helper missed the 30-minute assistance window. ₹${chat.amount} returned to you.`,
                        type: 'info'
                    });

                    NotificationService.sendSignal(chat.helperId.toString(), {
                        text: `Protocol Terminated: You missed the 30-minute window for photo submission. The escrow has been returned to the donor.`,
                        type: 'warning'
                    });

                    const io = getIo();
                    if (io) {
                        io.to(chat._id.toString()).emit('impact:refunded', chat);
                    }
                }
            }
        } catch (err) {
            console.error('Cleanup Service (Short term) error:', err);
        }
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
    }
}

export default new CleanupService();
