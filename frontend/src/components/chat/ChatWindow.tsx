import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, Search, MoreVertical, MessageSquare, ChevronLeft, Info, MapPin, Clock, Star, Navigation, Smartphone, QrCode, ExternalLink, Shield, Zap, Camera, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { MessageBubble, DateDivider, SystemMessage } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';
import { Card } from '../design-system/Card';
import { Input } from '../design-system/Input';
import api from '../../services/api';
import MockPaymentModal from '../MockPaymentModal';

interface ChatWindowProps {
    activeChat: any;
    user: any;
    onSendMessage: (text: string) => void;
    onSendAmount?: (amount: number, type: 'ESCROW' | 'DIRECT') => void;
    onCompleteImpact?: (photo: string) => void;
    onBack?: () => void;
    onToggleDetails?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    activeChat,
    user,
    onSendMessage,
    onSendAmount,
    onCompleteImpact,
    onBack,
    onToggleDetails
}) => {
    const chatEndRef = useRef<HTMLDivElement>(null);
    const proofVideoRef = useRef<HTMLVideoElement>(null);
    const proofCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isContextExpanded, setIsContextExpanded] = React.useState(true);
    const [customAmount, setCustomAmount] = React.useState<number>(500);
    const [uploadingProof, setUploadingProof] = React.useState(false);
    const [showPaymentModal, setShowPaymentModal] = React.useState(false);
    const [showProofCamera, setShowProofCamera] = React.useState(false);
    const [proofStream, setProofStream] = React.useState<MediaStream | null>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const openProofCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setProofStream(stream);
            setShowProofCamera(true);
            setTimeout(() => {
                if (proofVideoRef.current) {
                    proofVideoRef.current.srcObject = stream;
                    proofVideoRef.current.play().catch(() => {});
                }
            }, 200);
        } catch (err) {
            alert('Camera access denied. Please allow camera to submit proof.');
        }
    };

    const captureProofPhoto = async () => {
        const video = proofVideoRef.current;
        const canvas = proofCanvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);

        // Stop camera
        proofStream?.getTracks().forEach(t => t.stop());
        setProofStream(null);
        setShowProofCamera(false);

        // Convert to blob and upload
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            setUploadingProof(true);
            try {
                const formData = new FormData();
                formData.append('image', blob, `proof_${Date.now()}.jpg`);
                const res = await api.post('/upload/image', formData);
                if (res.data.data.url) {
                    onCompleteImpact?.(res.data.data.url);
                }
            } catch (err) { console.error(err); }
            finally { setUploadingProof(false); }
        }, 'image/jpeg', 0.9);
    };

    const closeProofCamera = () => {
        proofStream?.getTracks().forEach(t => t.stop());
        setProofStream(null);
        setShowProofCamera(false);
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeChat?.messages]);

    if (!activeChat) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center p-12 bg-white relative">
                <div className="absolute inset-0 bg-mesh-impact opacity-5" />
                <div className="relative mb-12">
                    <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-soft-2xl border border-gray-100 flex items-center justify-center animate-hover">
                        <MessageSquare className="text-sapphire" size={48} strokeWidth={1.5} />
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-sapphire/5 rounded-full blur-xl animate-pulse" />
                </div>
                <h3 className="text-3xl font-serif font-black text-primary-text mb-4 tracking-tight uppercase">Select a Connection</h3>
                <p className="text-secondary-text text-center max-w-sm font-medium leading-relaxed">Choose an active impact signal from the registry to begin verification protocols.</p>
            </div>
        );
    }

    const isHelper = activeChat.helperId?._id === user?._id || activeChat.helperId === user?._id;
    const otherParty = isHelper ? activeChat.donorId : activeChat.helperId;
    const title = otherParty?.profile?.fullName || `Signal #${activeChat._id.slice(-6).toUpperCase()}`;
    const roleLabel = isHelper ? "Verified Donor" : "Verified Community Helper";

    return (
        <div className="flex-1 h-full flex flex-col bg-white relative overflow-hidden">
            {/* Chat Header */}
            <div className="h-20 px-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="lg:hidden w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center text-secondary-text">
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <div className="relative">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                            <img src={activeChat.initialPhoto} className="w-full h-full object-cover" alt="Signal" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[17px] font-black text-primary-text tracking-tight uppercase flex items-center gap-1.5">
                                {title}
                                {otherParty?.verificationStatus?.idVerified && (
                                    <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-50" />
                                )}
                            </h3>
                            <Badge variant="sapphire" size="sm" className="h-4 px-1.5 py-0">Online</Badge>
                        </div>
                        <span className="text-[11px] font-black text-secondary-text/40 uppercase tracking-[0.1em]">{roleLabel}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <HeaderAction icon={<Search size={20} />} onClick={() => { }} />
                    <HeaderAction icon={<Phone size={20} />} onClick={() => { }} />
                    <HeaderAction icon={<Video size={20} />} onClick={() => { }} />
                    <div className="w-px h-6 bg-gray-100 mx-2" />
                    <HeaderAction icon={<Info size={20} />} onClick={onToggleDetails} />
                    <HeaderAction icon={<MoreVertical size={20} />} onClick={() => { }} />
                </div>
            </div>

            {/* Message Thread Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/50 relative">
                <div className="p-6 pb-32">
                    <DateDivider date="Today, February 02" />

                    {/* Request Context (Pinned Card) */}
                    <div className="mb-10 max-w-4xl mx-auto">
                        <Card variant="glass" className="p-0 border-sapphire/10 bg-white/60 overflow-visible shadow-soft-xl">
                            <div className="flex items-center justify-between p-4 border-b border-sapphire/5 bg-sapphire/5">
                                <div className="flex items-center gap-2">
                                    <span className="text-sapphire">📌</span>
                                    <h4 className="text-[11px] font-black text-sapphire uppercase tracking-widest">Active Signal Context</h4>
                                </div>
                                <button onClick={() => setIsContextExpanded(!isContextExpanded)} className="text-[10px] font-black text-sapphire/50 uppercase hover:text-sapphire transition-colors tracking-widest">
                                    {isContextExpanded ? 'Collapse Context' : 'Expand Details'}
                                </button>
                            </div>
                            <AnimatePresence>
                                {isContextExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="p-6 bg-white/40 overflow-hidden"
                                    >
                                        <div className="flex flex-col md:flex-row gap-6">
                                            <div className="w-full md:w-64 h-44 rounded-2xl overflow-hidden border-2 border-white shadow-lg shrink-0 group">
                                                <img src={activeChat.initialPhoto} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Context" />
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <h3 className="text-2xl font-serif font-black text-primary-text mb-1 tracking-tight">Community Aid Protocol</h3>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-secondary-text/60">
                                                            <MapPin size={12} className="text-sapphire" /> Privacy Protected
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-secondary-text/60">
                                                            <Clock size={12} className="text-sapphire" /> Posted 12m ago
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 py-3 border-y border-dashed border-gray-100">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-secondary-text/40 uppercase tracking-widest mb-1">Impact Target</span>
                                                        <span className="text-lg font-black text-emerald-600">₹{activeChat.amount || '0'}</span>
                                                    </div>
                                                    <div className="w-px h-10 bg-gray-100" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-secondary-text/40 uppercase tracking-widest mb-1">Status Protocol</span>
                                                        <Badge variant={activeChat.status === 'help_completed' ? 'success' : 'sapphire'} size="sm" className="w-fit">{activeChat.status.replace('_', ' ')}</Badge>
                                                    </div>
                                                </div>

                                                {/* Proof of Impact (Final Photo) Display */}
                                                {activeChat.finalPhoto && (
                                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                                        <span className="text-[10px] font-black text-secondary-text/40 uppercase tracking-widest mb-2 block">Proof of Impact Protocol</span>
                                                        <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-glow-success group">
                                                            <img src={activeChat.finalPhoto} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Final Proof" />
                                                            <div className="absolute top-4 right-4">
                                                                <Badge variant="success" size="sm" className="shadow-lg">Verified Image</Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <Button variant="primary" size="sm" className="h-8 px-3 text-[10px] shadow-md" leftIcon={<Star size={10} />}>Verify</Button>
                                                    <Button variant="secondary" size="sm" className="h-8 px-3 text-[10px]" leftIcon={<Navigation size={10} />}>Navigate</Button>
                                                </div>

                                                {/* SPLIT DONATION TRACKING */}
                                                {activeChat.splitMode && (
                                                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-700">Split Donation Tracker</span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-3 text-center">
                                                            <div className="bg-white rounded-lg p-2 border border-purple-100">
                                                                <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Target</p>
                                                                <p className="text-base font-black text-purple-700">₹{activeChat.targetAmount?.toLocaleString() || 0}</p>
                                                            </div>
                                                            <div className="bg-white rounded-lg p-2 border border-emerald-100">
                                                                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Received</p>
                                                                <p className="text-base font-black text-emerald-700">₹{activeChat.receivedAmount?.toLocaleString() || 0}</p>
                                                            </div>
                                                            <div className="bg-white rounded-lg p-2 border border-amber-100">
                                                                <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Pending</p>
                                                                <p className="text-base font-black text-amber-700">₹{Math.max(0, (activeChat.targetAmount || 0) - (activeChat.receivedAmount || 0)).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        {/* Progress bar */}
                                                        <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full transition-all duration-700"
                                                                style={{ width: `${Math.min(100, ((activeChat.receivedAmount || 0) / (activeChat.targetAmount || 1)) * 100)}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-purple-600 text-center font-bold">
                                                            {Math.round(((activeChat.receivedAmount || 0) / (activeChat.targetAmount || 1)) * 100)}% funded • {activeChat.donorContributions?.length || 0} donor(s)
                                                        </p>
                                                        {/* Donor contributions list */}
                                                        {activeChat.donorContributions?.length > 0 && (
                                                            <div className="max-h-24 overflow-y-auto space-y-1">
                                                                {activeChat.donorContributions.map((contrib: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center justify-between text-[10px] px-2 py-1 bg-white rounded-lg">
                                                                        <span className="text-secondary-text">Donor #{idx + 1}</span>
                                                                        <span className="font-bold text-purple-700">₹{contrib.amount?.toLocaleString()}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Helper Payment Info for Donor */}
                                        {!isHelper && activeChat.paymentInfo && (
                                            <div className="mt-8 pt-6 border-t border-gray-100 space-y-6">
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                                <Smartphone size={16} />
                                                            </div>
                                                            <p className="text-[11px] font-black text-secondary-text/60 uppercase tracking-widest">Digital Payment Protocol</p>
                                                        </div>
                                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                                                            <div>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">UPI / Mobile</p>
                                                                <p className="text-lg font-black text-primary-text">{activeChat.paymentInfo.mobile || "Verification Pending"}</p>
                                                            </div>
                                                            <Button variant="ghost" size="sm" className="h-8 text-[10px] text-sapphire" onClick={() => navigator.clipboard.writeText(activeChat.paymentInfo.mobile)}>Copy ID</Button>
                                                        </div>
                                                    </div>

                                                    {activeChat.paymentInfo.qrUrl && (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-sapphire/5 text-sapphire flex items-center justify-center">
                                                                    <QrCode size={16} />
                                                                </div>
                                                                <p className="text-[11px] font-black text-secondary-text/60 uppercase tracking-widest">Merchant QR Anchor</p>
                                                            </div>
                                                            <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center gap-4">
                                                                <img src={activeChat.paymentInfo.qrUrl} className="w-16 h-16 rounded-lg border border-gray-100 shadow-sm" alt="Payment QR" />
                                                                <div className="flex-1">
                                                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-tight">Verified Protocol</p>
                                                                    <p className="text-xs font-medium text-secondary-text mt-1">Scan to initiate sincerity transfer.</p>
                                                                </div>
                                                                <a href={activeChat.paymentInfo.qrUrl} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-sapphire transition-colors">
                                                                    <ExternalLink size={16} />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-3 space-y-3">
                                                    {activeChat.status === 'need_posted' ? (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-md bg-sapphire/5 text-sapphire flex items-center justify-center">
                                                                    <Zap size={12} />
                                                                </div>
                                                                <p className="text-[10px] font-black text-secondary-text/60 uppercase tracking-widest">Amount Authorization</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <div className="flex-1">
                                                                    <Input
                                                                        type="number"
                                                                        value={customAmount}
                                                                        onChange={(e) => setCustomAmount(Number(e.target.value))}
                                                                        placeholder="Amount"
                                                                        className="h-11 font-black text-base"
                                                                        leftIcon={<span className="font-black text-gray-400 text-sm">₹</span>}
                                                                    />
                                                                </div>
                                                                <Button
                                                                    onClick={() => setShowPaymentModal(true)}
                                                                    variant="primary"
                                                                    className="h-11 px-5 bg-gradient-to-r from-sapphire-start to-sapphire-end shadow-glow-sapphire text-sm"
                                                                >
                                                                    Send
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                                                {activeChat.donationType === 'DIRECT' ? 'Direct Fund Transferred' : `Escrow Locked (₹${activeChat.amount})`}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <MockPaymentModal 
                                            isOpen={showPaymentModal}
                                            onClose={() => setShowPaymentModal(false)}
                                            amount={customAmount}
                                            onSuccess={(type) => {
                                                onSendAmount?.(customAmount, type); 
                                                setShowPaymentModal(false);
                                            }}
                                        />

                                        {/* Submit Proof Section for Helper - CAMERA ONLY */}
                                        {isHelper && activeChat.status === 'amount_sent' && (
                                            <div className="mt-8 pt-6 border-t border-gray-100 space-y-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                                        <Star size={16} />
                                                    </div>
                                                    <p className="text-[11px] font-black text-secondary-text/60 uppercase tracking-widest">Final Impact Proof — Camera Only</p>
                                                </div>

                                                {showProofCamera ? (
                                                    <div className="rounded-[2rem] overflow-hidden border-2 border-sapphire/30 relative">
                                                        <video
                                                            ref={proofVideoRef}
                                                            autoPlay
                                                            playsInline
                                                            muted
                                                            className="w-full aspect-video object-cover bg-black"
                                                        />
                                                        <canvas ref={proofCanvasRef} className="hidden" />
                                                        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                                                            <button
                                                                onClick={closeProofCamera}
                                                                className="w-12 h-12 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-600 transition-all backdrop-blur-sm"
                                                            >
                                                                ✕
                                                            </button>
                                                            <button
                                                                onClick={captureProofPhoto}
                                                                className="w-16 h-16 rounded-full bg-white border-4 border-sapphire flex items-center justify-center hover:scale-105 transition-all shadow-xl"
                                                            >
                                                                <div className="w-12 h-12 rounded-full bg-sapphire" />
                                                            </button>
                                                        </div>
                                                        <div className="absolute top-3 left-3 flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">Live Camera</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-8 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-6 group hover:border-sapphire/50 transition-all cursor-pointer relative overflow-hidden"
                                                        onClick={openProofCamera}>
                                                        <div className="absolute inset-0 bg-mesh-impact opacity-5" />
                                                        <div className="w-20 h-20 bg-white rounded-3xl shadow-soft-xl flex items-center justify-center text-gray-400 group-hover:text-sapphire group-hover:scale-110 transition-all duration-500 z-10">
                                                            <Camera size={40} strokeWidth={1.5} />
                                                        </div>
                                                        <div className="text-center z-10">
                                                            <h4 className="text-lg font-black text-primary-text mb-1 uppercase tracking-tight">Open Camera to Capture Proof</h4>
                                                            <p className="text-xs font-medium text-secondary-text">Real-time camera capture only — no file uploads allowed.</p>
                                                        </div>
                                                        {uploadingProof && (
                                                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                                                                <div className="w-10 h-10 border-4 border-sapphire/20 border-t-sapphire rounded-full animate-spin" />
                                                                <p className="text-[10px] font-black text-sapphire uppercase tracking-widest">Uploading Proof...</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>
                    </div>

                    <SystemMessage icon={<Shield size={14} />}>This impact connection is protected by AES-256 verified encryption.</SystemMessage>

                    <div className="space-y-2 max-w-6xl mx-auto">
                        {activeChat.messages?.map((m: any, i: number) => {
                            const isOwn = m.senderId === (user?._id || user?.id);
                            const nextMsg = activeChat.messages[i + 1];
                            const isLastInGroup = !nextMsg || nextMsg.senderId !== m.senderId;

                            return (
                                <MessageBubble
                                    key={i}
                                    message={m}
                                    isOwn={isOwn}
                                    isLastInGroup={isLastInGroup}
                                    sender={isOwn ? user : otherParty}
                                />
                            );
                        })}
                    </div>
                </div>
                <div ref={chatEndRef} />
            </div>

            {/* Input Hub */}
            <MessageInput onSend={onSendMessage} />
        </div>
    );
};

const HeaderAction = ({ icon, onClick }: any) => (
    <button
        onClick={onClick}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-secondary-text/40 hover:text-sapphire hover:bg-sapphire/5 hover:scale-105 transition-all duration-300"
    >
        {icon}
    </button>
);
