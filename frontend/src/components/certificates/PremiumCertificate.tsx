import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, X, Eye, Lock, ChevronRight, CheckCircle2, Shield } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { COLORS, CANVAS, mmToPx, getTierColors, generateCertificateID } from '../../constants/certificateDesign';
import { WelcomeCertificate } from './tiers/WelcomeCertificate';
import { BronzeCertificate } from './tiers/BronzeCertificate';
import { SilverCertificate } from './tiers/SilverCertificate';
import { GoldCertificate } from './tiers/GoldCertificate';
import { PlatinumCertificate } from './tiers/PlatinumCertificate';
import { DiamondCertificate } from './tiers/DiamondCertificate';
import { cn } from '../../utils/cn';

export type TierLevel = 'welcome' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

const TIER_ACCENT: Record<TierLevel, { bg: string; text: string; dot: string }> = {
    welcome: { bg: 'rgba(0,113,227,0.06)', text: '#0071E3', dot: '#0071E3' },
    bronze: { bg: 'rgba(167,124,82,0.08)', text: '#8B6914', dot: '#A77C52' },
    silver: { bg: 'rgba(100,116,139,0.06)', text: '#64748B', dot: '#94A3B8' },
    gold: { bg: 'rgba(212,175,55,0.08)', text: '#92400E', dot: '#D4AF37' },
    platinum: { bg: 'rgba(124,135,142,0.06)', text: '#475569', dot: '#7C878E' },
    diamond: { bg: 'rgba(0,191,255,0.06)', text: '#0284C7', dot: '#00BFFF' },
};

interface PremiumCertificateProps {
    tier: TierLevel;
    recipientName: string;
    date: string;
    metrics: {
        activities?: number;
        points?: number;
        livesImpacted?: number;
        location?: string;
        firstAct?: string;
        communityMember?: string;
        [key: string]: any;
    };
    isLocked?: boolean;
    certificateID?: string;
    description?: string;
    progress?: number;
    totalRequired?: number;
}

/**
 * Premium Certificate Card — Apple-Level Design
 * Clean, minimal, with subtle depth and elegant interactions
 */
export const PremiumCertificate: React.FC<PremiumCertificateProps> = ({
    tier,
    recipientName,
    date,
    metrics,
    isLocked = false,
    certificateID: providedID,
    description,
    progress = 0,
    totalRequired = 1,
}) => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
    const certificateRef = useRef<HTMLDivElement>(null);

    const initials = recipientName.split(' ').map(n => n[0]).join('');
    const sequence = Math.floor(Math.random() * 999999);
    const certificateID = providedID || generateCertificateID(tier.toUpperCase() as any, initials, sequence);
    const accent = TIER_ACCENT[tier];
    const progressPercent = totalRequired > 0 ? Math.round((progress / totalRequired) * 100) : 0;

    // Generate QR code
    React.useEffect(() => {
        const generateQR = async () => {
            const verificationUrl = `https://humanexa.org/verify/${certificateID}`;
            try {
                const qrUrl = await QRCode.toDataURL(verificationUrl, {
                    errorCorrectionLevel: 'H',
                    width: mmToPx(130),
                    margin: 1,
                    color: {
                        dark: COLORS.NEUTRAL.BLACK_NEAR,
                        light: '#FFFFFF',
                    },
                });
                setQrCodeDataUrl(qrUrl);
            } catch (err) {
                console.error('QR Code generation failed:', err);
            }
        };
        generateQR();
    }, [certificateID]);

    const handleDownloadPDF = async () => {
        const element = certificateRef.current;
        if (!element) return;
        try {
            const canvas = await html2canvas(element, {
                scale: 1,
                useCORS: true,
                backgroundColor: '#FFFFFF',
                logging: false,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
                compress: true,
            });
            pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
            pdf.save(`HUMANEXA_${tier.toUpperCase()}_${recipientName.replace(/\s+/g, '_')}_${certificateID}.pdf`);
        } catch (error) {
            console.error('PDF generation failed:', error);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `HUMANEXA ${tier.toUpperCase()} Certificate`,
                text: `I've earned the ${tier} tier recognition for verified social impact!`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const renderCertificateByTier = () => {
        const commonProps = { recipientName, date, metrics, certificateID, qrCodeDataUrl };
        switch (tier) {
            case 'welcome': return <WelcomeCertificate {...commonProps} />;
            case 'bronze': return <BronzeCertificate {...commonProps} />;
            case 'silver': return <SilverCertificate {...commonProps} />;
            case 'gold': return <GoldCertificate {...commonProps} />;
            case 'platinum': return <PlatinumCertificate {...commonProps} />;
            case 'diamond': return <DiamondCertificate {...commonProps} />;
            default: return <WelcomeCertificate {...commonProps} />;
        }
    };

    // Dynamic scale calculation for Modal
    const [modalScale, setModalScale] = React.useState(0.2);
    React.useEffect(() => {
        const updateScale = () => {
            const vw = Math.min(window.innerWidth * 0.88, 900);
            const vh = window.innerHeight * 0.72;
            const scaleW = vw / 3508;
            const scaleH = vh / 2480;
            setModalScale(Math.min(scaleW, scaleH));
        };
        window.addEventListener('resize', updateScale);
        updateScale();
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    return (
        <>
            {/* ─── Card ─── */}
            <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="card-elevated !rounded-3xl overflow-hidden group/card"
            >
                {/* Preview Frame */}
                <div
                    onClick={() => !isLocked && setIsPreviewOpen(true)}
                    className={cn(
                        "relative aspect-[297/210] bg-[#FAFAFA] overflow-hidden cursor-pointer border-b border-black/[0.04]",
                        isLocked && "cursor-default"
                    )}
                >
                    {/* Scaled certificate preview */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            className="shrink-0"
                            style={{
                                width: '3508px',
                                height: '2480px',
                                transform: 'scale(0.082)',
                                transformOrigin: 'center center',
                                filter: isLocked ? 'blur(3px) grayscale(0.6)' : 'none',
                            }}
                        >
                            {renderCertificateByTier()}
                        </div>
                    </div>

                    {/* Hover overlay */}
                    {!isLocked && (
                        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/[0.06] transition-all duration-500 flex items-center justify-center opacity-0 group-hover/card:opacity-100">
                            <div className="px-5 py-2 rounded-full bg-white/95 backdrop-blur-md shadow-lg flex items-center gap-2 text-[var(--color-primary)]">
                                <Eye size={14} />
                                <span className="text-[12px] font-semibold">View Certificate</span>
                            </div>
                        </div>
                    )}

                    {/* Locked Overlay */}
                    {isLocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center mb-3">
                                <Lock size={18} className="text-black/30" />
                            </div>
                            <p className="text-[12px] font-semibold text-black/40">{progress}/{totalRequired} completed</p>
                        </div>
                    )}

                    {/* Tier badge */}
                    {!isLocked && (
                        <div
                            className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-lg border border-white/60 backdrop-blur-md shadow-sm"
                            style={{ background: accent.bg }}
                        >
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent.dot }} />
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent.text }}>
                                {tier}
                            </span>
                        </div>
                    )}

                    {/* Verified badge */}
                    {!isLocked && (
                        <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[var(--color-success)] flex items-center justify-center shadow-sm">
                            <CheckCircle2 size={14} className="text-white" strokeWidth={2.5} />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Title & ID */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-[15px] font-semibold text-[var(--color-primary)] capitalize">{tier} Distinction</h3>
                            <span className="text-[10px] font-mono text-[var(--color-secondary)]">{certificateID}</span>
                        </div>
                        {description && (
                            <p className="text-[13px] text-[var(--color-secondary)] leading-relaxed line-clamp-2">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Progress (locked) */}
                    {isLocked && totalRequired > 0 && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-medium text-[var(--color-secondary)]">{progress} of {totalRequired} acts</span>
                                <span className="text-[13px] font-bold text-[var(--color-primary)]">{progressPercent}%</span>
                            </div>
                            <div className="h-[5px] bg-black/[0.04] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${Math.min(progressPercent, 100)}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                                    className="h-full rounded-full"
                                    style={{ background: accent.dot }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={() => setIsPreviewOpen(true)}
                        className={cn(
                            "w-full h-11 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center justify-center gap-2",
                            isLocked
                                ? "bg-black/[0.03] text-black/30 cursor-default"
                                : "bg-[var(--color-primary)] text-white hover:opacity-90 active:scale-[0.98]"
                        )}
                    >
                        {isLocked ? 'In Progress' : 'View Certificate'}
                        <ChevronRight size={14} className={isLocked ? "text-black/15" : "text-white/60"} />
                    </button>
                </div>
            </motion.div>

            {/* ─── Full-Screen Modal ─── */}
            <AnimatePresence>
                {isPreviewOpen && (
                    <div className="fixed inset-0 z-[9999] flex flex-col">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPreviewOpen(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                        />

                        {/* Header Bar */}
                        <div className="relative z-10 flex items-center justify-between px-6 md:px-8 py-5 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                                    <Shield className="w-4.5 h-4.5 text-white/70" />
                                </div>
                                <div>
                                    <h3 className="text-white text-[14px] font-semibold capitalize">{tier} Certificate</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-white/30 text-[11px] font-mono">{certificateID}</span>
                                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                        <span className="text-emerald-400/80 text-[11px] font-semibold">Verified</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={isLocked}
                                    className={cn(
                                        "flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[12px] font-semibold transition-all",
                                        isLocked
                                            ? "bg-white/[0.04] text-white/20 cursor-not-allowed"
                                            : "bg-white text-black hover:scale-[1.02] active:scale-[0.98]"
                                    )}
                                >
                                    <Download size={14} />
                                    Download PDF
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.1] transition-all"
                                >
                                    <Share2 size={16} />
                                </button>
                                <button
                                    onClick={() => setIsPreviewOpen(false)}
                                    className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-red-500/80 transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Certificate Viewport */}
                        <div className="relative z-10 flex-1 overflow-hidden flex items-center justify-center p-6 md:p-10">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                            >
                                <div className="bg-white rounded-2xl shadow-[0_60px_120px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/10">
                                    <div className="overflow-hidden" style={{
                                        width: `${3508 * modalScale}px`,
                                        height: `${2480 * modalScale}px`
                                    }}>
                                        <div style={{
                                            transform: `scale(${modalScale})`,
                                            transformOrigin: 'top left',
                                            width: '3508px',
                                            height: '2480px'
                                        }}>
                                            <div ref={certificateRef} className="shrink-0 inline-block bg-white">
                                                {renderCertificateByTier()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-center gap-3 opacity-20">
                                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-white" />
                                    <p className="text-white text-[10px] font-medium tracking-widest uppercase">
                                        Verified • Non-Transferable • Blockchain Secured
                                    </p>
                                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-white" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
