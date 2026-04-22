import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Mail, Image as ImageIcon, File, Link as LinkIcon, Shield, Star, Ban, ExternalLink, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../design-system/Badge';

interface ChatDetailsProps {
    chat: any;
    isOpen: boolean;
    onClose: () => void;
}

export const ChatDetails: React.FC<ChatDetailsProps> = ({ chat, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = React.useState<'media' | 'files' | 'links'>('media');

    if (!chat) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 400, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="h-full bg-white border-l border-gray-100 flex flex-col overflow-hidden shadow-2xl relative z-30"
                >
                    {/* Header */}
                    <div className="h-20 px-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                        <h3 className="text-lg font-serif font-black text-primary-text tracking-tight uppercase">Chat Details</h3>
                        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center text-secondary-text transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* User Profile */}
                        <div className="p-8 flex flex-col items-center border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-white">
                            <div className="relative mb-6">
                                <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl rotate-3">
                                    <img
                                        src={chat.initialPhoto || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                        className="w-full h-full object-cover -rotate-3 scale-110"
                                        alt="Profile"
                                    />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-md" />
                            </div>

                            <h4 className="text-xl font-serif font-black text-primary-text mb-1 tracking-tight">Signal #{chat._id.slice(-6).toUpperCase()}</h4>
                            <p className="text-sm font-bold text-secondary-text/60 uppercase tracking-[0.2em] mb-4">Location Anchor</p>

                            <div className="flex items-center gap-2 mb-6">
                                <Badge variant="sapphire" size="md" icon={<Star size={10} className="fill-current" />}>Elite Helper</Badge>
                                <Badge variant="success" size="md">Verified</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full">
                                <ActionButton icon={<Phone size={16} />} label="Call" color="sapphire" />
                                <ActionButton icon={<Ban size={16} />} label="Block" color="error" />
                            </div>
                        </div>

                        {/* Request Summary (If applicable) */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="text-[11px] font-black text-secondary-text uppercase tracking-widest">Protocol Metadata</h5>
                                <Badge variant="neutral" size="sm">Active</Badge>
                            </div>
                            <div className="space-y-4">
                                <MetadataItem label="Signal ID" value={`SK-${chat._id.slice(-8).toUpperCase()}`} />
                                <MetadataItem label="Created At" value={new Date(chat.createdAt).toLocaleDateString()} />
                                <MetadataItem label="Status" value={chat.status.replace('_', ' ')} />
                            </div>
                        </div>

                        {/* Shared Content */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h5 className="text-[11px] font-black text-secondary-text uppercase tracking-widest">Digital Artifacts</h5>
                                <div className="flex bg-gray-50 p-1 rounded-lg">
                                    <TabButton active={activeTab === 'media'} onClick={() => setActiveTab('media')} icon={<ImageIcon size={14} />} />
                                    <TabButton active={activeTab === 'files'} onClick={() => setActiveTab('files')} icon={<File size={14} />} />
                                    <TabButton active={activeTab === 'links'} onClick={() => setActiveTab('links')} icon={<LinkIcon size={14} />} />
                                </div>
                            </div>

                            {activeTab === 'media' && (
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="aspect-square rounded-xl bg-gray-100 overflow-hidden border border-gray-50 group cursor-pointer hover:border-sapphire/20 transition-all shadow-sm">
                                            <img src={`https://picsum.photos/seed/${i + 10}/200`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Artifact" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'files' && (
                                <div className="flex flex-col gap-2">
                                    <FileItem name="Payment_Receipt.pdf" size="1.2 MB" />
                                    <FileItem name="Sincerity_Check.jpg" size="4.5 MB" />
                                </div>
                            )}

                            {activeTab === 'links' && (
                                <div className="flex flex-col gap-2">
                                    <LinkItem url="socialkind.com/impact/123" />
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const ActionButton = ({ icon, label, color }: any) => (
    <button className={cn(
        "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 group",
        color === 'sapphire' ? "bg-sapphire/5 border-sapphire/10 hover:bg-sapphire/10 text-sapphire" : "bg-red-50 border-red-100 hover:bg-red-100 text-red-600"
    )}>
        <span className="p-2 rounded-xl bg-white shadow-soft-sm group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
);

const MetadataItem = ({ label, value }: any) => (
    <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-secondary-text">{label}</span>
        <span className="text-[13px] font-bold text-primary-text">{value}</span>
    </div>
);

const TabButton = ({ active, onClick, icon }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "w-8 h-8 flex items-center justify-center rounded-md transition-all",
            active ? "bg-white text-sapphire shadow-sm" : "text-gray-400 hover:text-secondary-text"
        )}
    >
        {icon}
    </button>
);

const FileItem = ({ name, size }: any) => (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-sapphire transition-colors shadow-inner">
            <File size={18} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-primary-text truncate uppercase tracking-tight">{name}</p>
            <p className="text-[10px] font-black text-secondary-text/40 uppercase tracking-widest">{size}</p>
        </div>
        <ExternalLink size={14} className="text-gray-300" />
    </div>
);

const LinkItem = ({ url }: any) => (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer overflow-hidden">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-sapphire transition-colors shadow-inner shrink-0">
            <LinkIcon size={18} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-sapphire truncate hover:underline">{url}</p>
        </div>
    </div>
);
