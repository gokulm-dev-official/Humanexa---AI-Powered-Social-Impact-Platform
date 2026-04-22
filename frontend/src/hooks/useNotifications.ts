import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

let socket: Socket | null = null;

export const useNotifications = () => {
    const { token, user } = useAuth();

    useEffect(() => {
        if (token && !socket) {
            socket = io((import.meta as any).env.VITE_SOCKET_URL || 'http://localhost:5000', {
                auth: { token }
            });

            socket.on('notification', (data: { text: string; type: 'info' | 'success' | 'warning' }) => {
                // Using browser notifications as a fallback/primary for the system
                if (Notification.permission === 'granted') {
                    new Notification('Social Kind Protocol', {
                        body: data.text,
                        icon: '/favicon.ico'
                    });
                }

                // Also log to console for debugging
                console.log('%c[PROTOCOL NOTIFICATION]', 'color: #3B82F6; font-weight: bold', data);
            });

            socket.on('connect', () => {
                console.log('Connected to notification registry');
            });
        }

        return () => {
            // Optional: socket.disconnect() if you want to close on unmount
            // But usually for app-level notifications, we keep it open
        };
    }, [token]);

    const requestPermission = async () => {
        if ('Notification' in window) {
            await Notification.requestPermission();
        }
    };

    return { requestPermission };
};
