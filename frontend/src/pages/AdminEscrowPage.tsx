import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2, XCircle, Eye, Clock, IndianRupee, Camera, ArrowLeft, Loader2, AlertTriangle, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const appleEase = [0.25, 0.1, 0.25, 1] as const;

const AdminEscrowPage: React.FC = () => {
    const navigate = useNavigate();
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<'pending' | 'all'>('pending');

    useEffect(() => {
        fetchEscrowChats();
    }, []);

    const fetchEscrowChats = async () => {
        setLoading(true);
        try {
            const res = await api.get('/impact-chat/active');
            if (res.data?.data?.chats) {
                setChats(res.data.data.chats);
            }
        } catch (err) {
            console.error('Failed to fetch chats');
        } finally {
            setLoading(false);
        }
    };

    const handleRelease = async (chatId: string) => {
        setActionLoading(chatId);
        try {
            await api.post(`/impact-chat/${chatId}/complete`, { adminApproved: true });
            setChats(prev => prev.map(c => c._id === chatId ? { ...c, status: 'help_completed' } : c));
            setSelectedChat(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to release funds');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (chatId: string) => {
        setActionLoading(chatId);
        try {
            // Trigger refund
            await api.post(`/impact-chat/${chatId}/complete`, { adminRejected: true, refund: true });
            setChats(prev => prev.map(c => c._id === chatId ? { ...c, status: 'refunded' } : c));
            setSelectedChat(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to refund');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredChats = filter === 'pending'
        ? chats.filter(c => (c.status === 'proof_submitted' || (c.status === 'amount_sent' && c.finalPhoto)))
        : chats;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'need_posted': return 'bg-amber-500/10 text-amber-500';
            case 'amount_sent': return 'bg-blue-500/10 text-blue-500';
            case 'proof_submitted': return 'bg-purple-500/10 text-purple-500';
            case 'help_completed': return 'bg-emerald-500/10 text-emerald-500';
            case 'refunded': return 'bg-red-500/10 text-red-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <ArrowLeft size={18} className="text-white/40" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                                <Shield size={18} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-[18px] font-bold tracking-tight">Escrow Management</h1>
                                <p className="text-[11px] text-white/30">Review proof images & release funds</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${filter === 'pending' ? 'bg-red-500/20 text-red-400' : 'text-white/30 hover:text-white/50'}`}
                        >
                            Pending Review ({chats.filter(c => c.status === 'proof_submitted' || (c.status === 'amount_sent' && c.finalPhoto)).length})
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${filter === 'all' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}
                        >
                            All ({chats.length})
                        </button>
                        <button onClick={fetchEscrowChats} className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors">
                            <Loader2 size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="w-10 h-10 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="text-center py-32">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={28} className="text-emerald-500/40" />
                        </div>
                        <h3 className="text-[18px] font-semibold text-white/60">All Clear</h3>
                        <p className="text-[13px] text-white/25 mt-1">No pending proof reviews</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredChats.map((chat, i) => (
                            <motion.div
                                key={chat._id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04, ease: appleEase }}
                                onClick={() => setSelectedChat(chat)}
                                className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 hover:bg-white/[0.05] transition-all cursor-pointer group"
                            >
                                {/* Images */}
                                <div className="grid grid-cols-2 h-40">
                                    <div className="relative overflow-hidden">
                                        {chat.initialPhoto ? (
                                            <img src={chat.initialPhoto} alt="Need" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                <ImageIcon size={24} className="text-white/10" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] font-bold text-amber-400 uppercase">Need Photo</div>
                                    </div>
                                    <div className="relative overflow-hidden border-l border-white/5">
                                        {chat.finalPhoto ? (
                                            <img src={chat.finalPhoto} alt="Proof" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                <Camera size={24} className="text-white/10" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] font-bold text-emerald-400 uppercase">Proof Photo</div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <IndianRupee size={14} className="text-white/40" />
                                            <span className="text-[16px] font-bold">₹{chat.amount?.toLocaleString() || 0}</span>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${getStatusColor(chat.status)}`}>
                                            {chat.status?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-white/30">
                                        <span className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(chat.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </span>
                                        <span className={`font-bold ${chat.donationType === 'ESCROW' ? 'text-emerald-400/60' : 'text-amber-400/60'}`}>
                                            {chat.donationType || 'ESCROW'}
                                        </span>
                                    </div>

                                    {(chat.status === 'proof_submitted' || (chat.status === 'amount_sent' && chat.finalPhoto)) && (
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={e => { e.stopPropagation(); handleRelease(chat._id); }}
                                                disabled={actionLoading === chat._id}
                                                className="flex-1 h-9 bg-emerald-500/10 text-emerald-400 text-[11px] font-bold rounded-lg hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                {actionLoading === chat._id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                                Release ₹{chat.amount}
                                            </button>
                                            <button
                                                onClick={e => { e.stopPropagation(); handleReject(chat._id); }}
                                                disabled={actionLoading === chat._id}
                                                className="h-9 px-4 bg-red-500/10 text-red-400 text-[11px] font-bold rounded-lg hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                <XCircle size={12} />
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedChat && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl" onClick={() => setSelectedChat(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-[16px] font-bold">Proof Verification</h3>
                                <button onClick={() => setSelectedChat(null)} className="text-white/30 hover:text-white/60 transition-colors">✕</button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Side by side images */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Original Need Photo</p>
                                        <div className="rounded-xl overflow-hidden border border-white/5 aspect-square">
                                            {selectedChat.initialPhoto ? (
                                                <img src={selectedChat.initialPhoto} alt="Need" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20">No photo</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Helper Proof Photo</p>
                                        <div className="rounded-xl overflow-hidden border border-white/5 aspect-square">
                                            {selectedChat.finalPhoto ? (
                                                <img src={selectedChat.finalPhoto} alt="Proof" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20">No proof yet</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-4 text-[12px]">
                                    <div className="bg-white/[0.03] rounded-xl p-4">
                                        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Amount</p>
                                        <p className="text-[20px] font-bold">₹{selectedChat.amount?.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-xl p-4">
                                        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Type</p>
                                        <p className="text-[16px] font-bold">{selectedChat.donationType || 'ESCROW'}</p>
                                    </div>
                                </div>

                                {/* AI Verification Status */}
                                {selectedChat.aiVerification && (
                                    <div className="bg-white/[0.03] rounded-xl p-4">
                                        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2">AI Verification</p>
                                        <div className="flex items-center gap-2">
                                            {selectedChat.aiVerification.status === 'passed' ? (
                                                <CheckCircle2 size={16} className="text-emerald-400" />
                                            ) : (
                                                <AlertTriangle size={16} className="text-amber-400" />
                                            )}
                                            <span className="font-bold capitalize">{selectedChat.aiVerification.status}</span>
                                            <span className="text-white/30 ml-auto">{Math.round((selectedChat.aiVerification.confidence || 0) * 100)}% confidence</span>
                                        </div>
                                    </div>
                                )}

                                {/* Action buttons */}
                                {(selectedChat.status === 'proof_submitted' || (selectedChat.status === 'amount_sent' && selectedChat.finalPhoto)) && (
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => handleRelease(selectedChat._id)}
                                            disabled={actionLoading === selectedChat._id}
                                            className="flex-1 h-12 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {actionLoading === selectedChat._id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                            Approve & Release ₹{selectedChat.amount}
                                        </button>
                                        <button
                                            onClick={() => handleReject(selectedChat._id)}
                                            disabled={actionLoading === selectedChat._id}
                                            className="h-12 px-6 bg-red-500/10 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <XCircle size={16} />
                                            Reject & Refund
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminEscrowPage;
