import React from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, MoreHorizontal, MessageSquare, Heart, Zap, Shield, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../design-system/Badge';
import { Input } from '../design-system/Input';
import { Button } from '../design-system/Button';

interface ConversationListProps {
    chats: any[];
    activeChat: any;
    onSelectChat: (chat: any) => void;
    user: any;
    onNewChat?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
    chats,
    activeChat,
    onSelectChat,
    user,
    onNewChat
}) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [activeTab, setActiveTab] = React.useState<'all' | 'unread' | 'archived'>('all');

    const filteredChats = chats.filter(chat => {
        // Simple search filter
        const matchesSearch = chat._id.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        if (activeTab === 'unread') {
            // Placeholder for unread logic - in a real app check chat.unreadCount
            return false;
        }
        return true;
    });

    return (
        <div className="w-[360px] h-full flex flex-col bg-white border-r border-gray-100 relative z-20 overflow-hidden shadow-soft-sm">
            {/* User Profile Card */}
            <div className="h-20 px-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="relative group cursor-pointer">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm transition-transform active:scale-95">
                            <img
                                src={user?.profile?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-primary-text leading-tight group-hover:text-sapphire transition-colors">{user?.profile?.fullName || "Verified Citizen"}</span>
                        <span className="text-[11px] font-bold text-secondary-text/60 uppercase tracking-widest">{user?.role?.replace('_', ' ') || "Identity"}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-secondary-text/40 hover:text-primary-text">
                    <MoreHorizontal size={20} />
                </Button>
            </div>

            {/* Search Bar */}
            <div className="p-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sapphire transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search messages or people"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 bg-gray-50 border-transparent rounded-xl pl-11 pr-4 text-[14px] font-medium placeholder:text-gray-400 focus:bg-white focus:ring-4 focus:ring-sapphire/5 focus:border-sapphire/20 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Quick Filters */}
            <div className="px-4 flex items-center gap-1 border-b border-gray-100 scrollbar-hide overflow-x-auto">
                <FilterTab active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="All" count={chats.length} />
                <FilterTab active={activeTab === 'unread'} onClick={() => setActiveTab('unread')} label="Unread" count={0} />
                <FilterTab active={activeTab === 'archived'} onClick={() => setActiveTab('archived')} label="Archived" />
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                <div className="py-2">
                    {filteredChats.length > 0 ? (
                        filteredChats.map((chat) => (
                            <ThreadCard
                                key={chat._id}
                                chat={chat}
                                active={activeChat?._id === chat._id}
                                onClick={() => onSelectChat(chat)}
                                currentUser={user}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                            <MessageSquare size={48} className="mb-4 text-gray-300" />
                            <p className="text-sm font-bold uppercase tracking-widest">No conversations found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New Chat Button */}
            <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-100">
                <Button
                    onClick={onNewChat}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-sapphire-start to-sapphire-end text-white font-bold text-sm shadow-lg shadow-sapphire/20 hover:shadow-glow hover:-translate-y-0.5"
                    leftIcon={<Plus size={18} />}
                >
                    Start New Conversation
                </Button>
            </div>
        </div>
    );
};

const FilterTab = ({ active, onClick, label, count }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "relative px-4 py-4 text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
            active ? "text-primary-text" : "text-secondary-text/60 hover:text-primary-text"
        )}
    >
        {label}
        {count !== undefined && (
            <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-black min-w-[18px]",
                active ? "bg-sapphire text-white shadow-glow" : "bg-gray-100 text-gray-400"
            )}>
                {count}
            </span>
        )}
        {active && (
            <motion.div
                layoutId="activeFilterTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sapphire shadow-glow"
            />
        )}
    </button>
);

const ThreadCard = ({ chat, active, onClick, currentUser }: any) => {
    // Determine the other party's name
    const isHelper = chat.helperId?._id === currentUser?._id || chat.helperId === currentUser?._id;
    const otherParty = isHelper ? chat.donorId : chat.helperId;

    let title = otherParty?.profile?.fullName || `Signal #${chat._id.slice(-6).toUpperCase()}`;

    // If it's a new need without a donor yet, show generic title for everyone except the helper
    if (!chat.donorId && !isHelper) {
        title = `Unassigned Signal #${chat._id.slice(-6).toUpperCase()}`;
    }

    const lastMessage = chat.messages?.[chat.messages.length - 1];
    const time = lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    // Status indicators
    const isOnline = true; // Placeholder
    const hasUnread = false; // Placeholder

    return (
        <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "w-full h-[72px] px-4 flex items-center gap-4 border-b border-gray-50 transition-all group relative overflow-hidden",
                active ? "bg-sapphire/5" : "bg-white hover:bg-gray-50/80"
            )}
        >
            {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-sapphire shadow-glow" />}

            <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white shadow-sm ring-2 ring-transparent group-hover:ring-sapphire/10 transition-all">
                    <img src={chat.initialPhoto} alt="Signal" className="w-full h-full object-cover" />
                </div>
                {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5 text-left">
                <div className="w-full flex justify-between items-baseline gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className={cn("text-[15px] font-bold truncate tracking-tight transition-colors", active ? "text-sapphire" : "text-primary-text")}>
                            {title}
                        </h4>
                        {otherParty?.verificationStatus?.idVerified && (
                            <CheckCircle2 size={12} className="text-emerald-500 fill-emerald-50 shrink-0" />
                        )}
                    </div>
                    <span className="text-[11px] font-bold text-secondary-text/40 whitespace-nowrap uppercase tracking-tighter tabular-nums">
                        {time || 'Just now'}
                    </span>
                </div>
                <div className="w-full flex justify-between items-center gap-2">
                    <p className={cn(
                        "text-[13px] truncate flex-1 leading-snug",
                        hasUnread ? "font-bold text-primary-text" : "font-medium text-secondary-text/60"
                    )}>
                        {lastMessage?.text || "Started a new impact signal protocol..."}
                    </p>
                    <div className="shrink-0 flex items-center gap-1.5">
                        {chat.status === 'help_completed' && (
                            <Zap size={14} className="text-amber-500 fill-amber-500" />
                        )}
                        {hasUnread && (
                            <div className="w-5 h-5 rounded-full bg-sapphire text-white text-[10px] font-black flex items-center justify-center shadow-glow">
                                2
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.button>
    );
};
