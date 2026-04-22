import React, { useRef, useState } from 'react';
import { Award, Download, Share2, Lock, Heart, ShieldCheck, QrCode, X, Zap, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type TierType = 'welcome' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface TieredCertificateProps {
    tier: TierType;
    recipientName: string;
    date: string;
    activitySummary: string;
    metrics: {
        activities: number;
        points: number;
        livesImpacted: number;
        valueDelivered?: string;
    };
    isLocked?: boolean;
}

const TieredCertificate: React.FC<TieredCertificateProps> = ({
    tier,
    recipientName,
    date,
    activitySummary,
    metrics,
    isLocked = false
}) => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const certificateRef = useRef<HTMLDivElement>(null);
    const serialID = `${tier.toUpperCase().substring(0, 3)}-2025-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Social Kind - ${tier.toUpperCase()} Recognition`,
                text: `I just earned the ${tier} tier certificate!`,
                url: window.location.href
            }).catch(console.error);
        } else {
            alert('Sharing link copied to clipboard!');
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const handleDownloadPDF = async () => {
        const element = certificateRef.current;
        if (!element) return;
        const canvas = await html2canvas(element, { scale: 3, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
        pdf.save(`SocialKind_${tier}_${recipientName.replace(/\s+/g, '_')}.pdf`);
    };

    // Premium Wave SVG Pattern Component
    const WavePattern = ({ colors }: { colors: { primary: string; secondary: string } }) => (
        <svg className="absolute top-0 left-0 w-full h-48" viewBox="0 0 1200 200" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`wave-grad-${tier}-1`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
                    <stop offset="50%" stopColor={colors.secondary} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={colors.primary} stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id={`wave-grad-${tier}-2`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.4" />
                    <stop offset="50%" stopColor={colors.primary} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.4" />
                </linearGradient>
            </defs>
            <path d="M0,60 Q300,10 600,60 T1200,60 L1200,0 L0,0 Z" fill={`url(#wave-grad-${tier}-1)`} />
            <path d="M0,80 Q300,120 600,80 T1200,80 L1200,0 L0,0 Z" fill={`url(#wave-grad-${tier}-2)`} />
            <path d="M0,100 Q300,60 600,100 T1200,100 L1200,0 L0,0 Z" fill={colors.primary} fillOpacity="0.2" />
        </svg>
    );

    const BottomWavePattern = ({ colors }: { colors: { primary: string; secondary: string } }) => (
        <svg className="absolute bottom-0 right-0 w-full h-48" viewBox="0 0 1200 200" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`wave-grad-bottom-${tier}-1`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
                    <stop offset="50%" stopColor={colors.secondary} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={colors.primary} stopOpacity="0.3" />
                </linearGradient>
            </defs>
            <path d="M0,140 Q300,180 600,140 T1200,140 L1200,200 L0,200 Z" fill={`url(#wave-grad-bottom-${tier}-1)`} />
            <path d="M0,120 Q300,80 600,120 T1200,120 L1200,200 L0,200 Z" fill={colors.secondary} fillOpacity="0.3" />
        </svg>
    );

    // Premium Badge Component
    const PremiumBadge = ({ icon: Icon, color }: { icon: any; color: string }) => (
        <div className="absolute top-12 left-12 w-28 h-28">
            <div className="relative w-full h-full">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)` }}></div>
                <div className="absolute inset-2 rounded-full bg-white shadow-xl"></div>
                <div className="absolute inset-4 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}>
                    <Icon className="text-white" size={40} fill="currentColor" />
                </div>
                {/* Ribbon */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-16 flex flex-col gap-1">
                    <div className="w-full h-full relative">
                        <div className="absolute inset-x-0 top-0 h-12" style={{ background: `linear-gradient(to bottom, ${color}, ${color}DD)` }}></div>
                        <div className="absolute bottom-0 left-0 w-1/2 h-0 border-l-6 border-r-0 border-b-8"
                            style={{ borderColor: `transparent transparent ${color}88 transparent` }}></div>
                        <div className="absolute bottom-0 right-0 w-1/2 h-0 border-r-6 border-l-0 border-b-8"
                            style={{ borderColor: `transparent transparent ${color}88 transparent` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderWelcome = () => (
        <div className="relative w-[1123px] h-[794px] bg-gradient-to-br from-[#FFFEF0] via-white to-[#FFF9E8] flex flex-col items-center overflow-hidden"
            style={{ fontFamily: "'Playfair Display', serif" }}>

            <WavePattern colors={{ primary: '#E8B923', secondary: '#D4D4D4' }} />
            <BottomWavePattern colors={{ primary: '#E8B923', secondary: '#D4D4D4' }} />

            {/* Border Frame */}
            <div className="absolute inset-6 border-4 border-[#E8B923] rounded-lg"></div>
            <div className="absolute inset-8 border border-[#D4D4D4]"></div>

            <PremiumBadge icon={Heart} color="#E8B923" />

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-20">
                <div className="text-center mb-8">
                    <p className="text-sm text-slate-400 uppercase tracking-[0.3em] mb-2">Social Kind Foundation</p>
                    <h1 className="text-6xl font-bold text-slate-800 mb-4 tracking-tight">CERTIFICATE</h1>
                    <p className="text-2xl text-slate-600 tracking-[0.4em] uppercase">Of First Impact</p>
                </div>

                <div className="my-8 w-full max-w-2xl">
                    <div className="h-px bg-gradient-to-r from-transparent via-[#E8B923] to-transparent mb-6"></div>
                    <p className="text-center text-xl italic text-slate-500 mb-4">This Certificate is Proudly Presented To</p>
                    <h2 className="text-center text-7xl font-bold text-slate-900 mb-6" style={{ fontFamily: "'Great Vibes', cursive" }}>{recipientName}</h2>
                    <div className="h-px bg-gradient-to-r from-transparent via-[#E8B923] to-transparent"></div>
                </div>

                <p className="text-center text-lg leading-relaxed text-slate-600 max-w-2xl">
                    For taking the courageous first step toward creating verified, measurable social impact.
                    On <span className="font-bold text-slate-800">{date}</span>, you joined a movement of compassionate
                    individuals committed to transparent kindness.
                </p>

                <div className="absolute bottom-12 left-20 text-center">
                    <div className="w-40 h-px bg-slate-400 mb-2"></div>
                    <p className="text-sm font-bold text-slate-800">Authorized Signature</p>
                    <p className="text-xs text-slate-500">Platform Director</p>
                </div>

                <div className="absolute bottom-12 right-20 text-center">
                    <div className="w-40 h-px bg-slate-400 mb-2"></div>
                    <p className="text-sm font-bold text-slate-800">{date}</p>
                    <p className="text-xs text-slate-500 font-mono">ID: {serialID}</p>
                </div>
            </div>
        </div>
    );

    const renderBronze = () => (
        <div className="relative w-[1123px] h-[794px] bg-gradient-to-br from-[#FFF9E8] via-white to-[#FFEFD5] overflow-hidden">

            <WavePattern colors={{ primary: '#CD7F32', secondary: '#D4AF37' }} />
            <BottomWavePattern colors={{ primary: '#CD7F32', secondary: '#D4AF37' }} />

            <div className="absolute inset-6 border-4 border-[#CD7F32] rounded-lg shadow-inner"></div>
            <div className="absolute inset-8 border-2 border-[#D4AF37]/30"></div>

            <PremiumBadge icon={Trophy} color="#CD7F32" />

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-20">
                <div className="text-center mb-8">
                    <h3 className="text-[#8B4513] text-xl font-bold uppercase tracking-[0.5em] mb-4">Bronze Achiever</h3>
                    <h1 className="text-6xl font-bold text-[#8B4513] mb-4">CERTIFICATE</h1>
                    <p className="text-2xl text-[#8B4513]/70 uppercase tracking-[0.3em]">Of Verified Achievement</p>
                </div>

                <div className="my-10 w-full max-w-3xl">
                    <div className="h-px bg-gradient-to-r from-transparent via-[#CD7F32] to-transparent mb-6"></div>
                    <p className="text-center text-xl italic text-slate-600 mb-4">In Recognition of Demonstrated Commitment</p>
                    <h2 className="text-center text-7xl text-[#8B4513] mb-6" style={{ fontFamily: "'Great Vibes', cursive" }}>{recipientName}</h2>
                    <div className="h-px bg-gradient-to-r from-transparent via-[#CD7F32] to-transparent"></div>
                </div>

                <div className="w-full max-w-4xl bg-white/60 backdrop-blur-sm border-2 border-[#CD7F32]/20 rounded-2xl p-8 shadow-lg">
                    <div className="grid grid-cols-3 gap-8 text-center">
                        <div className="border-r border-[#CD7F32]/20">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Verified Acts</p>
                            <p className="text-4xl font-black text-[#8B4513]">{metrics.activities}</p>
                        </div>
                        <div className="border-r border-[#CD7F32]/20">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Credit Points</p>
                            <p className="text-4xl font-black text-[#8B4513]">{metrics.points}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lives Impacted</p>
                            <p className="text-4xl font-black text-[#2E5CFF]">{metrics.livesImpacted}</p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-12 flex justify-between w-full px-20">
                    <div className="flex flex-col items-center">
                        <ShieldCheck size={40} className="text-[#8B4513] mb-2" />
                        <p className="text-xs font-bold uppercase text-[#8B4513]">Verified & Secured</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-[#8B4513]">{date}</p>
                        <p className="text-xs font-mono text-slate-500">HASH: {serialID}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSilver = () => (
        <div className="relative w-[1123px] h-[794px] bg-gradient-to-br from-[#F8F9FA] via-white to-[#E9ECEF] overflow-hidden">

            <WavePattern colors={{ primary: '#C0C0C0', secondary: '#D4D4D4' }} />
            <BottomWavePattern colors={{ primary: '#C0C0C0', secondary: '#D4D4D4' }} />

            <div className="absolute inset-6 border-4 border-[#C0C0C0] rounded-lg shadow-2xl"></div>
            <div className="absolute inset-8 border-2 border-[#808080]/20"></div>

            {/* Metallic shine effect */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, transparent 0%, white 50%, transparent 100%)' }}></div>

            <PremiumBadge icon={Award} color="#C0C0C0" />

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-20">
                <div className="text-center mb-8">
                    <h3 className="text-[#434343] text-2xl font-black uppercase tracking-[0.5em] mb-4">Silver Distinction</h3>
                    <h1 className="text-6xl font-bold text-[#434343] mb-4">CERTIFICATE</h1>
                    <p className="text-2xl text-[#434343]/70 uppercase tracking-[0.3em]">Of Distinguished Impact</p>
                </div>

                <div className="my-10 w-full max-w-3xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C0C0C0] to-[#C0C0C0]"></div>
                        <Star className="text-[#434343]" size={24} fill="currentColor" />
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#C0C0C0] to-[#C0C0C0]"></div>
                    </div>
                    <p className="text-center text-xl italic text-slate-600 mb-4">By Virtue of Extraordinary Dedication</p>
                    <h2 className="text-center text-7xl text-[#1A1F3A] mb-6" style={{ fontFamily: "'Great Vibes', cursive" }}>{recipientName}</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C0C0C0] to-[#C0C0C0]"></div>
                        <Star className="text-[#434343]" size={24} fill="currentColor" />
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#C0C0C0] to-[#C0C0C0]"></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-10 w-full max-w-4xl">
                    <div className="bg-white/80 border-2 border-[#C0C0C0]/30 rounded-2xl p-8 shadow-lg">
                        <p className="text-lg text-slate-700 leading-relaxed">
                            In recognition of sustained commitment to transparent and verified social contribution.
                            This individual is hereby honored with the distinguished rank of <span className="font-bold text-[#434343]">SILVER CONTRIBUTOR</span>.
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-[#434343] to-[#808080] text-white p-8 rounded-2xl shadow-2xl transform -skew-x-2">
                        <h4 className="text-xs font-bold uppercase tracking-[0.3em] mb-6 opacity-70">Impact Portfolio</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-white/10 pb-3">
                                <span className="text-sm">Verified Acts</span>
                                <span className="font-bold text-lg">{metrics.activities}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-3">
                                <span className="text-sm">Total Points</span>
                                <span className="font-bold text-lg">{metrics.points}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Lives Touched</span>
                                <span className="font-bold text-lg text-blue-300">{metrics.livesImpacted}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-12 flex justify-between w-full px-20 items-center">
                    <div className="flex flex-col items-center">
                        <Zap size={36} className="text-[#434343] mb-2" fill="currentColor" />
                        <p className="text-xs font-bold uppercase text-[#434343]">Elite Momentum</p>
                    </div>
                    <div className="text-center">
                        <ShieldCheck size={48} className="text-[#434343] mb-2 mx-auto" />
                        <p className="text-xs font-black uppercase text-[#434343] tracking-widest">Authenticated Legacy</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-[#434343]">{date}</p>
                        <p className="text-xs font-mono text-slate-500">{serialID}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderGold = () => (
        <div className="relative w-[1123px] h-[794px] bg-gradient-to-br from-[#FFF9E8] via-[#FFFEF0] to-[#FFF5DC] overflow-hidden">

            <WavePattern colors={{ primary: '#FFD700', secondary: '#B8860B' }} />
            <BottomWavePattern colors={{ primary: '#FFD700', secondary: '#B8860B' }} />

            {/* Metallic gold shine */}
            <div className="absolute inset-0 opacity-20 pointer-events-none animate-pulse"
                style={{ background: 'radial-gradient(circle at 30% 30%, #FFD700 0%, transparent 70%)' }}></div>

            <div className="absolute inset-6 border-[6px] border-double border-[#B8860B] rounded-lg shadow-2xl"></div>
            <div className="absolute inset-10 border-2 border-[#FFD700]/30"></div>

            <PremiumBadge icon={Star} color="#FFD700" />

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-20">
                <div className="text-center mb-8">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-tr from-[#B8860B] to-[#FFD700] flex items-center justify-center shadow-2xl border-4 border-white">
                        <Star size={48} className="text-white" fill="currentColor" />
                    </div>
                    <h3 className="text-[#1A1F3A] text-2xl font-black uppercase tracking-[0.6em] mb-4">Elite Gold Champion</h3>
                    <h1 className="text-7xl font-bold text-[#1A1B1E] mb-4 drop-shadow-lg">CERTIFICATE</h1>
                    <p className="text-2xl text-[#B8860B] uppercase tracking-[0.3em] font-bold">Of Elite Social Championship</p>
                </div>

                <div className="my-10 w-full max-w-3xl">
                    <div className="h-px bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6"></div>
                    <h2 className="text-center text-8xl text-[#1A1B1E] drop-shadow-md mb-4" style={{ fontFamily: "'Great Vibes', cursive" }}>{recipientName}</h2>
                    <p className="text-center text-[#B8860B] font-bold uppercase tracking-[0.3em] text-lg">Champion of Verified Humanity</p>
                    <div className="h-px bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6"></div>
                </div>

                <div className="relative w-full max-w-5xl group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#B8860B] to-[#FFD700] rounded-3xl blur opacity-25"></div>
                    <div className="relative bg-white/90 backdrop-blur-md rounded-2xl p-10 shadow-2xl">
                        <div className="grid grid-cols-4 gap-8">
                            <div className="text-center border-r-2 border-[#B8860B]/10">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Verified Acts</p>
                                <p className="text-4xl font-black text-[#1A1B1E]">{metrics.activities}</p>
                            </div>
                            <div className="text-center border-r-2 border-[#B8860B]/10">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Impact Points</p>
                                <p className="text-4xl font-black text-[#1A1B1E]">{metrics.points.toLocaleString()}</p>
                            </div>
                            <div className="text-center border-r-2 border-[#B8860B]/10">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Lives Impacted</p>
                                <p className="text-4xl font-black text-[#2E5CFF]">{metrics.livesImpacted}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Impact Score</p>
                                <p className="text-3xl font-black text-green-600">Legendary</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-12 flex justify-between w-full px-20 items-end">
                    <div className="flex flex-col items-center">
                        <QrCode size={70} className="mb-2 text-[#1A1F3A]" />
                        <p className="text-xs font-black uppercase tracking-widest text-[#1A1F3A]">Imperial Verification</p>
                    </div>
                    <div className="flex gap-16">
                        <div className="text-center">
                            <div className="w-40 h-px bg-[#1A1F3A] mb-2"></div>
                            <p className="text-xs font-bold uppercase">Impact Protocol</p>
                        </div>
                        <div className="text-center">
                            <Award size={40} className="text-[#B8860B] mb-2 mx-auto" strokeWidth={1} />
                            <div className="w-40 h-px bg-[#1A1F3A] mb-2"></div>
                            <p className="text-xs font-bold uppercase">Platform Founder</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black uppercase text-[#1A1F3A]">{date}</p>
                        <p className="text-xs font-mono text-[#1A1F3A]/40">{serialID}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPlatinum = () => (
        <div className="relative w-[1123px] h-[794px] bg-gradient-to-br from-[#E8EAF6] via-white to-[#F3E5F5] overflow-hidden">

            <WavePattern colors={{ primary: '#E5E4E2', secondary: '#B8B8D0' }} />
            <BottomWavePattern colors={{ primary: '#E5E4E2', secondary: '#B8B8D0' }} />

            {/* Diamond dust shimmer */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-100 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="absolute inset-6 border-[8px] border-[#E5E4E2] rounded-lg shadow-2xl"></div>
            <div className="absolute inset-10 border-2 border-[#C8C8D8]/40"></div>

            <PremiumBadge icon={Trophy} color="#E5E4E2" />

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-20">
                <div className="text-center mb-8">
                    <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-tr from-[#E5E4E2] via-white to-[#E5E4E2] flex items-center justify-center shadow-2xl border-4 border-white/60">
                        <Trophy className="text-[#1A1F3A]" size={56} />
                    </div>
                    <h3 className="text-[#1A1F3A] text-3xl font-black uppercase tracking-[0.7em] mb-4">Legendary Luminary</h3>
                    <h1 className="text-7xl font-bold text-[#1A1F3A] mb-4">CERTIFICATE</h1>
                    <p className="text-2xl text-[#5E35B1] uppercase tracking-[0.3em] font-bold italic">Of Legendary Social Luminance</p>
                </div>

                <div className="my-10 w-full max-w-3xl">
                    <div className="h-px bg-gradient-to-r from-transparent via-[#E5E4E2] to-transparent mb-6"></div>
                    <h2 className="text-center text-8xl text-[#1A1F3A] drop-shadow-md mb-4" style={{ fontFamily: "'Great Vibes', cursive" }}>{recipientName}</h2>
                    <p className="text-center text-[#5E35B1]/60 font-bold uppercase tracking-[0.5em] text-lg italic">Immortalized Among the Greatest</p>
                    <div className="h-px bg-gradient-to-r from-transparent via-[#E5E4E2] to-transparent mt-6"></div>
                </div>

                <div className="w-full max-w-5xl flex gap-8">
                    <div className="flex-1 bg-white/60 backdrop-blur-xl border-2 border-[#E5E4E2]/40 rounded-3xl p-10 shadow-2xl">
                        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">Eternal Achievement Record</h4>
                        <div className="grid grid-cols-2 gap-10">
                            <div>
                                <p className="text-4xl font-black text-[#1A1F3A]">{metrics.activities}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase">Verified Activities</p>
                            </div>
                            <div>
                                <p className="text-4xl font-black text-[#1A1F3A]">{metrics.points.toLocaleString()}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase">Credit Points</p>
                            </div>
                            <div>
                                <p className="text-4xl font-black text-[#2E5CFF]">{metrics.livesImpacted}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase">Lives Transformed</p>
                            </div>
                            <div>
                                <p className="text-4xl font-black text-green-500">PERFECT</p>
                                <p className="text-xs font-bold text-slate-400 uppercase">Verification Score</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-72 bg-gradient-to-br from-[#E5E4E2] to-transparent backdrop-blur-md rounded-3xl p-8 flex flex-col items-center justify-center border-2 border-white/40 shadow-2xl">
                        <div className="w-32 h-32 rounded-full border-8 border-double border-white/60 flex items-center justify-center mb-4 animate-spin-slow">
                            <Award className="text-[#5E35B1]" size={64} strokeWidth={1} />
                        </div>
                        <p className="text-[#1A1F3A] font-black text-2xl text-center leading-tight">MUSEUM<br />GRADE<br />ARTIFACT</p>
                    </div>
                </div>

                <div className="absolute bottom-12 flex justify-between w-full px-20">
                    <div className="text-left">
                        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">Blockchain Hash</p>
                        <p className="text-xs font-mono text-slate-600">0x{Math.random().toString(16).substring(2, 20).toUpperCase()}</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <QrCode size={50} className="text-[#1A1F3A]" />
                        <ShieldCheck size={36} className="text-[#5E35B1]" />
                    </div>
                    <div className="text-right">
                        <p className="text-[#1A1F3A] font-black text-lg uppercase tracking-widest">{date}</p>
                        <p className="text-slate-400 text-xs tracking-widest">ID: {serialID}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDiamond = () => (
        <div className="relative w-[1123px] h-[794px] bg-gradient-to-br from-white via-[#F8F9FA] to-[#E3F2FD] overflow-hidden">

            <WavePattern colors={{ primary: '#00D2FF', secondary: '#3A7BD5' }} />
            <BottomWavePattern colors={{ primary: '#00D2FF', secondary: '#3A7BD5' }} />

            {/* Prismatic light effect */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
                <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gradient-to-r from-pink-400 to-blue-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>

            <div className="absolute inset-6 border-[10px] border-[#00D2FF]/20 rounded-lg"></div>
            <div className="absolute inset-10 border-2 border-[#3A7BD5]/30"></div>

            <PremiumBadge icon={Star} color="#00D2FF" />

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-20">
                <div className="text-center mb-8">
                    <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white flex items-center justify-center shadow-2xl border-4 border-blue-200 animate-pulse">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#00D2FF] via-[#3A7BD5] to-[#00D2FF] opacity-20 rounded-full"></div>
                        <Star className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 relative z-10" size={72} fill="url(#prismatic)" />
                        <svg width="0" height="0">
                            <defs>
                                <linearGradient id="prismatic" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#00D2FF" />
                                    <stop offset="50%" stopColor="#3A7BD5" />
                                    <stop offset="100%" stopColor="#00D2FF" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-4xl font-black uppercase tracking-[0.8em] mb-4">Eternal Icon</h3>
                    <h1 className="text-8xl font-bold text-slate-900 mb-4">CERTIFICATE</h1>
                    <p className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 uppercase tracking-[0.3em] font-black">Of Eternal Social Divinity</p>
                </div>

                <div className="my-10 w-full max-w-3xl">
                    <div className="h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent mb-6"></div>
                    <h2 className="text-center text-9xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow-2xl mb-4"
                        style={{ fontFamily: "'Great Vibes', cursive" }}>{recipientName}</h2>
                    <p className="text-center text-slate-400 font-bold uppercase tracking-[1em] text-lg">Immortal Humanitarian • Living Saint</p>
                    <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent mt-6"></div>
                </div>

                <div className="w-full max-w-6xl grid grid-cols-3 gap-8">
                    <div className="col-span-2 bg-white/40 backdrop-blur-3xl border-2 border-white/60 rounded-3xl p-12 shadow-2xl">
                        <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">Diamond Eternal Legacy Archive</h4>
                        <div className="grid grid-cols-2 gap-10">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <Zap size={32} />
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-slate-900">{metrics.activities}</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Divine Acts</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                                    <Trophy size={32} />
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-slate-900">{metrics.points.toLocaleString()}</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Eternal Points</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-600">
                                    <Heart size={32} fill="currentColor" />
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-slate-900">{metrics.livesImpacted}</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Souls Transformed</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
                                    <ShieldCheck size={32} />
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-slate-900">∞/5.0</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Divine Quality</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="bg-gradient-to-br from-indigo-900 to-black text-white p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-2xl">
                            <p className="text-xs font-bold uppercase tracking-widest mb-4 opacity-50">Imperial Recognition</p>
                            <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mb-4">
                                <Award className="text-[#FFD700] animate-spin-slow" size={32} />
                            </div>
                            <p className="text-xs font-bold leading-tight">INSCRIBED IN THE<br />ETERNAL HALL<br />OF IMMORTALS</p>
                        </div>
                        <div className="flex-grow bg-white/60 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 border-2 border-white shadow-lg">
                            <QrCode size={80} className="text-slate-900 opacity-80" />
                            <p className="mt-2 text-xs font-black uppercase tracking-[0.2em]">Universal Registry</p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-12 flex justify-between w-full px-20">
                    <div className="text-left">
                        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">Transcendent Hash</p>
                        <p className="text-xs font-mono font-bold text-slate-900">0x{Math.random().toString(16).substring(2, 40).toUpperCase()}</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <ShieldCheck className="text-blue-500" size={36} />
                        <div className="h-10 w-px bg-slate-200"></div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-800">Quantum<br />Secured</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-900 font-black text-xl uppercase tracking-[0.2em]">{date}</p>
                        <p className="text-slate-400 text-xs tracking-widest">SERIAL: {serialID}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCertificateContent = () => {
        switch (tier) {
            case 'welcome': return renderWelcome();
            case 'bronze': return renderBronze();
            case 'silver': return renderSilver();
            case 'gold': return renderGold();
            case 'platinum': return renderPlatinum();
            case 'diamond': return renderDiamond();
            default: return renderWelcome();
        }
    };

    return (
        <div className="relative group">
            {/* Minimal Card Interface */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                onClick={() => setIsPreviewOpen(true)}
                className={`cursor-pointer overflow-hidden rounded-[2rem] shadow-xl transition-all duration-700 hover:-translate-y-4 hover:shadow-[0_45px_100px_rgba(0,0,0,0.2)] ${isLocked ? 'grayscale opacity-50' : ''}`}
                style={{ aspectRatio: '1.414/1' }}
            >
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                            <Award size={20} />
                        </div>
                        <h4 className="text-white font-heading font-black text-xl uppercase tracking-tighter">{tier} Recognition</h4>
                    </div>
                    <button className="btn-primary !py-2 !px-6 text-xs !shadow-none hover:!scale-105">View Journey</button>
                </div>

                <div className="absolute inset-0 scale-[0.3] origin-top-left" style={{ width: '333%', height: '333%' }}>
                    {renderCertificateContent()}
                </div>

                {isLocked && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm p-6 text-center">
                        <Lock className="text-white mb-4" size={40} />
                        <h5 className="text-white font-bold text-lg mb-1 uppercase tracking-widest">{tier} Artifact</h5>
                        <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">{activitySummary}</p>
                    </div>
                )}
            </motion.div>

            {/* Fullscreen Cinematic Experience */}
            <AnimatePresence>
                {isPreviewOpen && (
                    <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center overflow-y-auto p-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 50 }}
                            className="relative w-full max-w-[1123px] my-auto"
                        >
                            <button onClick={() => setIsPreviewOpen(false)} className="absolute -top-16 right-0 p-4 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                                <X size={32} />
                            </button>

                            <div className="bg-white rounded-[2rem] shadow-[0_100px_200px_rgba(0,0,0,0.8)] overflow-hidden">
                                <div ref={certificateRef}>
                                    {renderCertificateContent()}
                                </div>
                            </div>

                            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                                <div className="text-left space-y-2">
                                    <p className="text-white/20 font-heading font-bold text-[10px] uppercase tracking-[0.3em]">Integrity Protocol v4.0</p>
                                    <p className="text-white/40 font-mono text-[10px] leading-relaxed break-all">HASH_AUTH::{Math.random().toString(36).substring(2, 64).toUpperCase()}</p>
                                </div>
                                <div className="flex justify-center gap-6">
                                    <button onClick={handleDownloadPDF} className="btn-primary !px-12 !py-6 shadow-[0_20px_40px_rgba(46,92,255,0.4)] scale-110 active:scale-100">
                                        <Download className="inline mr-2" /> Download Ultra-HD
                                    </button>
                                </div>
                                <div className="flex justify-end gap-4">
                                    <button onClick={handleShare} className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                                        <Share2 size={24} />
                                    </button>
                                    <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                                        <QrCode size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 text-center">
                                <p className="text-white/20 font-heading font-bold text-[10px] uppercase tracking-[0.5em]">Global Social Impact Registry • Secured on Blockchain</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TieredCertificate;
