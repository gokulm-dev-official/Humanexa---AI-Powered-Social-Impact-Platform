import jwt from 'jsonwebtoken';
import { Response } from 'express';

export const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', {
        expiresIn: (process.env.JWT_EXPIRE as any) || '15m',
    });
};

export const generateRefreshToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret', {
        expiresIn: (process.env.JWT_REFRESH_EXPIRE as any) || '7d',
    });
};

export const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};
