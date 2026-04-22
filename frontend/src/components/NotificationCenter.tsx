import React, { useState, useEffect } from 'react';
import { Bell, X, Info, CheckCircle, AlertTriangle, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: string;
    text: string;
    type: 'info' | 'success' | 'warning';
    time: Date;
}

const NotificationCenter = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if (!token) return;

        const socket = io((import.meta as any).env.VITE_SOCKET_URL || 'http://localhost:5000', { auth: { token } });

        socket.on('notification', (data) => {
            const newNotif: Notification = {
                id: Math.random().toString(36).substr(2, 9),
                text: data.text,
                type: data.type || 'info',
                time: new Date()
            };
            setNotifications(prev => [newNotif, ...prev]);
            setHasUnread(true);

            if (isOpen) setHasUnread(false);
        });

        return () => { socket.disconnect(); };
    }, [token, isOpen]);

    const removeNotification = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleNotificationClick = (n: Notification) => {
        setIsOpen(false);
        navigate('/live-impact');
    };

    return (
        <div className="relative">
            <button
                onClick={() => { setIsOpen(!isOpen); setHasUnread(false); }}
                className={`relative p-3 rounded-2xl transition-all group outline-none ${isOpen ? 'bg-[#2E5CFF] text-white shadow-lg shadow-[#2E5CFF]/20' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}
            >
                <Bell size={20} className={`${hasUnread && !isOpen ? 'animate-bounce' : ''}`} />
                {hasUnread && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF6B6B] rounded-full border-2 border-[#1A1B1E] shadow-sm"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-[100] bg-[#1A1B1E]/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="absolute right-0 mt-6 w-[400px] max-h-[600px] bg-white rounded-[2.5rem] shadow-[0_32px_128px_-12px_rgba(0,0,0,0.2)] z-[110] overflow-hidden flex flex-col border border-[#E9ECEF]"
                        >
                            <div className="p-8 border-b border-[#E9ECEF] flex justify-between items-center bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#2E5CFF]/10 flex items-center justify-center text-[#2E5CFF]">
                                        <Zap size={18} fill="currentColor" />
                                    </div>
                                    <h3 className="text-sm font-heading font-black uppercase tracking-[0.2em] text-[#1A1B1E]">Ripple Stream</h3>
                                </div>
                                <button onClick={() => setNotifications([])} className="text-[10px] text-[#495057]/40 hover:text-[#FF6B6B] uppercase font-heading font-bold tracking-widest transition-colors">Clear All</button>
                            </div>

                            <div className="flex-grow overflow-y-auto custom-scrollbar p-1 space-y-1 max-h-[450px]">
                                {notifications.length === 0 ? (
                                    <div className="py-24 text-center select-none group">
                                        <div className="relative w-20 h-20 bg-[#FAFBFC] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                                            <Bell className="text-[#495057]/20" size={32} />
                                            <div className="absolute inset-0 bg-[#2E5CFF]/5 rounded-full animate-ping"></div>
                                        </div>
                                        <p className="text-[10px] font-heading font-bold uppercase tracking-[0.2em] text-[#495057]/40">Awaiting Sincerity Signals...</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className="p-6 rounded-[2rem] hover:bg-[#FAFBFC] transition-all flex gap-5 relative group cursor-pointer border border-transparent hover:border-[#E9ECEF]"
                                        >
                                            <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${n.type === 'success' ? 'bg-[#51CF66]/10 text-[#51CF66]' :
                                                    n.type === 'warning' ? 'bg-[#FFD93D]/10 text-[#FFD93D]' :
                                                        'bg-[#2E5CFF]/10 text-[#2E5CFF]'
                                                }`}>
                                                {n.type === 'success' ? <CheckCircle2 size={24} /> :
                                                    n.type === 'warning' ? <AlertTriangle size={24} /> :
                                                        <Info size={24} />}
                                            </div>
                                            <div className="flex-grow min-w-0 pr-4">
                                                <p className="text-[15px] font-body font-medium text-[#1A1B1E] leading-relaxed mb-2 line-clamp-2">{n.text}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-heading font-black text-[#495057]/30 uppercase tracking-widest">{new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="w-1 h-1 rounded-full bg-[#E9ECEF]"></span>
                                                    <span className="text-[9px] font-heading font-black text-[#2E5CFF] uppercase tracking-widest">Protocol Sync</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => removeNotification(n.id, e)}
                                                className="absolute top-6 right-6 text-[#495057]/20 hover:text-[#FF6B6B] opacity-0 group-hover:opacity-100 transition-all p-2"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="p-6 border-t border-[#E9ECEF] bg-[#FAFBFC] text-center">
                                    <button onClick={() => navigate('/live-impact')} className="text-[10px] font-heading font-black text-[#2E5CFF] uppercase tracking-[0.2em] flex items-center justify-center gap-2 w-full hover:underline underline-offset-4">
                                        View Full Impact Stream <ArrowRight size={14} />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
