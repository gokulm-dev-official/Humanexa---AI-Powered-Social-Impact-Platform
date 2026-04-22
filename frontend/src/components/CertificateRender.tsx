import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Star, Award, Zap, Heart, Globe, Building2, Medal } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '../utils/cn';
import type { CertificateTier, CertificateTemplate } from './Certificate';

// Import New Humanexa Assets
import signatureImg from '../assets/signature.png';
import logoImg from '../assets/logo_splash.png';
import sealImg from '../assets/seal.jpg';

interface CertificateRenderProps {
    recipientName: string;
    date: string;
    id: string;
    description: string;
    metrics?: {
        acts?: number;
        points?: number;
        livesImpacted?: number;
        streak?: number;
        rank?: string;
        funds?: number;
    };
    previewMode?: boolean;
    fullTitle: string;
    tier: CertificateTier;
    template: CertificateTemplate;
    tierConfig: {
        icon: string;
        gradient: string;
        text: string;
    };
    isLocked?: boolean; // New prop for conditional visibility
}

const CertificateRender: React.FC<CertificateRenderProps> = ({
    recipientName,
    date,
    id,
    description,
    metrics = {},
    previewMode = false,
    fullTitle,
    tier,
    template,
    tierConfig,
    isLocked = false
}) => {
    const acts = metrics?.acts || 0;
    const points = metrics?.points || 0;
    const streak = metrics?.streak || 0;

    const formatId = (tier: string, name: string, serial: string) => {
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        return `HMX-${tier.toUpperCase()}-2026-${initials}-${serial.substring(0, 6).toUpperCase()}`;
    };

    const certId = formatId(tier, recipientName, id);
    const verificationUrl = `${window.location.origin}/verify/${id}`;

    return (
        <div
            id="certificate-canvas"
            className={cn(
                "relative w-[800px] aspect-[1/1.414] overflow-hidden flex flex-col items-center p-[64px] select-none",
                tier === 'gold' && "bg-[#050810]",
                tier === 'diamond' && "bg-gradient-to-br from-[#FAFBFF] via-[#FFFFFF] to-[#F1F5FF]",
                tier !== 'gold' && tier !== 'diamond' && "bg-[#FCFAF5]",
                previewMode ? "scale-[0.3] origin-top shadow-none" : "shadow-[0_80px_160px_rgba(0,0,0,0.18)]"
            )}
            style={{
                fontFamily: "'Cormorant Garamond', serif",
                backgroundImage: tier === 'gold' ? 'radial-gradient(circle at 50% 50%, #111827 0%, #050810 100%)' : undefined
            }}
        >
            {/* LUXURY FRAME & TEXTURE */}
            <LuxuryFrame tier={tier} />
            <SecurityTexture tier={tier} />
            {tier === 'diamond' && <DivineWatermark />}

            {/* HEADER - LOGO (Background removal & Conditional) */}
            <header className="relative z-10 w-full flex flex-col items-center text-center mt-2">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-32 w-auto overflow-hidden flex items-center justify-center">
                        <img
                            src={logoImg}
                            alt="Humanexa Logo"
                            className={cn(
                                "h-full w-auto object-contain mb-2",
                                tier === 'gold' ? "invert grayscale brightness-200" :
                                    tier === 'diamond' ? "contrast-[1.5] brightness-[1.1] saturate-[0.5]" :
                                        "mix-blend-multiply contrast-[2] brightness-[1.5]"
                            )}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={cn("h-[1px] w-12",
                            tier === 'gold' ? "bg-[#D4AF37]/50" :
                                tier === 'diamond' ? "bg-indigo-200" : "bg-slate-300"
                        )} />
                        <span className={cn("text-[9px] font-black tracking-[8px] uppercase",
                            tier === 'gold' ? "text-[#D4AF37]" :
                                tier === 'diamond' ? "text-indigo-400" : "text-slate-400"
                        )}>Official Protocol</span>
                        <div className={cn("h-[1px] w-12",
                            tier === 'gold' ? "bg-[#D4AF37]/50" :
                                tier === 'diamond' ? "bg-indigo-200" : "bg-slate-300"
                        )} />
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT - CENTERED */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full text-center py-4">
                {/* Protocol Tier Badge */}
                <div className="mb-4">
                    <div className={cn("inline-flex items-center gap-2 px-6 py-1.5 rounded-full border border-dashed",
                        tier === 'gold' ? "border-[#D4AF37]/40 text-[#D4AF37]" : "border-slate-200 text-slate-400")}>
                        <ShieldCheck size={14} />
                        <span className="text-[11px] font-black tracking-[4px] uppercase">{tier} TIER HONOR CITATION</span>
                    </div>
                </div>

                {/* Main Heading */}
                <h3 className={cn(
                    "text-[44px] font-black tracking-tight leading-tight mb-8 max-w-[600px]",
                    tier === 'gold' ? "bg-gradient-to-b from-[#FAE089] via-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent" : "text-[#111827]"
                )} style={{ fontFamily: "'Playfair Display', serif" }}>
                    {fullTitle.toUpperCase()}
                </h3>

                {/* Recipient - ACHIEVED ALLURA LUXURY */}
                <div className="w-full flex flex-col items-center mb-8">
                    <p className={cn(
                        "text-[15px] italic mb-4 font-medium tracking-wide",
                        tier === 'gold' ? "text-slate-400" :
                            tier === 'diamond' ? "text-indigo-300" : "text-slate-500"
                    )}>
                        This authentic distinction is hereby conferred with highest regard upon
                    </p>

                    <div className="relative w-full text-center py-4">
                        <h1 className={cn(
                            "text-[92px] leading-none text-center w-full px-4",
                            tier === 'gold' ? "bg-gradient-to-r from-[#D4AF37] via-[#FFF5C3] to-[#B8860B] bg-clip-text text-transparent" :
                                tier === 'diamond' ? "text-[100px] bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] bg-clip-text text-transparent font-extrabold" :
                                    "text-[#1A1A1A]"
                        )} style={{ fontFamily: "'Allura', cursive" }}>
                            {recipientName}
                        </h1>
                        <div className={cn(
                            "h-[1.5px] w-[350px] mx-auto mt-6 opacity-30",
                            tier === 'gold' ? "bg-[#D4AF37]" :
                                tier === 'diamond' ? "bg-gradient-to-r from-transparent via-indigo-400 to-transparent" : "bg-slate-400"
                        )} />
                    </div>
                </div>

                {/* Description */}
                <div className="max-w-[580px] mx-auto mb-10">
                    <p className={cn(
                        "text-[17px] leading-[1.8] font-medium italic opacity-95 text-center",
                        tier === 'gold' ? "text-slate-200" :
                            tier === 'diamond' ? "text-indigo-950 font-semibold" : "text-slate-700"
                    )}>
                        "{description}"
                    </p>
                </div>

                {/* Audit Ledger */}
                <div className={cn(
                    "w-full max-w-[500px] grid grid-cols-3 gap-0 border-y py-8",
                    tier === 'gold' ? "border-[#D4AF37]/30" :
                        tier === 'diamond' ? "border-indigo-100 bg-indigo-50/30 rounded-lg px-4" : "border-slate-100"
                )}>
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black tracking-[4px] text-slate-400 uppercase mb-2">Impact XP</span>
                        <span className={cn("text-3xl font-black",
                            tier === 'gold' ? "text-white" :
                                tier === 'diamond' ? "text-indigo-600" : "text-[#111827]"
                        )}>{points}</span>
                    </div>
                    <div className={cn("flex flex-col items-center border-x",
                        tier === 'gold' ? "border-[#D4AF37]/20" :
                            tier === 'diamond' ? "border-indigo-100" : "border-slate-100"
                    )}>
                        <span className="text-[9px] font-black tracking-[4px] text-slate-400 uppercase mb-2">Humanity Acts</span>
                        <span className={cn("text-3xl font-black",
                            tier === 'gold' ? "text-[#D4AF37]" :
                                tier === 'diamond' ? "text-indigo-700 underline decoration-indigo-200" : "text-[#111827]"
                        )}>{acts}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black tracking-[4px] text-slate-400 uppercase mb-2">Cycle Streak</span>
                        <span className={cn("text-3xl font-black",
                            tier === 'gold' ? "text-white" :
                                tier === 'diamond' ? "text-indigo-600" : "text-[#111827]"
                        )}>{streak}d</span>
                    </div>
                </div>
            </main>

            {/* FOOTER - CONDITIONAL VISIBILITY (QR, Sign, Seal only if not locked) */}
            <footer className="relative z-10 w-full mt-auto flex items-end justify-between border-t border-slate-200/50 pt-10 pb-4 min-h-[160px]">

                {/* QR VERIFICATION - HIDDEN IF LOCKED */}
                <div className="flex flex-col items-center gap-3">
                    {!isLocked && (
                        <>
                            <div className={cn(
                                "p-2.5 bg-white rounded-xl shadow-lg border",
                                tier === 'gold' ? "border-[#D4AF37]" : "border-slate-100"
                            )}>
                                <QRCodeSVG value={verificationUrl} size={72} level="H" />
                            </div>
                            <p className={cn("text-[9px] font-black tracking-[3px] uppercase", tier === 'gold' ? "text-[#D4AF37]" : "text-slate-900")}>
                                Scan to Verify
                            </p>
                        </>
                    )}
                </div>

                {/* DATE & ID */}
                <div className="flex flex-col items-center mb-4">
                    <p className={cn("text-[11px] font-black tracking-[5px] uppercase", tier === 'gold' ? "text-slate-400" : "text-slate-500")} style={{ fontFamily: "'Cinzel', serif" }}>
                        OFFICIALLY RECORDED
                    </p>
                    <div className={cn("text-[14px] font-bold mt-1", tier === 'gold' ? "text-white" : "text-[#111827]")}>
                        {date.toUpperCase()}
                    </div>
                    <p className="text-[8px] font-mono text-slate-400 mt-2 opacity-60">REF: {certId}</p>
                </div>

                {/* SIGNATURE & SEAL - HIDDEN IF LOCKED */}
                {!isLocked && (
                    <div className="flex items-end gap-10 h-full">
                        <div className="flex flex-col items-center mb-1">
                            <img
                                src={signatureImg}
                                className={cn(
                                    "h-16 w-auto mb-[-12px] opacity-90",
                                    tier === 'gold' ? "invert brightness-200" : "mix-blend-multiply contrast-[4] brightness-[2] saturate-0"
                                )}
                                alt="Founder Signature"
                            />
                            <div className={cn("h-[1.5px] w-32 mx-auto", tier === 'gold' ? "bg-[#D4AF37]/50" : "bg-slate-300")} />
                            <p className={cn("text-[8px] font-black tracking-[3px] uppercase mt-2", tier === 'gold' ? "text-slate-400" : "text-slate-500")}>Founding Director</p>
                        </div>

                        <div className="relative h-32 w-32 flex items-center justify-center transform rotate-6 scale-110 mb-[-16px]">
                            <img
                                src={sealImg}
                                alt="Official Seal"
                                className={cn(
                                    "w-full h-full object-contain drop-shadow-2xl",
                                    tier === 'gold' ? "invert grayscale brightness-[1.5]" : "mix-blend-multiply contrast-[1.5] brightness-[1.1]"
                                )}
                                style={{
                                    clipPath: 'circle(48%)'
                                }}
                            />
                        </div>
                    </div>
                )}
                {isLocked && <div className="w-[200px]" />} {/* Placeholder to maintain layout balance */}
            </footer>

            {/* Microprint Footer */}
            <div className="absolute inset-x-0 bottom-6 flex justify-center opacity-30 select-none">
                <span className="text-[6px] font-mono tracking-[4px] uppercase text-slate-400">
                    ANTI-FORGERY SECURITY PROTOCOL • OFFICIAL HUMANEXA IMPACT ARTIFACT • ISO-9001 VERIFIED
                </span>
            </div>
        </div>
    );
};

const DivineWatermark = () => (
    <div className="absolute inset-0 pointer-events-none opacity-[0.05] flex items-center justify-center overflow-hidden">
        <svg width="600" height="600" viewBox="0 0 100 100" className="animate-spin-slow">
            <path d="M50 5 L95 27.5 L95 72.5 L50 95 L5 72.5 L5 27.5 Z" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-indigo-400" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-indigo-300" />
            <path d="M50 15 L85 35 L85 65 L50 85 L15 65 L15 35 Z" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-indigo-200" />
            <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-indigo-400" />
        </svg>
    </div>
);

const LuxuryFrame = ({ tier }: { tier: CertificateTier }) => {
    const isGold = tier === 'gold';
    return (
        <div className="absolute inset-8 pointer-events-none">
            <div className={cn("w-full h-full border-[2.5px]", isGold ? "border-[#D4AF37]/60" : "border-slate-300")}>
                <div className={cn("absolute inset-2 border-[1px] opacity-30", isGold ? "border-[#D4AF37]" : "border-slate-200")} />
                <div className={cn("absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 italic text-[9px] font-bold tracking-[4px]", isGold ? "bg-[#050810] text-[#D4AF37]" : "bg-[#FCFAF5] text-slate-400")}>VERIFIED</div>
                <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 px-4 py-1 italic text-[9px] font-bold tracking-[4px]", isGold ? "bg-[#050810] text-[#D4AF37]" : "bg-[#FCFAF5] text-slate-400")}>AUTHENTIC</div>

                <div className={cn("absolute -top-1.5 -left-1.5 w-10 h-10 border-t-4 border-l-4", isGold ? "border-[#D4AF37]" : "border-slate-400")} />
                <div className={cn("absolute -top-1.5 -right-1.5 w-10 h-10 border-t-4 border-r-4", isGold ? "border-[#D4AF37]" : "border-slate-400")} />
                <div className={cn("absolute -bottom-1.5 -left-1.5 w-10 h-10 border-b-4 border-l-4", isGold ? "border-[#D4AF37]" : "border-slate-400")} />
                <div className={cn("absolute -bottom-1.5 -right-1.5 w-10 h-10 border-b-4 border-r-4", isGold ? "border-[#D4AF37]" : "border-slate-400")} />
            </div>
        </div>
    );
};

const SecurityTexture = ({ tier }: { tier: CertificateTier }) => {
    return (
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] select-none">
            <svg width="100%" height="100%">
                <pattern id="lux_pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.5" fill="currentColor" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#lux_pattern)" />
            </svg>
        </div>
    );
};

export default CertificateRender;
