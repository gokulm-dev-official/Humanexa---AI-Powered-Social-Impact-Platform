import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { ToastContainer, ToastMessage } from '../components/design-system/Toast';

export interface ExtendedToastMessage extends ToastMessage {
    metadata?: {
        chatId?: string;
    };
}

interface NotificationContextType {
    showToast: (text: string, type: ToastMessage['type'], metadata?: any) => void;
    notifications: ExtendedToastMessage[];
    unreadCount: number;
    markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<ToastMessage[]>([]);
    const [notifications, setNotifications] = useState<ExtendedToastMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);

    const showToast = useCallback((text: string, type: ToastMessage['type'] = 'info', metadata?: any) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newMsg: ExtendedToastMessage = { id, text, type, metadata };
        setMessages((prev) => [...prev, newMsg]);
        setNotifications((prev) => [newMsg, ...prev].slice(0, 20));
        setUnreadCount((prev) => prev + 1);
    }, []);

    const removeToast = useCallback((id: string) => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
    }, []);

    const markAllAsRead = useCallback(() => {
        setUnreadCount(0);
    }, []);

    useEffect(() => {
        if (token && !socket) {
            const backendUrl = (import.meta as any).env.VITE_SOCKET_URL || 'http://localhost:5000';
            console.log(`📡 Initializing Sincerity Stream on ${backendUrl}`);

            const newSocket = io(backendUrl, {
                auth: { token },
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => console.log('Connected to Sincerity Registry Sockets'));
            newSocket.on('connect_error', (err) => console.error('Socket Connection Error:', err));

            newSocket.on('notification', (data: { text: string; type: 'info' | 'success' | 'warning'; metadata?: any }) => {
                console.log('Incoming Signal Received:', data);
                showToast(data.text, data.type as any, data.metadata);

                if (Notification.permission === 'granted') {
                    new Notification('Social Kind Protocol', {
                        body: data.text,
                        icon: '/favicon.ico'
                    });
                }
            });

            // Emergency-specific events
            newSocket.on('emergency-alert', (data: any) => {
                console.log('🚨 EMERGENCY ALERT:', data);
                showToast(`🚨 ${data.emergencyLabel} - ${data.distance} km away`, 'warning', { type: 'emergency', alertId: data.alertId });
                if (Notification.permission === 'granted') {
                    new Notification('🚨 EMERGENCY ALERT', { body: `${data.emergencyLabel} - ${data.distance} km from you`, icon: '/favicon.ico' });
                }
            });

            newSocket.on('helper-accepted', (data: any) => {
                showToast(`✅ ${data.helper?.name || 'A helper'} is responding to your emergency!`, 'success');
            });

            newSocket.on('helper-arrived', (data: any) => {
                showToast(`✅ ${data.helperName || 'Helper'} has arrived at the emergency location!`, 'success');
            });

            newSocket.on('emergency-resolved', () => {
                showToast('Emergency has been resolved! Thank you.', 'success');
            });

            newSocket.on('emergency-cancelled', () => {
                showToast('Emergency alert was cancelled by the reporter.', 'info');
            });

            newSocket.on('emergency-taken', (data: any) => {
                showToast(`Emergency was accepted by ${data.acceptedBy || 'another helper'}.`, 'info');
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
                setSocket(null);
            };
        }
    }, [token, showToast]);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return (
        <NotificationContext.Provider value={{ showToast, notifications, unreadCount, markAllAsRead }}>
            {children}
            <ToastContainer messages={messages} onClose={removeToast} />
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
