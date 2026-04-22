import { Queue, Worker } from 'bullmq';
import HelpRequest from '../models/HelpRequest';
import notificationService from '../services/notificationService';
import { checkExpiredTasks, checkWarnings } from '../services/countdownService';

const REDIS_CONFIG = {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    }
};

export const deadlineQueue = new Queue('deadlineTracking', REDIS_CONFIG);

export const setupDeadlineWorker = () => {
    const worker = new Worker('deadlineTracking', async (job) => {
        const { helpRequestId } = job.data;
        const request = await HelpRequest.findById(helpRequestId);

        if (request && request.status === 'assigned') {
            const now = new Date();
            const deadline = request.timeline.expectedCompletionBy;

            if (deadline && now > deadline) {
                // Trigger Warning Logic
                request.status = 'disputed'; // or expired
                await request.save();

                await notificationService.sendNotification(request.helperId!.toString(), {
                    title: 'Deadline Expired!',
                    message: `Your task "${request.title}" has passed the deadline. A warning has been issued.`,
                    type: 'warning',
                    priority: 'high'
                });
            }
        }
    }, REDIS_CONFIG);

    worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
    worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed with ${err.message}`));
};

// Feature 3: Countdown timer checks — run every minute
let countdownIntervalId: NodeJS.Timeout | null = null;

export const startCountdownChecker = () => {
    if (countdownIntervalId) return;

    countdownIntervalId = setInterval(async () => {
        try {
            const expired = await checkExpiredTasks();
            if (expired > 0) {
                console.log(`[CRON] Expired ${expired} countdown tasks.`);
            }
            await checkWarnings();
        } catch (err) {
            console.error('[CRON] Countdown check error:', err);
        }
    }, 60 * 1000); // Every 60 seconds

    console.log('[CRON] Countdown checker started (every 60s).');
};

export const stopCountdownChecker = () => {
    if (countdownIntervalId) {
        clearInterval(countdownIntervalId);
        countdownIntervalId = null;
    }
};
