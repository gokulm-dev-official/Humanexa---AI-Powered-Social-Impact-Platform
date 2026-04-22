import app from './app';
import connectDB from './config/db';
import { setupSocket, setIo } from './socket';

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Setup Socket.io
const io = setupSocket(server);
setIo(io);

import NotificationService from './services/notificationService';
NotificationService.init(io);

import CleanupService from './services/cleanupService';
CleanupService.start();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
