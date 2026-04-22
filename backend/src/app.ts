import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import helpRequestRoutes from './routes/helpRequestRoutes';
import adminRoutes from './routes/adminRoutes';
import impactChatRoutes from './routes/impactChatRoutes';
import uploadRoutes from './routes/uploadRoutes';
import institutionRoutes from './routes/institutionRoutes';
import emergencyRoutes from './routes/emergencyRoutes';
import verificationRoutes from './routes/verificationRoutes';
import verificationTaskRoutes from './routes/verificationTaskRoutes';
import ratingRoutes from './routes/ratingRoutes';
import certificationRoutes from './routes/certificationRoutes';
import aiRoutes from './routes/aiRoutes';
import bloodRequestRoutes from './routes/bloodRequestRoutes';
import { setupDeadlineWorker } from './services/cronService';

// Load env vars
dotenv.config();

const app: Application = express();

// Serve static files
import path from 'path';
app.use(express.static(path.join(process.cwd(), 'public')));

// Set security HTTP headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: false // Disabled for local development over HTTP
}));

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
    max: 1000, // Increased for development
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!',
});
// app.use('/api', limiter); // Disabled for easier local development

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
// app.use(mongoSanitize());

// Data sanitization against XSS
// app.use(xss());

// Implement CORS
const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/help-requests', helpRequestRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/impact-chat', impactChatRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/institution', institutionRoutes);
app.use('/api/v1/emergency', emergencyRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/tasks', verificationTaskRoutes);
app.use('/api/v1/ratings', ratingRoutes);
app.use('/api/v1/certification', certificationRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/blood-request', bloodRequestRoutes);

// Initialize Background Workers
// setupDeadlineWorker();

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'Welcome to Social Kind API',
    });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

export default app;
