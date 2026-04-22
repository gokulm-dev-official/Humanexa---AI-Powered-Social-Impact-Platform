import { Socket } from 'socket.io';
import Notification from '../models/Notification';

class NotificationService {
    private io: any;

    init(io: any) {
        this.io = io;
    }

    async sendSignal(userId: string, data: { text: string; type: 'info' | 'success' | 'warning'; metadata?: any }) {
        // 1. Persist to database so donor can see it even after reconnect
        try {
            await Notification.create({
                userId,
                type: data.metadata?.notificationType || 'system',
                title: data.metadata?.title || 'Notification',
                message: data.text,
                actionUrl: data.metadata?.helpRequestId ? `/dashboard?donate=${data.metadata.helpRequestId}` : undefined,
                priority: data.metadata?.priority || 'low',
                channels: { email: true, sms: false, push: true, inApp: true },
                status: 'sent'
            });
        } catch (dbErr) {
            console.error('Failed to persist notification:', dbErr);
        }

        // 2. In-app (Socket.io) real-time
        if (this.io) {
            this.io.to(userId).emit('notification', data);
        }

        // 3. Mock Email
        console.log(`[STUB EMAIL] To: ${userId} | Message: ${data.text}`);
    }

    async sendNotification(userId: string, notification: { title: string; message: string; type: string; priority: string; helpRequestId?: string }) {
        const typeMapping: any = {
            'success': 'success',
            'achievement': 'success',
            'request': 'info',
            'broadcast': 'info',
            'warning': 'warning',
            'error': 'warning'
        };

        await this.sendSignal(userId, {
            text: `${notification.title}: ${notification.message}`,
            type: typeMapping[notification.type] || 'info',
            metadata: {
                priority: notification.priority,
                title: notification.title,
                notificationType: notification.type === 'broadcast' ? 'request' : notification.type,
                helpRequestId: notification.helpRequestId || null
            }
        });
    }

    broadcast(data: { text: string; type: 'info' | 'success' | 'warning'; metadata?: any }) {
        if (this.io) {
            this.io.emit('notification', data);
        }
    }

    // Feature 8: Emergency SMS fallback for when Socket.io/push is unavailable
    async sendEmergencySMS(phoneNumber: string, alertData: {
        emergencyLabel: string;
        distance: number;
        donorName?: string;
        alertId?: string;
    }) {
        const message = `🚨 EMERGENCY: ${alertData.emergencyLabel} ${alertData.distance}m from you. Open Social Kind app NOW. AlertID: ${alertData.alertId || 'N/A'}`;
        console.log(`[SMS] To: ${phoneNumber} | ${message}`);
        // In production: integrate Twilio/MSG91
        // await twilio.messages.create({ body: message, from: TWILIO_NUMBER, to: phoneNumber });
        return { sent: true, phone: phoneNumber, message };
    }
}

export default new NotificationService();
