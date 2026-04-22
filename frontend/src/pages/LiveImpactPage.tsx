import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    PlusCircle,
    X,
    QrCode,
    Smartphone,
    Search,
    Heart,
    Star,
    Zap,
    MessageCircle,
    ShieldAlert,
    SplitSquareVertical,
    Target,
    IndianRupee,
    MapPin,
    AlertCircle,
    Shield,
    CheckCircle2,
    Clock,
    Eye,
    Scan,
    Fingerprint,
    Lock
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from '../utils/cn';

// Design System Components
import { Button } from '../components/design-system/Button';
import { Card } from '../components/design-system/Card';
import { Input } from '../components/design-system/Input';
import { Badge } from '../components/design-system/Badge';

// Chat Specific Components
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ConversationList } from '../components/chat/ConversationList';
import { ChatWindow } from '../components/chat/ChatWindow';
import { ChatDetails } from '../components/chat/ChatDetails';
import { useNotifications } from '../context/NotificationContext';

// ── Deepfake Detection Animation Component ──
const DeepfakeAnalysis: React.FC<{
    imageUrl: string;
    onComplete: (passed: boolean) => void;
    onCancel: () => void;
}> = ({ imageUrl, onComplete, onCancel }) => {
    const [stage, setStage] = useState(0);
    const [subProgress, setSubProgress] = useState(0);
    const [result, setResult] = useState<'analyzing' | 'passed' | 'failed'>('analyzing');

    const stages = [
        { label: 'Initializing AI Scanner...', icon: <Scan size={16} />, color: 'text-blue-500' },
        { label: 'Analyzing pixel patterns...', icon: <Eye size={16} />, color: 'text-purple-500' },
        { label: 'Detecting GAN artifacts...', icon: <Fingerprint size={16} />, color: 'text-amber-500' },
        { label: 'Checking facial consistency...', icon: <Shield size={16} />, color: 'text-cyan-500' },
        { label: 'Verifying metadata integrity...', icon: <Lock size={16} />, color: 'text-emerald-500' },
        { label: 'Final authenticity verdict...', icon: <CheckCircle2 size={16} />, color: 'text-green-500' },
    ];

    useEffect(() => {
        const totalStages = stages.length;
        let currentStage = 0;

        const interval = setInterval(() => {
            setSubProgress(prev => {
                if (prev >= 100) {
                    currentStage++;
                    if (currentStage >= totalStages) {
                        clearInterval(interval);
                        setResult('passed');
                        setTimeout(() => onComplete(true), 1200);
                        return 100;
                    }
                    setStage(currentStage);
                    return 0;
                }
                return prev + Math.random() * 15 + 5;
            });
        }, 200);

        return () => clearInterval(interval);
    }, []);

    const overallProgress = Math.min(100, ((stage * 100 + subProgress) / (stages.length * 100)) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
        >
            <motion.div
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                initial={{ y: 30 }}
                animate={{ y: 0 }}
            >
                {/* Header with image preview */}
                <div className="relative h-40 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
                    <img src={imageUrl} className="w-full h-full object-cover opacity-30" alt="Analyzing" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {/* Scanning animation overlay */}
                        <motion.div
                            className="absolute inset-0 border-t-2 border-cyan-400/60"
                            animate={{ y: [0, 160, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                        <div className="relative">
                            <motion.div
                                className="w-16 h-16 rounded-full border-3 border-cyan-400/30 flex items-center justify-center"
                                animate={{ scale: [1, 1.15, 1], borderColor: ['rgba(34,211,238,0.3)', 'rgba(34,211,238,0.8)', 'rgba(34,211,238,0.3)'] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <Shield size={28} className="text-cyan-400" />
                            </motion.div>
                        </div>
                        <p className="text-white/80 text-xs font-bold mt-3 uppercase tracking-[0.2em]">
                            AI Deepfake Detection
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* Overall progress */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Analysis Progress</span>
                            <span className="text-sm font-black text-gray-700">{Math.round(overallProgress)}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"
                                animate={{ width: `${overallProgress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>

                    {/* Stage list */}
                    <div className="space-y-2">
                        {stages.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: i <= stage ? 1 : 0.3, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm",
                                    i < stage ? "bg-emerald-50 text-emerald-700" :
                                    i === stage ? "bg-blue-50 text-blue-700" :
                                    "text-gray-300"
                                )}
                            >
                                <div className={cn("shrink-0", i < stage ? "text-emerald-500" : i === stage ? s.color : "text-gray-300")}>
                                    {i < stage ? <CheckCircle2 size={16} /> : s.icon}
                                </div>
                                <span className="text-[12px] font-semibold flex-1">{s.label}</span>
                                {i === stage && result === 'analyzing' && (
                                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                )}
                                {i < stage && <span className="text-[10px] font-bold text-emerald-500">PASS</span>}
                            </motion.div>
                        ))}
                    </div>

                    {/* Result */}
                    <AnimatePresence>
                        {result === 'passed' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center"
                            >
                                <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
                                <p className="text-sm font-black text-emerald-800">AUTHENTIC IMAGE VERIFIED</p>
                                <p className="text-[11px] text-emerald-600 mt-1">No deepfake artifacts detected. Proceeding...</p>
                            </motion.div>
                        )}
                        {result === 'failed' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"
                            >
                                <ShieldAlert size={28} className="text-red-500 mx-auto mb-2" />
                                <p className="text-sm font-black text-red-800">AI-GENERATED IMAGE DETECTED</p>
                                <p className="text-[11px] text-red-600 mt-1">This image appears to be artificially generated.</p>
                                <Button onClick={onCancel} variant="secondary" size="sm" className="mt-3">
                                    Go Back & Retake
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};

const LiveImpactPage = () => {
    const { user, token, isHelper, refreshUser } = useAuth();
    const { showToast } = useNotifications();
    const [chats, setChats] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [showPostNeedModal, setShowPostNeedModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [initialPhotoUrl, setInitialPhotoUrl] = useState('');
    const [helperPaymentInfo, setHelperPaymentInfo] = useState({ mobile: '', qrUrl: '' });
    const [searchParams, setSearchParams] = useSearchParams();
    const targetedChatId = searchParams.get('chatId');

    // Split mode state
    const [splitMode, setSplitMode] = useState(false);
    const [targetAmount, setTargetAmount] = useState<number>(1000);

    // Camera/Photo metadata state
    const [photoMetadata, setPhotoMetadata] = useState<any>(null);
    const [cameraMode, setCameraMode] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [capturedPreview, setCapturedPreview] = useState<string>('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Deepfake analysis state
    const [showDeepfakeAnalysis, setShowDeepfakeAnalysis] = useState(false);
    const [deepfakePassed, setDeepfakePassed] = useState(false);
    const [pendingPhotoUrl, setPendingPhotoUrl] = useState('');

    const socketRef = useRef<Socket | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const qrInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (token) {
            socketRef.current = io('http://localhost:5000', { auth: { token } });

            socketRef.current.on('impact:new-need', (newChat) => {
                setChats(prev => [newChat, ...prev]);
            });

            socketRef.current.on('impact:amount-received', (updatedChat) => {
                setChats(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
                setActiveChat((prev: any) => (prev?._id === updatedChat._id ? updatedChat : prev));
            });

            socketRef.current.on('impact:completed', (updatedChat) => {
                setChats(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
                setActiveChat((prev: any) => (prev?._id === updatedChat._id ? updatedChat : prev));
            });

            socketRef.current.on('impact:new-message', (data) => {
                setActiveChat((prev: any) => {
                    if (prev && prev._id === data.chatId) {
                        return { ...prev, messages: [...(prev.messages || []), data.message] };
                    }
                    return prev;
                });
                setChats(prev => prev.map(c => {
                    if (c._id === data.chatId) {
                        return { ...c, messages: [...(c.messages || []), data.message] };
                    }
                    return c;
                }));
            });

            fetchChats();
        }
        return () => { socketRef.current?.disconnect(); };
    }, [token]);

    useEffect(() => {
        if (chats.length > 0 && targetedChatId && !activeChat) {
            const target = chats.find(c => c._id === targetedChatId);
            if (target) {
                setActiveChat(target);
                setSearchParams({});
            }
        }
    }, [chats, targetedChatId, activeChat, setSearchParams]);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const sortedChats = [...chats].sort((a, b) => {
        const timeA = new Date(a.messages?.[a.messages.length - 1]?.createdAt || a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.messages?.[b.messages.length - 1]?.createdAt || b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
    });

    const fetchChats = async () => {
        try {
            const res = await api.get('/impact-chat/active');
            setChats(res.data.data.chats);
        } catch (err) { console.error('Fetch chats failed', err); }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !activeChat?._id) return;
        try {
            await api.post(`/impact-chat/${activeChat._id}/message`, { text });
            const msg = {
                senderId: user?._id || user?.id,
                text,
                createdAt: new Date().toISOString()
            };
            setActiveChat((prev: any) => ({ ...prev, messages: [...(prev.messages || []), msg] }));
            setChats(prev => prev.map(c => c._id === activeChat._id ? { ...c, messages: [...(c.messages || []), msg] } : c));
        } catch (err) { console.error(err); }
    };

    const handleSendAmount = async (amount: number, donationType: 'ESCROW' | 'DIRECT' = 'ESCROW') => {
        if (!activeChat?._id) return;
        try {
            const res = await api.post(`/impact-chat/${activeChat._id}/send-amount`, { amount, donationType });
            const updatedChat = res.data.data.chat;
            setActiveChat(updatedChat);
            setChats(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
            showToast(
                donationType === 'DIRECT' 
                    ? `Authorization Successful: ₹${amount} transferred directly.`
                    : `Sincerity Signal Authorized: ₹${amount} locked in escrow.`, 
                'success'
            );
        } catch (err: any) { showToast(err.response?.data?.message || 'Transaction failed', 'error'); }
    };

    const handleCompleteImpact = async (finalPhoto: string) => {
        if (!activeChat?._id) return;
        try {
            const res = await api.post(`/impact-chat/${activeChat._id}/complete`, { finalPhoto });
            const updatedChat = res.data.data.chat;
            setActiveChat(updatedChat);
            setChats(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
            showToast('Impact Signal Transmission Successful. AI Verification Protocol Initiated.', 'success');
        } catch (err: any) { showToast(err.response?.data?.message || 'Completion failed', 'error'); }
    };

    // ── Camera Functions ──
    const startCamera = async () => {
        try {
            setCameraMode(true);
            setCameraReady(false);
            setCapturedPreview('');
            
            // Small delay to let the video element render
            await new Promise(r => setTimeout(r, 100));

            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: { ideal: 'environment' }, 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 } 
                } 
            });
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().then(() => {
                        setCameraReady(true);
                    }).catch(console.error);
                };
            }
        } catch (err) {
            console.error('Camera error:', err);
            showToast('Camera access denied. Please enable camera permissions in browser settings.', 'error');
            setCameraMode(false);
        }
    };

    const capturePhoto = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const captureTime = new Date();
        const systemTime = new Date();

        // Validate capture time vs system time (must be within 2 minutes)
        const timeDiff = Math.abs(captureTime.getTime() - systemTime.getTime());
        if (timeDiff > 2 * 60 * 1000) {
            showToast('System time mismatch detected. Please sync your system clock.', 'error');
            return;
        }

        // Get geolocation (MANDATORY)
        const position = await new Promise<GeolocationPosition | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
                enableHighAccuracy: true, timeout: 15000
            });
        });

        if (!position) {
            showToast('⚠️ Location access REQUIRED. Enable location and retry.', 'error');
            return;
        }

        const metadata = {
            hasExifData: true,
            cameraModel: 'WebCamera_Live',
            timestamp: captureTime.toISOString(),
            systemTime: systemTime.toISOString(),
            captureTime: captureTime.toISOString(),
            width: canvas.width,
            height: canvas.height,
            gpsLatitude: position.coords.latitude,
            gpsLongitude: position.coords.longitude,
            gpsAccuracy: position.coords.accuracy,
            isLiveCapture: true,
        };

        setPhotoMetadata(metadata);

        // Show preview
        const previewUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPreview(previewUrl);

        // Upload
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            setUploading(true);
            const formData = new FormData();
            formData.append('image', blob, `capture_${Date.now()}.jpg`);
            try {
                const uploadRes = await api.post('/upload/image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                const uploadedUrl = uploadRes.data.data.url;
                
                // Stop camera after successful capture
                stopCamera();

                // Trigger deepfake analysis
                setPendingPhotoUrl(uploadedUrl);
                setShowDeepfakeAnalysis(true);
            } catch (err: any) {
                showToast(err.response?.data?.message || 'Upload failed', 'error');
            } finally {
                setUploading(false);
            }
        }, 'image/jpeg', 0.9);
    }, []);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraMode(false);
        setCameraReady(false);
    };

    // Deepfake analysis completion handler
    const handleDeepfakeComplete = (passed: boolean) => {
        setShowDeepfakeAnalysis(false);
        if (passed) {
            setInitialPhotoUrl(pendingPhotoUrl);
            setDeepfakePassed(true);
            showToast('✅ AI Verification: Image is authentic! Proceeding...', 'success');
        } else {
            setPendingPhotoUrl('');
            setPhotoMetadata(null);
            setCapturedPreview('');
            showToast('❌ AI-generated image detected! Please capture a real photo.', 'error');
        }
    };

    const handleDeepfakeCancel = () => {
        setShowDeepfakeAnalysis(false);
        setPendingPhotoUrl('');
        setPhotoMetadata(null);
        setCapturedPreview('');
        setInitialPhotoUrl('');
        setDeepfakePassed(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'need' | 'qr') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'need') {
            // MANDATORY: Get system time + geolocation and validate
            const systemTime = new Date();
            const position = await new Promise<GeolocationPosition | null>((resolve) => {
                navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
                    enableHighAccuracy: true, timeout: 15000
                });
            });

            if (!position) {
                showToast('⚠️ Location is MANDATORY. Enable GPS and retry.', 'error');
                if (e.target) e.target.value = '';
                return;
            }

            // Read image and check file timestamp vs system time
            const fileLastModified = new Date(file.lastModified);
            const timeDiff = Math.abs(systemTime.getTime() - fileLastModified.getTime());
            
            if (timeDiff > 2 * 60 * 1000) {
                showToast('⚠️ Photo timestamp too old! Photo must be taken within 2 minutes of upload. Use "Take Photo" instead.', 'error');
                if (e.target) e.target.value = '';
                return;
            }

            const metadata = {
                hasExifData: true,
                timestamp: fileLastModified.toISOString(),
                systemTime: systemTime.toISOString(),
                captureTime: fileLastModified.toISOString(),
                width: 0,
                height: 0,
                fileSize: file.size,
                format: file.type.split('/')[1],
                gpsLatitude: position.coords.latitude,
                gpsLongitude: position.coords.longitude,
                gpsAccuracy: position.coords.accuracy,
                isLiveCapture: false,
            };

            // Read image dimensions
            const img = new Image();
            img.onload = () => {
                metadata.width = img.width;
                metadata.height = img.height;
            };
            img.src = URL.createObjectURL(file);

            setPhotoMetadata(metadata);
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const uploadRes = await api.post('/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const url = uploadRes.data.data.url;

            if (type === 'qr') {
                setHelperPaymentInfo(prev => ({ ...prev, qrUrl: url }));
            } else if (type === 'need') {
                // Trigger deepfake analysis for uploaded photos too
                setPendingPhotoUrl(url);
                setShowDeepfakeAnalysis(true);
            }
        } catch (err: any) { showToast(err.response?.data?.message || 'Upload failed', 'error'); }
        finally { setUploading(false); if (e.target) e.target.value = ''; }
    };

    const handlePostNeed = async () => {
        if (!initialPhotoUrl) return alert('Photo is mandatory for signal deployment');
        if (!deepfakePassed) {
            showToast('Photo must pass AI verification before proceeding.', 'error');
            return;
        }
        if (!photoMetadata?.gpsLatitude) {
            showToast('Geotagged photo is required. Use "Take Photo" for live capture.', 'error');
            return;
        }

        setUploading(true);
        try {
            const position = await new Promise<GeolocationPosition | null>((resolve) => {
                navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
                    enableHighAccuracy: true, timeout: 10000
                });
            });

            const res = await api.post('/impact-chat/post-need', {
                initialPhoto: initialPhotoUrl,
                paymentInfo: helperPaymentInfo,
                location: { 
                    coordinates: position 
                        ? [position.coords.longitude, position.coords.latitude] 
                        : [0, 0] 
                },
                splitMode,
                targetAmount: splitMode ? targetAmount : undefined,
                photoMetadata,
            });
            setShowPostNeedModal(false);
            setInitialPhotoUrl('');
            setHelperPaymentInfo({ mobile: '', qrUrl: '' });
            setSplitMode(false);
            setTargetAmount(1000);
            setPhotoMetadata(null);
            setDeepfakePassed(false);
            setCapturedPreview('');
            fetchChats();
            if (res.data.data.chat) setActiveChat(res.data.data.chat);
        } catch (err: any) { showToast(err.response?.data?.message || 'Deployment failed', 'error'); }
        finally { setUploading(false); }
    };

    const handleDownloadCertificate = async () => {
        if (!activeChat) return;
        const certDiv = document.createElement('div');
        certDiv.style.position = 'fixed';
        certDiv.style.top = '-10000px';
        certDiv.style.width = '1123px';
        certDiv.style.height = '794px';
        certDiv.style.backgroundColor = 'white';
        certDiv.innerHTML = `
            <div style="width: 100%; height: 100%; border: 15px solid #0F172A; box-sizing: border-box; padding: 40px; font-family: 'Playfair Display', serif; position: relative; background: #fff;">
                <div style="border: 2px solid #E4E4E7; width: 100%; height: 100%; box-sizing: border-box; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                    <h3 style="color: #3B82F6; letter-spacing: 5px; text-transform: uppercase; margin-bottom: 20px; font-weight: 800; font-family: 'Inter', sans-serif;">Official Impact Honor</h3>
                    <h1 style="font-size: 54px; color: #18181B; margin-bottom: 10px; text-transform: uppercase; font-weight: 700;">The Sincerity Testament</h1>
                    <div style="width: 150px; height: 1px; background: #E4E4E7; margin-bottom: 30px;"></div>
                    <p style="font-size: 18px; font-style: italic; color: #52525B; margin-bottom: 15px;">This is to certify that</p>
                    <h2 style="font-size: 42px; color: #18181B; margin-bottom: 30px; text-transform: uppercase; font-weight: 900;">${user?.profile?.fullName || 'Citizen Miner'}</h2>
                </div>
            </div>
        `;
        document.body.appendChild(certDiv);
        try {
            const canvas = await html2canvas(certDiv, { scale: 3, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
            pdf.save(`Humanexa_Impact_Artifact_${activeChat._id.substring(0, 8)}.pdf`);
        } catch (error) { console.error(error); } finally { document.body.removeChild(certDiv); }
    };

    const resetPhotoState = () => {
        setInitialPhotoUrl('');
        setPhotoMetadata(null);
        setDeepfakePassed(false);
        setCapturedPreview('');
        setPendingPhotoUrl('');
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white selection:bg-sapphire/10 font-sans">
            {/* PANEL 1: NAV SIDEBAR */}
            <ChatSidebar />

            {/* PANEL 2: CONVERSATION LIST */}
            <ConversationList
                chats={sortedChats}
                activeChat={activeChat}
                onSelectChat={setActiveChat}
                user={user}
                onNewChat={() => setShowPostNeedModal(true)}
            />

            {/* PANEL 3: ACTIVE CHAT */}
            <ChatWindow
                activeChat={activeChat}
                user={user}
                onSendMessage={handleSendMessage}
                onSendAmount={handleSendAmount}
                onCompleteImpact={handleCompleteImpact}
                onToggleDetails={() => setShowDetails(!showDetails)}
                onBack={() => setActiveChat(null)}
            />

            {/* PANEL 4: CHAT DETAILS */}
            <ChatDetails
                chat={activeChat}
                isOpen={showDetails}
                onClose={() => setShowDetails(false)}
            />

            {/* ── POST NEED MODAL ── */}
            <AnimatePresence>
                {showPostNeedModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
                        >
                            <Card variant="default" className="w-full overflow-hidden shadow-2xl relative border-white">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { setShowPostNeedModal(false); stopCamera(); resetPhotoState(); }}
                                    className="absolute top-4 right-4 z-10 bg-white/50 hover:bg-white text-primary-text rounded-full"
                                >
                                    <X size={20} />
                                </Button>
                                <div className="p-6">
                                    <div className="text-center mb-6">
                                        <Badge variant="sapphire" className="mb-3">Protocol Initiation</Badge>
                                        <h3 className="text-xl font-serif font-black text-primary-text tracking-tight uppercase">Deploy Sincerity Signal</h3>
                                        <p className="text-xs text-secondary-text mt-1 font-medium">Establish a verified anchor for community assistance.</p>
                                    </div>

                                    <div className="space-y-5">
                                        {/* Split Mode Toggle */}
                                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <SplitSquareVertical size={16} className="text-purple-600" />
                                                    <span className="text-xs font-black uppercase tracking-widest text-purple-700">Split Mode</span>
                                                </div>
                                                <button
                                                    onClick={() => setSplitMode(!splitMode)}
                                                    className={cn(
                                                        "w-11 h-6 rounded-full transition-all duration-300 relative",
                                                        splitMode ? "bg-purple-600" : "bg-gray-200"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-all duration-300",
                                                        splitMode ? "left-[22px]" : "left-0.5"
                                                    )} />
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-purple-600/70 font-medium">
                                                Enable to let multiple donors contribute towards a target amount.
                                            </p>

                                            {splitMode && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    className="mt-3 pt-3 border-t border-purple-200"
                                                >
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-purple-600/60 mb-2 block">Target Amount (₹)</label>
                                                    <div className="relative">
                                                        <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                                                        <input
                                                            type="number"
                                                            value={targetAmount}
                                                            onChange={e => setTargetAmount(Number(e.target.value))}
                                                            className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-purple-200 text-base font-black text-purple-700 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none"
                                                            placeholder="1000"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 mt-2">
                                                        {[500, 1000, 2500, 5000].map(amt => (
                                                            <button
                                                                key={amt}
                                                                onClick={() => setTargetAmount(amt)}
                                                                className={cn(
                                                                    "flex-1 h-7 rounded-lg text-[10px] font-bold transition-all",
                                                                    targetAmount === amt
                                                                        ? "bg-purple-600 text-white"
                                                                        : "bg-white border border-purple-200 text-purple-600 hover:bg-purple-50"
                                                                )}
                                                            >
                                                                ₹{amt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Photo Capture Section */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-secondary-text/60">Visual Proof Collection</label>
                                                {deepfakePassed && <Badge variant="success" size="sm">✅ AI Verified</Badge>}
                                            </div>

                                            {cameraMode ? (
                                                <div className="relative rounded-2xl overflow-hidden border-2 border-sapphire/30 bg-black" style={{ minHeight: 220 }}>
                                                    {capturedPreview ? (
                                                        <img src={capturedPreview} className="w-full h-56 object-cover" alt="Captured" />
                                                    ) : (
                                                        <>
                                                            <video 
                                                                ref={videoRef} 
                                                                className="w-full h-56 object-cover" 
                                                                autoPlay 
                                                                muted 
                                                                playsInline
                                                            />
                                                            {!cameraReady && (
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                                                                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-3" />
                                                                    <p className="text-white/70 text-xs font-medium">Starting camera...</p>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    
                                                    {/* Camera controls */}
                                                    {cameraReady && !capturedPreview && (
                                                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                                                            <button
                                                                onClick={capturePhoto}
                                                                disabled={uploading}
                                                                className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform border-4 border-sapphire active:scale-95"
                                                            >
                                                                {uploading ? (
                                                                    <div className="w-6 h-6 border-2 border-sapphire/30 border-t-sapphire rounded-full animate-spin" />
                                                                ) : (
                                                                    <Camera size={22} className="text-sapphire" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => { stopCamera(); setCapturedPreview(''); }}
                                                                className="w-10 h-10 bg-red-500 rounded-full shadow-xl flex items-center justify-center text-white hover:bg-red-600 active:scale-95"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Geotag + Time overlay */}
                                                    <div className="absolute top-2 left-2 flex gap-1.5">
                                                        <div className="bg-black/60 rounded-full px-2 py-0.5 flex items-center gap-1">
                                                            <MapPin size={9} className="text-emerald-400" />
                                                            <span className="text-[8px] text-white font-bold">GPS</span>
                                                        </div>
                                                        <div className="bg-black/60 rounded-full px-2 py-0.5 flex items-center gap-1">
                                                            <Clock size={9} className="text-cyan-400" />
                                                            <span className="text-[8px] text-white font-bold">LIVE</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : initialPhotoUrl && deepfakePassed ? (
                                                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-300 shadow-xl h-44 group">
                                                    <img src={initialPhotoUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Evidence" />
                                                    <div className="absolute bottom-2 left-2 flex gap-1.5">
                                                        {photoMetadata?.gpsLatitude && (
                                                            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1.5">
                                                                <MapPin size={10} className="text-emerald-400" />
                                                                <span className="text-[9px] font-bold text-white">Geotagged</span>
                                                            </div>
                                                        )}
                                                        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1.5">
                                                            <Shield size={10} className="text-cyan-400" />
                                                            <span className="text-[9px] font-bold text-white">AI Verified</span>
                                                        </div>
                                                        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1.5">
                                                            <Clock size={10} className="text-amber-400" />
                                                            <span className="text-[9px] font-bold text-white">Time Valid</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={resetPhotoState} 
                                                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-all shadow-lg active:scale-90"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-3">
                                                    <div
                                                        onClick={startCamera}
                                                        className="flex-1 h-36 bg-sapphire/5 border-2 border-dashed border-sapphire/20 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-sapphire/50 cursor-pointer transition-all group"
                                                    >
                                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-soft-md text-sapphire group-hover:scale-110 transition-all">
                                                            <Camera size={20} strokeWidth={1.5} />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-sapphire">Take Photo</span>
                                                        <span className="text-[8px] text-secondary-text/50">Live camera + geotag + time</span>
                                                    </div>
                                                    <div
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex-1 h-36 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-gray-300 cursor-pointer transition-all group"
                                                    >
                                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-soft-md text-gray-400 group-hover:text-gray-600 group-hover:scale-110 transition-all">
                                                            <PlusCircle size={20} strokeWidth={1.5} />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-600">Upload Photo</span>
                                                        <span className="text-[8px] text-secondary-text/50">Must be &lt; 2 min old + GPS</span>
                                                    </div>
                                                </div>
                                            )}
                                            <canvas ref={canvasRef} className="hidden" />
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'need')} />
                                        </div>

                                        {/* Validation status badges */}
                                        {photoMetadata && (
                                            <div className="flex flex-wrap gap-2">
                                                <div className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold",
                                                    photoMetadata.gpsLatitude ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                                )}>
                                                    <MapPin size={10} />
                                                    {photoMetadata.gpsLatitude ? `GPS: ${photoMetadata.gpsLatitude.toFixed(4)}, ${photoMetadata.gpsLongitude.toFixed(4)}` : 'No GPS'}
                                                </div>
                                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                                                    <Clock size={10} />
                                                    {new Date(photoMetadata.timestamp).toLocaleTimeString()}
                                                </div>
                                                {deepfakePassed && (
                                                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                                        <Shield size={10} />
                                                        AI Authentic
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Payment Info */}
                                        <div className="space-y-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-secondary-text/60">Payment Gateway Bridge</span>
                                            <Input
                                                placeholder="Enter Registered UPI Mobile / ID"
                                                value={helperPaymentInfo.mobile}
                                                onChange={e => setHelperPaymentInfo(prev => ({ ...prev, mobile: e.target.value }))}
                                                leftIcon={<Smartphone size={16} className="text-sapphire" />}
                                            />
                                            <Button
                                                onClick={() => qrInputRef.current?.click()}
                                                variant={helperPaymentInfo.qrUrl ? 'primary' : 'secondary'}
                                                className={cn(
                                                    "w-full h-10 justify-center text-xs font-bold uppercase tracking-widest transition-all",
                                                    helperPaymentInfo.qrUrl && "bg-gradient-to-r from-emerald-500 to-emerald-700 shadow-glow-success border-none"
                                                )}
                                                leftIcon={<QrCode size={16} />}
                                            >
                                                {helperPaymentInfo.qrUrl ? 'Merchant QR Secured' : 'Upload Merchant QR'}
                                            </Button>
                                            <input type="file" ref={qrInputRef} className="hidden" onChange={e => handleFileUpload(e, 'qr')} />
                                        </div>

                                        <div className="pt-2 border-t border-gray-100">
                                            <Button
                                                onClick={handlePostNeed}
                                                disabled={!initialPhotoUrl || uploading || !deepfakePassed}
                                                isLoading={uploading}
                                                className="w-full h-12 text-sm shadow-xl hover:shadow-glow"
                                                size="lg"
                                            >
                                                {uploading ? 'Finalizing Protocol...' : splitMode ? `Deploy Split Signal (₹${targetAmount})` : 'Confirm Sincerity Deployment'}
                                            </Button>
                                            {initialPhotoUrl && !deepfakePassed && (
                                                <p className="text-[10px] text-amber-600 text-center mt-2 font-bold">
                                                    ⏳ Waiting for AI verification to complete...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── DEEPFAKE ANALYSIS OVERLAY ── */}
            <AnimatePresence>
                {showDeepfakeAnalysis && pendingPhotoUrl && (
                    <DeepfakeAnalysis
                        imageUrl={pendingPhotoUrl}
                        onComplete={handleDeepfakeComplete}
                        onCancel={handleDeepfakeCancel}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default LiveImpactPage;
