/**
 * Countdown Service — Feature 3
 * Manages the 30-minute countdown for helper verification tasks.
 */

import VerificationTask from '../models/VerificationTask';
import User from '../models/User';
import NotificationService from './notificationService';
import { getIo } from '../socket';

const COUNTDOWN_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export const startCountdown = async (taskId: string) => {
    const task = await VerificationTask.findById(taskId);
    if (!task) throw new Error('Task not found');

    const now = new Date();
    task.countdownStartedAt = now;
    task.countdownDeadline = new Date(now.getTime() + COUNTDOWN_DURATION_MS);
    task.status = 'ARRIVAL_CONFIRMED';
    await task.save();

    // Notify helper that countdown started
    const io = getIo();
    if (io) {
        io.to(task.helperId.toString()).emit('countdown-started', {
            taskId: task._id,
            startedAt: task.countdownStartedAt,
            deadline: task.countdownDeadline,
            durationMs: COUNTDOWN_DURATION_MS,
        });
    }

    return task;
};

export const sendCountdownWarning = async (taskId: string, minutesLeft: number) => {
    const task = await VerificationTask.findById(taskId);
    if (!task || !['ARRIVAL_CONFIRMED', 'IN_PROGRESS'].includes(task.status)) return;

    const warningKey = minutesLeft === 20 ? 'at20min' : minutesLeft === 10 ? 'at10min' : 'at5min';

    if ((task.countdownWarnings as any)[warningKey]) return; // Already sent

    (task.countdownWarnings as any)[warningKey] = true;
    await task.save();

    const urgency = minutesLeft <= 5 ? 'FINAL WARNING' : minutesLeft <= 10 ? 'URGENT' : 'Reminder';
    const io = getIo();
    if (io) {
        io.to(task.helperId.toString()).emit('countdown-warning', {
            taskId: task._id,
            minutesLeft,
            urgency,
            deadline: task.countdownDeadline,
        });
    }

    await NotificationService.sendNotification(task.helperId.toString(), {
        title: `⏰ ${urgency}: ${minutesLeft} minutes left!`,
        message: `Complete verification task before ${task.countdownDeadline?.toLocaleTimeString()} to receive payment.`,
        type: 'warning',
        priority: minutesLeft <= 5 ? 'high' : 'medium',
    });
};

export const checkExpiredTasks = async () => {
    const now = new Date();
    const expiredTasks = await VerificationTask.find({
        status: { $in: ['ARRIVAL_CONFIRMED', 'IN_PROGRESS'] },
        countdownDeadline: { $lte: now },
    });

    for (const task of expiredTasks) {
        task.status = 'EXPIRED';
        task.paymentStatus = 'CANCELLED';
        task.ratingImpact = -0.2;
        await task.save();

        // Notify helper of expiry
        const io = getIo();
        if (io) {
            io.to(task.helperId.toString()).emit('task-expired', {
                taskId: task._id,
                deadline: task.countdownDeadline,
                expiredAt: now,
            });
        }

        await NotificationService.sendNotification(task.helperId.toString(), {
            title: '❌ Task Expired',
            message: 'The 30-minute deadline has passed. No payment will be issued. Rating impact: -0.2',
            type: 'warning',
            priority: 'high',
        });

        // Apply rating penalty
        await User.findByIdAndUpdate(task.helperId, {
            $inc: { 'creditScore.totalPoints': -20 },
        });

        console.log(`[COUNTDOWN] Task ${task.taskId} expired for helper ${task.helperId}`);
    }

    return expiredTasks.length;
};

export const checkWarnings = async () => {
    const now = new Date();
    const activeTasks = await VerificationTask.find({
        status: { $in: ['ARRIVAL_CONFIRMED', 'IN_PROGRESS'] },
        countdownDeadline: { $gt: now },
    });

    for (const task of activeTasks) {
        if (!task.countdownDeadline) continue;
        const msLeft = task.countdownDeadline.getTime() - now.getTime();
        const minLeft = msLeft / (60 * 1000);

        if (minLeft <= 5 && !task.countdownWarnings.at5min) {
            await sendCountdownWarning(task._id as string, 5);
        } else if (minLeft <= 10 && !task.countdownWarnings.at10min) {
            await sendCountdownWarning(task._id as string, 10);
        } else if (minLeft <= 20 && !task.countdownWarnings.at20min) {
            await sendCountdownWarning(task._id as string, 20);
        }
    }
};

export const completeTask = async (
    taskId: string,
    checklist: any,
    notes: string
) => {
    const task = await VerificationTask.findById(taskId);
    if (!task) throw new Error('Task not found');

    if (task.status === 'EXPIRED') throw new Error('Task has expired');
    if (task.status === 'COMPLETED_ON_TIME') throw new Error('Task already completed');

    if (task.proofPhotos.length < 5) {
        throw new Error(`Need at least 5 proof photos. Currently have ${task.proofPhotos.length}.`);
    }

    const now = new Date();
    task.status = 'COMPLETED_ON_TIME';
    task.completedAt = now;
    task.paymentStatus = 'RELEASED';
    task.checklist = checklist;
    task.verificationNotes = notes?.substring(0, 500);
    await task.save();

    // Release payment to helper
    await User.findByIdAndUpdate(task.helperId, {
        $inc: {
            'wallet.balance': task.paymentAmount,
            'wallet.totalEarned': task.paymentAmount,
            'statistics.totalHelps': 1,
        },
    });

    // Notify helper
    const io = getIo();
    if (io) {
        io.to(task.helperId.toString()).emit('task-completed', {
            taskId: task._id,
            completedAt: now,
            paymentAmount: task.paymentAmount,
        });
    }

    await NotificationService.sendNotification(task.helperId.toString(), {
        title: '✅ Task Completed!',
        message: `Verification completed successfully. ₹${task.paymentAmount} has been credited to your wallet.`,
        type: 'success',
        priority: 'high',
    });

    return task;
};
