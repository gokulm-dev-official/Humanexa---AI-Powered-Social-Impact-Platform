import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, FileText, Download, ExternalLink, MapPin, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MessageBubbleProps {
    message: any;
    isOwn: boolean;
    isLastInGroup: boolean;
    sender: any;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isOwn,
    isLastInGroup,
    sender
}) => {
    const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check for special message types
    const isImage = message.text?.match(/\.(jpeg|jpg|gif|png|webp)/i);
    const isFile = message.type === 'file';
    const isLocation = message.type === 'location';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
                "flex flex-col w-full mb-1",
                isOwn ? "items-end" : "items-start",
                isLastInGroup ? "mb-6" : "mb-1"
            )}
        >
            <div className={cn(
                "flex gap-3 max-w-[75%] lg:max-w-[65%]",
                isOwn ? "flex-row-reverse" : "flex-row"
            )}>
                {/* Avatar */}
                <div className="w-8 shrink-0 self-end">
                    {isLastInGroup && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="relative"
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full overflow-hidden border border-white shadow-sm flex items-center justify-center text-[10px] font-black uppercase tracking-tighter",
                                isOwn ? "bg-gradient-to-br from-sapphire-start to-sapphire-end text-white" : "bg-gray-100 text-secondary-text"
                            )}>
                                {isOwn ? "Me" : sender?.profile?.fullName?.[0] || "U"}
                            </div>
                            {sender?.verificationStatus?.idVerified && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <CheckCircle2 size={10} className="text-emerald-500 fill-emerald-50" />
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Bubble Container */}
                <div className="flex flex-col group relative">
                    <div className={cn(
                        "relative px-4 py-3 shadow-soft-sm transition-all duration-300",
                        isOwn
                            ? "bg-gradient-to-br from-sapphire-start to-sapphire-end text-white rounded-2xl rounded-br-sm shadow-sapphire/10"
                            : "bg-white border border-gray-100 text-primary-text rounded-2xl rounded-bl-sm"
                    )}>
                        {/* Message Content */}
                        {isImage ? (
                            <div className="space-y-2">
                                <img src={message.text} className="rounded-xl max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity" alt="Shared" />
                                {message.caption && <p className="text-[15px] leading-relaxed font-medium">{message.caption}</p>}
                            </div>
                        ) : isFile ? (
                            <div className="flex items-center gap-3 bg-white/10 dark:bg-black/10 p-3 rounded-xl border border-white/20">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold truncate">project_spec_v1.pdf</span>
                                    <span className="text-[10px] opacity-60 font-black uppercase tracking-widest">2.4 MB</span>
                                </div>
                                <button className="ml-2 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                                    <Download size={14} />
                                </button>
                            </div>
                        ) : (
                            <p className="text-[15px] leading-relaxed font-medium whitespace-pre-wrap selection:bg-white/20">
                                {message.text}
                            </p>
                        )}

                        {/* Hover Actions (Reactions) placeholder */}
                        <div className={cn(
                            "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1",
                            isOwn ? "-left-20 pr-4" : "-right-20 pl-4"
                        )}>
                            <button className="w-8 h-8 rounded-full bg-white border border-gray-100 shadow-soft-sm flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-sapphire transition-all">
                                😊
                            </button>
                        </div>
                    </div>

                    {/* Footer / Timestamp */}
                    {isLastInGroup && (
                        <div className={cn(
                            "flex items-center gap-1.5 mt-1.5 px-1",
                            isOwn ? "justify-end" : "justify-start"
                        )}>
                            <span className="text-[10px] font-bold text-secondary-text/40 uppercase tracking-widest tabular-nums">
                                {time}
                            </span>
                            {isOwn && (
                                <div className="flex text-sapphire">
                                    <CheckCheck size={12} strokeWidth={3} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export const DateDivider = ({ date }: { date: string }) => (
    <div className="flex items-center gap-4 py-8 px-4 opacity-50">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[10px] font-black text-secondary-text uppercase tracking-[0.2em]">
            {date}
        </span>
        <div className="flex-1 h-px bg-gray-100" />
    </div>
);

export const SystemMessage = ({ children, icon }: any) => (
    <div className="flex justify-center py-6 px-4">
        <div className="bg-gray-50 border border-gray-100 rounded-full px-5 py-2 flex items-center gap-2 shadow-inner">
            {icon && <span className="text-sapphire">{icon}</span>}
            <span className="text-[12px] font-bold text-secondary-text/60 tracking-tight">{children}</span>
        </div>
    </div>
);
