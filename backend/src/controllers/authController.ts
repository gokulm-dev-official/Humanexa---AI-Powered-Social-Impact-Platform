import { Request, Response } from 'express';
import User from '../models/User';
import { sendTokenResponse } from '../utils/generateToken';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
    try {
        const { email, phoneNumber, password, fullName, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { phoneNumber }] });
        if (userExists) {
            return res.status(400).json({ status: 'fail', message: 'User already exists' });
        }

        // Extract optional location data
        const { latitude, longitude, locationAddress } = req.body;

        // Create user
        const userData: any = {
            email,
            phoneNumber,
            password,
            profile: { fullName },
            role: role || 'donor',
        };

        // Save location if provided during registration
        if (latitude && longitude) {
            userData.address = {
                formattedAddress: locationAddress || '',
                coordinates: {
                    type: 'Point',
                    coordinates: [longitude, latitude], // GeoJSON: [lng, lat]
                },
            };
        }

        const user = await User.create(userData);

        sendTokenResponse(user, 201, res);
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password, latitude, longitude, locationAddress } = req.body;

        // Check for email and password
        if (!email || !password) {
            return res.status(400).json({ status: 'fail', message: 'Please provide email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
        }

        // Update location if provided during login
        if (latitude && longitude) {
            if (!user.address) user.address = {} as any;
            user.address.formattedAddress = locationAddress || user.address.formattedAddress || '';
            user.address.coordinates = {
                type: 'Point',
                coordinates: [longitude, latitude], // GeoJSON: [lng, lat]
            };
            await user.save();
        }

        sendTokenResponse(user, 200, res);
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: any, res: Response) => {
    try {
        // Fetch fresh user data with all statistics and creditScore
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        // Automatic Welcome Bonus for first-time login/profile fetch
        if (user.creditScore.totalPoints === 0 && user.statistics.totalHelps === 0) {
            user.creditScore.totalPoints = 150;
            user.creditScore.streak.current = 1;
            user.creditScore.streak.lastActivityAt = new Date();
            user.statistics.totalHelps = 1; // Mark the "First Spark" as a verified act
            user.creditScore.rank = 'Welcome';
            await user.save();
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: user,
            },
        });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
export const logout = async (req: Request, res: Response) => {
    res.cookie('refreshToken', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });

    res.status(200).json({
        status: 'success',
        data: {},
    });
};

// @desc    Verify user identity (Simple Mock)
// @route   POST /api/auth/verify-id
// @access  Private
export const verifyId = async (req: any, res: Response) => {
    try {
        const { documentUrl } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        user.governmentId = {
            ...user.governmentId,
            documentUrl,
            verified: true, // Auto-verify for demo
            verifiedAt: new Date(),
        };
        user.verificationStatus.idVerified = true;
        await user.save();

        res.status(200).json({ status: 'success', data: { user } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
export const updateDetails = async (req: any, res: Response) => {
    try {
        const { fullName, email, bio, gender, avatar, latitude, longitude, locationAddress, bloodGroup } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        if (fullName) user.profile.fullName = fullName;
        if (email) user.email = email;
        if (bio !== undefined) user.profile.bio = bio;
        if (gender && gender !== '') user.profile.gender = gender;
        if (avatar !== undefined) user.profile.avatar = avatar;
        if (bloodGroup && bloodGroup !== '') (user.profile as any).bloodGroup = bloodGroup;

        // Update location if provided
        if (latitude && longitude) {
            if (!user.address) user.address = {} as any;
            user.address.formattedAddress = locationAddress || user.address.formattedAddress || '';
            user.address.coordinates = {
                type: 'Point',
                coordinates: [longitude, latitude], // GeoJSON: [lng, lat]
            };
        }

        await user.save();

        res.status(200).json({ status: 'success', data: { user } });
    } catch (err: any) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
