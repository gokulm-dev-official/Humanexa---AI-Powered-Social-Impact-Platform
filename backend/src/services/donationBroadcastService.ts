/**
 * Donation Broadcast Service — Feature 5
 * Real-time broadcasting of donation activities to all related donors and viewers.
 */

import Transaction from '../models/Transaction';
import HelpRequest from '../models/HelpRequest';
import NotificationService from './notificationService';
import { getIo } from '../socket';

interface DonationEvent {
    requestId: string;
    donorName: string;
    donorId: string;
    amount: number;
    message?: string;
    isAnonymous?: boolean;
}

function getNotificationVariant(
    totalRaised: number,
    goal: number,
    percentage: number,
    donorName: string,
    amount: number
): { type: string; title: string; message: string } {
    if (percentage >= 100) {
        return {
            type: 'fully_funded',
            title: '✅ 100% FUNDED!',
            message: `Goal reached! 🎉🎉 The target of ₹${goal.toLocaleString()} has been met!`,
        };
    }
    if (percentage >= 90) {
        const remaining = goal - totalRaised;
        return {
            type: 'almost_funded',
            title: '🔥 ALMOST THERE!',
            message: `Only ₹${remaining.toLocaleString()} more needed to reach the goal!`,
        };
    }
    if (percentage === 50 || percentage === 75 || percentage === 25) {
        return {
            type: 'milestone',
            title: `🎊 ${percentage}% FUNDED!`,
            message: `₹${totalRaised.toLocaleString()} raised towards the goal of ₹${goal.toLocaleString()}!`,
        };
    }
    return {
        type: 'new_donation',
        title: '🎉 New Donation!',
        message: `${donorName} just donated ₹${amount.toLocaleString()}!`,
    };
}

export const broadcastDonation = async (event: DonationEvent) => {
    const io = getIo();
    const request = await HelpRequest.findById(event.requestId);
    if (!request) return;

    const totalRaised = request.amountRaised || 0;
    const goal = request.amount?.value || totalRaised;
    const percentage = goal > 0 ? Math.round((totalRaised / goal) * 100) : 0;

    // Count total donors
    const donorCount = await Transaction.countDocuments({
        'metadata.helpRequestId': event.requestId,
        status: 'completed',
        type: 'donation',
    });

    const displayName = event.isAnonymous ? 'Anonymous' : event.donorName;
    const variant = getNotificationVariant(totalRaised, goal, percentage, displayName, event.amount);

    const payload = {
        type: variant.type,
        requestId: event.requestId,
        requestTitle: request.title,
        donor: {
            name: displayName,
            amount: event.amount,
            message: event.message || '',
            isAnonymous: event.isAnonymous || false,
        },
        progress: {
            totalRaised,
            goal,
            percentage,
            donorCount,
        },
        timestamp: new Date(),
    };

    // 1. Broadcast to everyone viewing this request (Socket.io room)
    if (io) {
        io.to(`request:${event.requestId}`).emit('donation-activity', payload);
    }

    // 2. Find all past donors for this request and notify them
    const pastDonorIds = await Transaction.find({
        'metadata.helpRequestId': event.requestId,
        status: 'completed',
        type: 'donation',
        user: { $ne: event.donorId }, // Don't notify the donor who just donated
    }).distinct('user');

    for (const pastDonorId of pastDonorIds) {
        // In-app notification
        await NotificationService.sendNotification(pastDonorId.toString(), {
            title: variant.title,
            message: `${variant.message} — "${request.title}"`,
            type: 'request',
            priority: variant.type === 'fully_funded' ? 'high' : 'medium',
            helpRequestId: event.requestId,
        });

        // Socket.io direct notification
        if (io) {
            io.to(pastDonorId.toString()).emit('donation-activity', payload);
        }
    }

    console.log(`[BROADCAST] ${variant.type}: ${variant.message} | Notified ${pastDonorIds.length} past donors`);

    return payload;
};

export const broadcastProofPhotos = async (
    requestId: string,
    helperName: string,
    helperRating: number,
    photos: Array<{ url: string; gpsLat: number; gpsLng: number; timestamp: Date }>,
    verificationNotes: string,
    checklist: any
) => {
    const io = getIo();
    const request = await HelpRequest.findById(requestId);
    if (!request) return;

    const payload = {
        type: 'proof_photos',
        requestId,
        requestTitle: request.title,
        helperName,
        helperRating,
        photoCount: photos.length,
        thumbnails: photos.slice(0, 3).map((p) => p.url),
        verificationNotes,
        checklist,
        timestamp: new Date(),
    };

    // Find ALL donors for this request
    const donorIds = await Transaction.find({
        'metadata.helpRequestId': requestId,
        status: 'completed',
        type: 'donation',
    }).distinct('user');

    for (const donorId of donorIds) {
        // Socket.io real-time
        if (io) {
            io.to(donorId.toString()).emit('proof-photos-uploaded', payload);
        }

        // In-app notification
        await NotificationService.sendNotification(donorId.toString(), {
            title: '📸 Proof Photos Uploaded!',
            message: `${helperName} verified delivery of "${request.title}". View ${photos.length} photos now.`,
            type: 'request',
            priority: 'high',
            helpRequestId: requestId,
        });
    }

    // Also broadcast to request room
    if (io) {
        io.to(`request:${requestId}`).emit('proof-photos-uploaded', payload);
    }

    console.log(`[BROADCAST] Proof photos: ${photos.length} photos shared with ${donorIds.length} donors`);

    return payload;
};
