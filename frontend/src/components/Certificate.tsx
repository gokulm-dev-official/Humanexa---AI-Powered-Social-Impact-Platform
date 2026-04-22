import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
    Award, Download, Share2, Lock, Eye, CheckCircle2,
    ShieldCheck, QrCode, X, Heart, Star, Zap, TrendingUp,
    Linkedin, Twitter, MessageCircle, Copy, Printer,
    ChevronRight, ExternalLink, MoreVertical, Mail, AlertTriangle, HelpCircle,
    Trophy, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { cn } from '../utils/cn';
import { Button } from './design-system/Button';
import { useNavigate } from 'react-router-dom';
import CertificateRender from './CertificateRender';

// Types
export type CertificateTemplate = 'journey' | 'monthly' | 'daily' | 'first_act' | 'streak' | 'annual';
export type CertificateTier = 'welcome' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface CertificateProps {
    id: string;
    template: CertificateTemplate;
    tier?: CertificateTier;
    recipientName: string;
    date: string;
    unlockedOn?: string;
    description: string;
    isLocked?: boolean;
    progress?: number;
    totalRequired?: number;
    metrics?: {
        acts?: number;
        points?: number;
        livesImpacted?: number;
        streak?: number;
        rank?: string;
        funds?: number;
    };
}

const Certificate: React.FC<CertificateProps> = (props) => {
    const {
        id, template, tier = 'silver', recipientName, date,
        unlockedOn, description, isLocked = false, progress = 0,
        totalRequired = 1, metrics = {}
    } = props;

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const certificateRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Poetic Titles mapping based on tier specifications
    const fullTitle = useMemo(() => {
        if (template === 'journey') {
            switch (tier) {
                case 'welcome': return 'The First Spark: Seedling of Hope';
                case 'bronze': return 'Rising Catalyst: The Sincerity Honor';
                case 'silver': return 'Architect of Impact: Pillar of Change';
                case 'gold': return 'Global Steward: Elite Excellence';
                case 'platinum': return 'Humanity Laureate: Legendary Status';
                case 'diamond': return 'Eternal Echo: Transcendent Legacy';
                default: return 'Impact Honor';
            }
        }
        if (template === 'monthly') return 'Equinox Excellence Award';
        if (template === 'daily') return 'Zenith of Sincerity';
        if (template === 'first_act') return 'Genesis Milestone';
        if (template === 'streak') return `${metrics.streak || 7}-Cycle Continuum`;
        if (template === 'annual') return 'Solemnity Annual Honor';
        return 'The Sincerity Honor';
    }, [template, tier, metrics.streak]);

    // Tier specific constants
    const tierConfig = useMemo(() => {
        const configs = {
            gold: { icon: "🥇", gradient: "from-[#D4AF37] to-[#F59E0B]", text: "text-[#B48A1B]" },
            silver: { icon: "🥈", gradient: "from-[#C0C0C0] to-[#94A3B8]", text: "text-[#64748B]" },
            bronze: { icon: "🥉", gradient: "from-[#CD7F32] to-[#B87333]", text: "text-[#8B4513]" },
            platinum: { icon: "💎", gradient: "from-[#E5E4E2] to-[#3B82F6]", text: "text-[#4A4A4A]" },
            diamond: { icon: "✨", gradient: "from-[#B9F2FF] to-[#3B82F6]", text: "text-[#1E40AF]" },
            welcome: { icon: "🌱", gradient: "from-[#3B82F6] to-[#2563EB]", text: "text-[#2563EB]" }
        };
        return configs[tier as keyof typeof configs] || configs.silver;
    }, [tier]);

    const handleDownloadPDF = async () => {
        setIsGenerating(true);
        const element = certificateRef.current;
        if (!element) return;
        try {
            const canvas = await html2canvas(element, {
                scale: 5, // High-fidelity for luxury printing
                useCORS: true,
                backgroundColor: null, // Allow theme backgrounds (e.g. Dark Gold)
                width: 800,
                height: 1131,
                logging: false
            });
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });
            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
            pdf.save(`Humanexa_${fullTitle.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('PDF Export failed', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyLink = () => {
        setIsCopying(true);
        navigator.clipboard.writeText(`${window.location.origin}/verify/${id}`);
        setTimeout(() => setIsCopying(false), 2000);
    };

    // Celebration sequence (demonstration)
    useEffect(() => {
        if (!isLocked && unlockedOn === date) { // Assuming just unlocked
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 5000);
        }
    }, [isLocked]);

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -16, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                    "group relative w-[400px] h-[600px] bg-white rounded-[32px] overflow-hidden flex flex-col transition-all duration-500 border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.04)]",
                    isLocked ? "opacity-90 grayscale-[0.5] border-dashed border-2 border-slate-200" : "hover:shadow-[0_45px_100px_rgba(0,0,0,0.12)] hover:border-blue-500/10"
                )}
            >
                {/* THUMBNAIL AREA (The Artifact Frame) */}
                <div className="h-[280px] relative bg-[#FDFDFD] overflow-hidden flex items-center justify-center border-b border-slate-50">
                    <div className={cn(
                        "w-full h-full transition-all duration-1000 origin-center flex items-center justify-center p-6",
                        isLocked ? "opacity-40" : "group-hover:scale-[1.03]"
                    )}>
                        {/* Certificate Render Placeholder (Scaled) */}
                        <div className="w-[1000px] transform scale-[0.24] origin-center shadow-[0_30px_60px_rgba(0,0,0,0.2)]">
                            <CertificateRender
                                {...props}
                                tier={tier}
                                template={template}
                                previewMode
                                fullTitle={fullTitle}
                                tierConfig={tierConfig}
                                isLocked={isLocked}
                            />
                        </div>
                    </div>

                    {/* Gradient Overlay for badge readability */}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                    {/* Tier Badge - Always visible for preview clarity */}
                    <div className="absolute bottom-4 left-4 frosted bg-white/95 rounded-xl px-4 py-2 border border-white/30 shadow-lg flex items-center gap-2 z-30">
                        <span className="text-xl">{isLocked ? "🔒" : tierConfig.icon}</span>
                        <span className={cn("text-[10px] font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r", tierConfig.gradient)}>
                            {isLocked ? `LOCKED: ${tier}` : `${tier} ${template === 'journey' ? 'Guardian' : 'Honor'}`}
                        </span>
                    </div>

                    {/* Verification Icon - Only for unlocked */}
                    {!isLocked && (
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#10B981] border-2 border-white shadow-[0_2px_8px_rgba(16,185,129,0.4)] flex items-center justify-center text-white z-30">
                            <CheckCircle2 size={16} strokeWidth={3} />
                        </div>
                    )}

                    {/* Locked Overlay */}
                    {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-16 h-16 rounded-full bg-white/95 backdrop-blur-xl shadow-2xl flex items-center justify-center text-slate-800"
                            >
                                <Lock size={28} />
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                        <h4 className="text-[13px] font-serif font-semibold text-slate-400 uppercase tracking-[2px] mb-2">{template.replace('_', ' ')} Record</h4>
                        <h3 className="text-xl font-serif font-black text-slate-900 leading-tight mb-4 group-hover:text-blue-600 transition-colors">
                            {fullTitle}
                        </h3>
                        <p className="text-[15px] text-slate-500 italic leading-relaxed mb-6 font-medium">"{description.substring(0, 80)}{description.length > 80 ? '...' : ''}"</p>
                    </div>

                    {isLocked ? (
                        <div className="space-y-4">
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                <div className="flex justify-between items-center text-[12px] font-semibold text-slate-500 mb-2">
                                    <span className="flex items-center gap-2 text-gradient-sapphire font-black uppercase tracking-tighter">
                                        <Trophy size={14} className="text-blue-500" />
                                        Goal: {totalRequired} {template === 'journey' && id.includes('POINTS') ? 'Points' : template === 'streak' ? 'Days' : 'Acts'}
                                    </span>
                                    <span className="text-blue-600 font-bold">{Math.round((progress / totalRequired) * 100)}%</span>
                                </div>
                                <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(progress / totalRequired) * 100}%` }}
                                        className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="secondary"
                                    className="h-11 rounded-lg border-2 border-slate-100 bg-white text-slate-600 hover:bg-slate-50 transition-all text-sm font-bold"
                                    onClick={() => setIsPreviewOpen(true)}
                                    leftIcon={<Eye size={16} />}
                                >
                                    Inspect
                                </Button>
                                <Button
                                    className="h-11 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all text-sm"
                                    onClick={() => navigate('/live-impact')}
                                    rightIcon={<ArrowRight size={16} />}
                                >
                                    Progress
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Metadata Panel */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
                                    <CheckCircle2 size={14} className="text-[#10B981]" /> Verified: {unlockedOn || date}
                                </div>
                                <div className="flex items-center gap-2 text-[12px] font-mono font-medium text-slate-400 group-hover:text-slate-900 cursor-pointer transition-colors" onClick={handleCopyLink}>
                                    <ShieldCheck size={14} /> ID: {id}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    className="h-11 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all text-sm font-bold"
                                    onClick={() => setIsPreviewOpen(true)}
                                >
                                    <Eye size={16} />
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="h-11 rounded-lg border-2 border-slate-100 bg-white text-slate-600 hover:bg-slate-50 transition-all text-sm font-bold"
                                    onClick={handleDownloadPDF}
                                >
                                    <Download size={16} />
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="h-11 rounded-lg border-2 border-slate-100 bg-white text-slate-600 hover:bg-slate-50 transition-all text-sm font-bold"
                                    onClick={handleCopyLink}
                                >
                                    {isCopying ? <CheckCircle2 size={16} /> : <Share2 size={16} />}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Celebration Overlay */}
                <AnimatePresence>
                    {showCelebration && (
                        <div className="absolute inset-0 pointer-events-none z-[100] flex items-center justify-center">
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full bg-blue-500/10 backdrop-blur-sm flex items-center justify-center flex-col"
                            >
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="text-6xl mb-4"
                                >
                                    ✨
                                </motion.div>
                                <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-sm">Artifact Unlocked</p>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* FULL SCREEN LUXURY MODAL */}
            <AnimatePresence>
                {isPreviewOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPreviewOpen(false)}
                            className="absolute inset-0 bg-black/92 backdrop-blur-[20px]"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-full max-w-[1000px] h-[90vh] bg-white rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="h-[72px] px-8 flex justify-between items-center sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
                                <button
                                    onClick={() => setIsPreviewOpen(false)}
                                    className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all hover:rotate-90"
                                >
                                    <X size={24} />
                                </button>
                                <div className="flex flex-col items-center">
                                    <h2 className="text-sm font-sans font-black uppercase tracking-[0.3em] text-slate-900 leading-none">Official Honor Record</h2>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{id}</p>
                                </div>
                                <button className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            {/* Certificate Rendering Area */}
                            <div className="flex-1 overflow-y-auto p-12 bg-slate-50 flex items-center justify-center">
                                <div className="w-full max-w-[840px] shadow-2xl bg-white relative" ref={certificateRef}>
                                    <CertificateRender {...props} tier={tier} template={template} fullTitle={fullTitle} tierConfig={tierConfig} isLocked={isLocked} />
                                </div>
                            </div>

                            {/* Modal Footer / Action Bar */}
                            <div className="h-[80px] px-8 bg-slate-50 border-t border-slate-200 sticky bottom-0 z-10 grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
                                <Button
                                    className="h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-xl shadow-blue-500/30 hover:scale-105"
                                    leftIcon={<Download size={18} />}
                                    onClick={handleDownloadPDF}
                                >
                                    {isGenerating ? "Preparing..." : "Download PDF"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="h-12 rounded-xl border-2 border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50"
                                    leftIcon={<Share2 size={18} />}
                                    onClick={handleCopyLink}
                                >
                                    {isCopying ? "Link Copied" : "Share Record"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="h-12 rounded-xl border-2 border-slate-200 bg-white text-slate-600 font-bold hidden md:flex"
                                    leftIcon={<Printer size={18} />}
                                    onClick={() => window.print()}
                                >
                                    Print
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="h-12 rounded-xl border-2 border-[#10B981]/30 bg-white text-[#10B981] font-bold hover:bg-[#10B981]/5"
                                    leftIcon={<ShieldCheck size={18} />}
                                >
                                    Verified ✓
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Certificate;
