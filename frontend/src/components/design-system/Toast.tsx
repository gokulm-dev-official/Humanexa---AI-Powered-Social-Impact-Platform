import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, CheckCircle, AlertTriangle, Bell } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ToastMessage {
    id: string;
    text: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

interface ToastProps {
    messages: ToastMessage[];
    onClose: (id: string) => void;
}

const appleEase = [0.25, 0.1, 0.25, 1] as const;

export const ToastContainer = ({ messages, onClose }: ToastProps) => {
    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {messages.map((msg) => (
                    <ToastItem key={msg.id} message={msg} onClose={onClose} />
                ))}
            </AnimatePresence>
        </div>
    );
};

const ToastItem = ({ message, onClose }: { message: ToastMessage; onClose: (id: string) => void }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClose(message.id), 4500);
        return () => clearTimeout(timer);
    }, [message.id, onClose]);

    const config = {
        info: {
            icon: <Bell size={16} className="text-accent" />,
            bg: "bg-white border-accent/10 shadow-glow",
            accent: "bg-accent",
        },
        success: {
            icon: <CheckCircle size={16} className="text-success" />,
            bg: "bg-white border-success/10 shadow-glow-success",
            accent: "bg-success",
        },
        warning: {
            icon: <AlertTriangle size={16} className="text-warning" />,
            bg: "bg-white border-warning/10 shadow-glow-amber",
            accent: "bg-warning",
        },
        error: {
            icon: <X size={16} className="text-danger" />,
            bg: "bg-white border-danger/10 shadow-soft-lg",
            accent: "bg-danger",
        },
    };

    const { icon, bg, accent } = config[message.type];

    return (
        <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: appleEase }}
            className={cn(
                "pointer-events-auto flex items-center gap-3 pl-5 pr-3 py-3.5 rounded-2xl border min-w-[300px] max-w-md relative overflow-hidden",
                bg
            )}
        >
            {/* Accent line */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl", accent)} />

            <div className="flex-shrink-0">{icon}</div>
            <div className="flex-grow">
                <p className="text-[13px] font-medium text-primary-text leading-snug">{message.text}</p>
            </div>
            <button
                onClick={() => onClose(message.id)}
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-secondary-text/40 hover:text-primary-text hover:bg-black/[0.04] transition-all duration-200"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
};
