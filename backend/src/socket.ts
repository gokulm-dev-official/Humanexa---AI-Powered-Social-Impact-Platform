import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User';

export const setupSocket = (server: any) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Auth error'));

            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
            const user = await User.findById(decoded.id);
            if (!user) return next(new Error('User not found'));

            socket.data.user = user;
            next();
        } catch (err) {
            next(new Error('Auth error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.data.user.email}`);

        // Join a private room for this user
        const room = socket.data.user._id.toString();
        socket.join(room);
        console.log(`User ${socket.data.user.email} joined room: ${room}`);

        // Feature 5: Join request-specific rooms for live donation updates
        socket.on('join-request', (requestId: string) => {
            if (requestId) {
                socket.join(`request:${requestId}`);
                console.log(`User ${socket.data.user.email} joined request room: ${requestId}`);
            }
        });

        socket.on('leave-request', (requestId: string) => {
            if (requestId) {
                socket.leave(`request:${requestId}`);
                console.log(`User ${socket.data.user.email} left request room: ${requestId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });

    return io;
};

let ioInstance: Server;
export const setIo = (io: Server) => { ioInstance = io; };
export const getIo = () => ioInstance;
