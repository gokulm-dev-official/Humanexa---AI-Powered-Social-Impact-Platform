import express from 'express';
import { register, login, getMe, logout, verifyId, updateDetails } from '../controllers/authController';
import { protect } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.post('/verify-id', protect, verifyId);
router.put('/updatedetails', protect, updateDetails);

// Get all institutions (public for discovery)
router.get('/institutions', protect, async (req: any, res) => {
    try {
        const institutions = await User.find({ role: 'institution' })
            .select('profile address statistics creditScore verificationStatus institutionMembers')
            .lean();
        res.json({ status: 'success', data: { institutions } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Add member to institution
router.post('/institution/members', protect, async (req: any, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || user.role !== 'institution') {
            return res.status(403).json({ status: 'fail', message: 'Only institutions can manage members' });
        }
        const { name, age, photo } = req.body;
        if (!name) return res.status(400).json({ status: 'fail', message: 'Name is required' });

        if (!(user as any).institutionMembers) (user as any).institutionMembers = [];
        (user as any).institutionMembers.push({ name, age, photo, addedAt: new Date() });
        await user.save();

        res.json({ status: 'success', data: { members: (user as any).institutionMembers } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

// Delete member from institution
router.delete('/institution/members/:memberId', protect, async (req: any, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || user.role !== 'institution') {
            return res.status(403).json({ status: 'fail', message: 'Only institutions can manage members' });
        }
        (user as any).institutionMembers = ((user as any).institutionMembers || []).filter(
            (m: any) => m._id.toString() !== req.params.memberId
        );
        await user.save();
        res.json({ status: 'success', data: { members: (user as any).institutionMembers } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
});

export default router;
