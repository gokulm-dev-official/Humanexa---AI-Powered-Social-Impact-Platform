import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import VerificationTask from '../models/VerificationTask';
import HelpRequest from '../models/HelpRequest';
import { startCountdown, completeTask as completeTaskService } from '../services/countdownService';
import { validatePhoto } from '../services/photoValidationService';
import { broadcastProofPhotos } from '../services/donationBroadcastService';
import { v4 as uuidv4 } from 'uuid';

function generateTaskId(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `VT-${y}-${m}-${d}-${rand}`;
}

// POST /api/v1/tasks/
export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const { requestId, paymentAmount } = req.body;
        if (!requestId) {
            return res.status(400).json({ status: 'fail', message: 'requestId is required.' });
        }

        const request = await HelpRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ status: 'fail', message: 'Help request not found.' });
        }

        const task = await VerificationTask.create({
            taskId: generateTaskId(),
            helperId: req.user!._id,
            requestId,
            status: 'ASSIGNED',
            paymentAmount: paymentAmount || 1500,
            paymentStatus: 'PENDING',
            proofPhotos: [],
            checklist: {
                itemsVerified: false,
                quantitiesChecked: false,
                expiryDatesChecked: false,
                matchedWithBills: false,
                staffConfirmed: false,
            },
            countdownWarnings: { at20min: false, at10min: false, at5min: false },
            facilityLocation: {
                latitude: request.location?.coordinates?.coordinates?.[1] || 0,
                longitude: request.location?.coordinates?.coordinates?.[0] || 0,
                address: request.location?.address || '',
                allowedRadius: 50,
            },
        });

        res.status(201).json({ status: 'success', data: { task } });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// GET /api/v1/tasks/:taskId
export const getTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await VerificationTask.findById(req.params.taskId)
            .populate('requestId', 'title requestType amount location')
            .populate('helperId', 'profile.fullName');

        if (!task) return res.status(404).json({ status: 'fail', message: 'Task not found.' });

        // Calculate time remaining
        let timeRemaining = null;
        if (task.countdownDeadline && ['ARRIVAL_CONFIRMED', 'IN_PROGRESS'].includes(task.status)) {
            const msLeft = task.countdownDeadline.getTime() - Date.now();
            timeRemaining = {
                msLeft: Math.max(0, msLeft),
                secondsLeft: Math.max(0, Math.floor(msLeft / 1000)),
                minutesLeft: Math.max(0, Math.floor(msLeft / 60000)),
                isExpired: msLeft <= 0,
                percentUsed: task.countdownStartedAt
                    ? Math.round(((Date.now() - task.countdownStartedAt.getTime()) / (30 * 60 * 1000)) * 100)
                    : 0,
            };
        }

        res.status(200).json({
            status: 'success',
            data: {
                task,
                timeRemaining,
                photosUploaded: task.proofPhotos.length,
                photosRequired: 5,
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// POST /api/v1/tasks/:taskId/confirm-arrival
export const confirmArrival = async (req: AuthRequest, res: Response) => {
    try {
        const task = await VerificationTask.findById(req.params.taskId);
        if (!task) return res.status(404).json({ status: 'fail', message: 'Task not found.' });
        if (task.helperId.toString() !== (req.user!._id as any).toString()) {
            return res.status(403).json({ status: 'fail', message: 'Not your task.' });
        }
        if (task.status !== 'ASSIGNED') {
            return res.status(400).json({ status: 'fail', message: 'Task already confirmed or expired.' });
        }

        const { photoUrl, gpsLatitude, gpsLongitude, timestamp } = req.body;

        // Validate arrival photo
        const validation = validatePhoto(
            { gpsLatitude, gpsLongitude, timestamp, width: 1920, height: 1080, format: 'jpeg' },
            { latitude: task.facilityLocation.latitude, longitude: task.facilityLocation.longitude },
            task.facilityLocation.allowedRadius,
            120
        );

        if (!validation.isValid) {
            return res.status(400).json({
                status: 'fail',
                message: 'Arrival photo validation failed.',
                data: { validation },
            });
        }

        task.arrivalPhoto = {
            url: photoUrl || 'arrival_photo_url',
            gpsLat: gpsLatitude,
            gpsLng: gpsLongitude,
            timestamp: new Date(timestamp || Date.now()),
            validated: true,
        };

        await task.save();

        // Start the 30-minute countdown
        const updatedTask = await startCountdown(task._id as string);

        res.status(200).json({
            status: 'success',
            message: 'Arrival confirmed. 30-minute countdown started!',
            data: {
                task: updatedTask,
                countdown: {
                    startedAt: updatedTask.countdownStartedAt,
                    deadline: updatedTask.countdownDeadline,
                    durationMinutes: 30,
                },
                validation,
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// POST /api/v1/tasks/:taskId/upload-photo
export const uploadTaskPhoto = async (req: AuthRequest, res: Response) => {
    try {
        const task = await VerificationTask.findById(req.params.taskId);
        if (!task) return res.status(404).json({ status: 'fail', message: 'Task not found.' });
        if (task.helperId.toString() !== (req.user!._id as any).toString()) {
            return res.status(403).json({ status: 'fail', message: 'Not your task.' });
        }
        if (!['ARRIVAL_CONFIRMED', 'IN_PROGRESS'].includes(task.status)) {
            return res.status(400).json({ status: 'fail', message: 'Task cannot accept photos in current state.' });
        }

        // Check if countdown expired
        if (task.countdownDeadline && new Date() > task.countdownDeadline) {
            task.status = 'EXPIRED';
            task.paymentStatus = 'CANCELLED';
            await task.save();
            return res.status(400).json({ status: 'fail', message: 'Countdown has expired.' });
        }

        const { photoUrl, gpsLatitude, gpsLongitude, timestamp, photoType } = req.body;

        const validation = validatePhoto(
            { gpsLatitude, gpsLongitude, timestamp, width: 1920, height: 1080, format: 'jpeg' },
            { latitude: task.facilityLocation.latitude, longitude: task.facilityLocation.longitude },
            task.facilityLocation.allowedRadius
        );

        task.proofPhotos.push({
            url: photoUrl || `proof_photo_${task.proofPhotos.length + 1}`,
            gpsLat: gpsLatitude || 0,
            gpsLng: gpsLongitude || 0,
            timestamp: new Date(timestamp || Date.now()),
            validated: validation.isValid,
            photoType: photoType || 'general',
        });

        if (task.status === 'ARRIVAL_CONFIRMED') {
            task.status = 'IN_PROGRESS';
        }

        await task.save();

        res.status(200).json({
            status: 'success',
            data: {
                photosUploaded: task.proofPhotos.length,
                photosRequired: 5,
                canSubmit: task.proofPhotos.length >= 5,
                validation,
            },
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// POST /api/v1/tasks/:taskId/complete
export const completeVerificationTask = async (req: AuthRequest, res: Response) => {
    try {
        const task = await VerificationTask.findById(req.params.taskId);
        if (!task) return res.status(404).json({ status: 'fail', message: 'Task not found.' });
        if (task.helperId.toString() !== (req.user!._id as any).toString()) {
            return res.status(403).json({ status: 'fail', message: 'Not your task.' });
        }

        const { checklist, notes } = req.body;

        const completedTask = await completeTaskService(task._id as string, checklist, notes);

        // Broadcast proof photos to all donors (Feature 4)
        const helper = req.user!;
        await broadcastProofPhotos(
            task.requestId.toString(),
            helper.profile?.fullName || 'Helper',
            helper.creditScore?.totalPoints || 0,
            task.proofPhotos.map((p) => ({
                url: p.url,
                gpsLat: p.gpsLat,
                gpsLng: p.gpsLng,
                timestamp: p.timestamp,
            })),
            notes || '',
            checklist
        );

        res.status(200).json({
            status: 'success',
            message: 'Verification completed successfully! Payment released.',
            data: {
                task: completedTask,
                paymentReleased: completedTask.paymentAmount,
            },
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// GET /api/v1/tasks/helper/active
export const getHelperActiveTasks = async (req: AuthRequest, res: Response) => {
    try {
        const tasks = await VerificationTask.find({
            helperId: req.user!._id,
            status: { $in: ['ASSIGNED', 'ARRIVAL_CONFIRMED', 'IN_PROGRESS'] },
        })
            .populate('requestId', 'title requestType amount location')
            .sort({ createdAt: -1 });

        const tasksWithCountdown = tasks.map((task) => {
            let timeRemaining = null;
            if (task.countdownDeadline && ['ARRIVAL_CONFIRMED', 'IN_PROGRESS'].includes(task.status)) {
                const msLeft = task.countdownDeadline.getTime() - Date.now();
                timeRemaining = {
                    secondsLeft: Math.max(0, Math.floor(msLeft / 1000)),
                    minutesLeft: Math.max(0, Math.floor(msLeft / 60000)),
                    isExpired: msLeft <= 0,
                };
            }
            return { ...task.toObject(), timeRemaining };
        });

        res.status(200).json({ status: 'success', data: { tasks: tasksWithCountdown } });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// GET /api/v1/tasks/helper/history
export const getHelperTaskHistory = async (req: AuthRequest, res: Response) => {
    try {
        const tasks = await VerificationTask.find({
            helperId: req.user!._id,
            status: { $in: ['COMPLETED_ON_TIME', 'EXPIRED', 'CANCELLED'] },
        })
            .populate('requestId', 'title requestType')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({ status: 'success', data: { tasks } });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
