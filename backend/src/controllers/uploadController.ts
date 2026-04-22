import { v2 as cloudinary } from 'cloudinary';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file: Express.Multer.File): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Check if Cloudinary is configured with real keys
        if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === '123456789') {
            return reject(new Error('Cloudinary not configured'));
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'social_kind' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result!.secure_url);
            }
        );
        uploadStream.end(file.buffer);
    });
};

export const uploadSingleImage = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
        }

        let url: string;
        try {
            // Try Cloudinary first
            url = await uploadToCloudinary(req.file);
            console.log('Cloudinary upload success:', url);
        } catch (err: any) {
            // Fallback to local storage for development
            console.warn('Cloudinary upload skipped or failed:', err.message);

            const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
            const publicDir = path.join(process.cwd(), 'public');
            const uploadDir = path.join(publicDir, 'uploads');
            const uploadPath = path.join(uploadDir, fileName);

            // Ensure directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            fs.writeFileSync(uploadPath, req.file.buffer);

            // Generate clean URL
            url = `/uploads/${fileName}`;
            console.log('Local upload success:', url);
        }

        res.status(200).json({ status: 'success', data: { url } });
    } catch (err: any) {
        console.error('Upload Controller Error:', err.message);
        res.status(500).json({ status: 'fail', message: `Internal server error during upload: ${err.message}` });
    }
};
