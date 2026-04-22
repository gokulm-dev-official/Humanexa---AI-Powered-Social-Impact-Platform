import React, { useRef, useState } from 'react';
import { Award, Download, Share2, Lock, Heart, ShieldCheck, QrCode, X, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface LegacyCertificateProps {
    type: 'annual_impact' | 'platinum_impact' | 'monthly_excellence' | 'milestone';
    recipientName: string;
    date: string;
    metrics?: {
        activities: number;
        points: number;
        livesImpacted: number;
        assistência?: number;
    };
    description: string;
    isLocked?: boolean;
    tier?: string;
    month?: string;
}

const LegacyCertificate: React.FC<LegacyCertificateProps> = ({
    type,
    recipientName,
    date,
    metrics = { activities: 47, points: 2840, livesImpacted: 127, assistência: 25000 },
    description,
    isLocked = false,
    tier = 'gold',
    month = 'JANUARY'
}) => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const certificateRef = useRef<HTMLDivElement>(null);
    const serialID = `SK-LEGACY-${type.substring(0, 1).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Social Kind Legacy Artifact',
                text: `I just received my ${type.replace('_', ' ')} certificate!`,
                url: window.location.href
            }).catch(console.error);
        } else {
            alert('Link copied to clipboard!');
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const handleDownloadPDF = async () => {
        const element = certificateRef.current;
        if (!element) return;

        const canvas = await html2canvas(element, { scale: 3, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: type === 'monthly_excellence' ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save(`SocialKind_Legacy_${recipientName.replace(/\s+/g, '_')}.pdf`);
    };

    // Premium Wave Pattern Component
    const WavePattern = ({ colors, position = 'top' }: { colors: { primary: string; secondary: string }, position?: 'top' | 'bottom' }) => (
        <svg className={`absolute ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 w-full h-48`} viewBox="0 0 1200 200" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`wave-grad-legacy-${position}-1`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
                    <stop offset="50%" stopColor={colors.secondary} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={colors.primary} stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id={`wave-grad-legacy-${position}-2`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.4" />
                    <stop offset="50%" stopColor={colors.primary} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.4" />
                </linearGradient>
            </defs>
            {position === 'top' ? (
                <>
                    <path d="M0,60 Q300,10 600,60 T1200,60 L1200,0 L0,0 Z" fill={`url(#wave-grad-legacy-${position}-1)`} />
                    <path d="M0,80 Q300,120 600,80 T1200,80 L1200,0 L0,0 Z" fill={`url(#wave-grad-legacy-${position}-2)`} />
                    <path d="M0,100 Q300,60 600,100 T1200,100 L1200,0 L0,0 Z" fill={colors.primary} fillOpacity="0.2" />
                </>
            ) : (
                <>
                    <path d="M0,140 Q300,180 600,140 T1200,140 L1200,200 L0,200 Z" fill={`url(#wave-grad-legacy-${position}-1)`} />
                    <path d="M0,120 Q300,80 600,120 T1200,120 L1200,200 L0,200 Z" fill={colors.secondary} fillOpacity="0.3" />
                    <path d="M0,100 Q300,140 600,100 T1200,100 L1200,200 L0,200 Z" fill={colors.primary} fillOpacity="0.2" />
                </>
            )}
        </svg>
    );

    // Premium Badge Component
    const PremiumBadge = ({ icon: Icon, color }: { icon: any; color: string }) => (
        <div className="absolute top-12 left-12 w-28 h-28">
            <div className="relative w-full h-full">
                <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)` }}></div>
                <div className="absolute inset-2 rounded-full bg-white shadow-xl"></div>
                <div className="absolute inset-4 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}>
                    <Icon className="text-white" size={40} fill="currentColor" />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-16">
                    <div className="w-full h-12" style={{ background: `linear-gradient(to bottom, ${color}, ${color}DD)` }}></div>
                    <div className="flex">
                        <div className="w-1/2 h-0 border-l-6 border-b-8" style={{ borderColor: `transparent transparent ${color}88 transparent` }}></div>
                        <div className="w-1/2 h-0 border-r-6 border-b-8" style={{ borderColor: `transparent transparent ${color}88 transparent` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAnnualImpact = () => (
        <div className="relative w-full h-full bg-gradient-to-br from-[#FFFEF0] via-white to-[#FFF9E8] overflow-hidden"
            style={{ aspectRatio: '1 / 1.414', fontFamily: "'Playfair Display', serif" }}>

            <WavePattern colors={{ primary: '#D4AF37', secondary: '#B8860B' }} position="top" />
            <WavePattern colors={{ primary: '#D4AF37', secondary: '#B8860B' }} position="bottom" />

            <div className="absolute inset-6 border-4 border-[#D4AF37] rounded-lg shadow-inner"></div>
            <div className="absolute inset-8 border border-[#B8860B]/20"></div>

            <PremiumBadge icon={Heart} color="#D4AF37" />

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-16 py-20">
                <div className="text-center mb-10">
                    <p className="text-xs text-slate-400 uppercase tracking-[0.3em] mb-2">Social Kind Foundation</p>
                    <p className="text-[10px] text-slate-500 italic mb-6">In Partnership with Global Trust Registry</p>
                    <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-[0.4em] mb-4">Official Recognition</h3>
                    <h1 className="text-5xl font-black text-[#1A1F3A] uppercase tracking-tight leading-none mb-4">
                        CERTIFICATE<br />OF VERIFIED<br />SOCIAL IMPACT
                    </h1>
                    <div className="relative py-4">
                        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-[#FFFEF0] to-white px-6">
                            <div className="w-14 h-14 rounded-full border-2 border-[#D4AF37] flex items-center justify-center bg-white shadow-lg">
                                <span className="text-sm font-bold text-[#1A1F3A]">2024</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-2xl mb-10">
                    <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-6"></div>
                    <p className="text-center text-lg italic text-slate-500 mb-4">This certifies that</p>
                    <h2 className="text-center text-7xl text-[#1A1F3A] mb-6" style={{ fontFamily: "'Great Vibes', cursive" }}>
                        {recipientName}
                    </h2>
                    <div className="h-2 bg-[#D4AF37] mx-auto w-64 mb-6"></div>
                    <p className="text-center text-sm leading-relaxed text-slate-600 max-w-xl mx-auto">
                        has demonstrated exemplary commitment to social welfare through verified acts of
                        compassion and humanity during the fiscal year 2024, achieving the distinguished rank of{' '}
                        <span className="font-bold text-[#D4AF37] uppercase">{tier} Member</span>.
                    </p>
                </div>

                <div className="w-full max-w-3xl bg-white/60 backdrop-blur-sm border-2 border-[#D4AF37]/20 rounded-2xl p-8 shadow-lg mb-10">
                    <div className="grid grid-cols-3 gap-8 text-center">
                        <div className="border-r border-[#D4AF37]/20">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Verified Activities</p>
                            <p className="text-3xl font-bold text-[#1A1F3A]">{metrics.activities}</p>
                        </div>
                        <div className="border-r border-[#D4AF37]/20">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Credit Points</p>
                            <p className="text-3xl font-bold text-[#1A1F3A]">{metrics.points.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lives Impacted</p>
                            <p className="text-3xl font-bold text-[#2E5CFF]">{metrics.livesImpacted}</p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-16 flex justify-between w-full px-20 items-end">
                    <div className="text-center">
                        <div className="w-40 h-px bg-[#1A1F3A] mb-2"></div>
                        <p className="text-sm font-bold text-[#1A1F3A]">Platform CEO</p>
                        <p className="text-xs text-slate-500">Social Kind Foundation</p>
                    </div>

                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-double border-[#D4AF37] flex items-center justify-center bg-white shadow-2xl animate-spin-slow">
                            <Award className="text-[#D4AF37]" size={40} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <ShieldCheck size={60} className="text-[#D4AF37]" />
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="w-40 h-px bg-[#1A1F3A] mb-2"></div>
                        <p className="text-sm font-bold text-[#1A1F3A]">Verification Node</p>
                        <p className="text-xs text-slate-500">Autonomous AI Audit</p>
                    </div>
                </div>

                <div className="absolute bottom-4 flex justify-between w-full px-8 items-center text-xs text-slate-500/60 font-mono">
                    <p>CERTIFICATE ID: {serialID}</p>
                    <div className="flex flex-col items-center">
                        <QrCode size={40} />
                        <p className="text-[8px] mt-1">SCAN TO VERIFY</p>
                    </div>
                    <p>BLOCKCHAIN SECURED</p>
                </div>
            </div>
        </div>
    );

    const renderMonthlyExcellence = () => (
        <div className="relative w-full h-full bg-gradient-to-br from-[#1A1B1E] via-[#2C2E3A] to-[#1A1B1E] overflow-hidden"
            style={{ aspectRatio: '1.414 / 1' }}>

            <WavePattern colors={{ primary: '#2E5CFF', secondary: '#4A90E2' }} position="top" />
            <WavePattern colors={{ primary: '#2E5CFF', secondary: '#4A90E2' }} position="bottom" />

            {/* Dynamic glow effects */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500 rounded-full blur-3xl"></div>
            </div>

            <div className="absolute inset-8 border-4 border-white/10 rounded-3xl"></div>
            <div className="absolute inset-10 border border-white/5"></div>

            <PremiumBadge icon={Trophy} color="#2E5CFF" />

            <div className="relative z-10 flex flex-col justify-between h-full p-16">
                <header className="flex justify-between items-start">
                    <div>
                        <h2 className="text-9xl font-black text-white/5 absolute top-0 left-8 pointer-events-none">{month}</h2>
                        <h1 className="text-6xl font-black text-white relative z-10 mb-2">Monthly Impact</h1>
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Champion</h1>
                        <div className="mt-4 h-1 w-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    </div>
                    <div className="w-36 h-36 rounded-full bg-gradient-to-br from-white to-blue-100 flex items-center justify-center shadow-2xl transform rotate-12">
                        <Trophy className="text-[#FFD93D]" size={72} />
                    </div>
                </header>

                <div className="flex items-center gap-12">
                    <div className="w-56 h-56 rounded-3xl bg-white/10 backdrop-blur-md border-2 border-white/20 p-3 shadow-2xl">
                        <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent rounded-2xl flex items-center justify-center">
                            <Heart className="text-[#FF6B6B]" size={80} fill="currentColor" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="text-blue-400 font-bold uppercase tracking-widest text-lg mb-4">Presented to</p>
                        <h3 className="text-7xl font-black text-white mb-6 pb-4 border-b-8 border-blue-500 inline-block"
                            style={{ fontFamily: "'Great Vibes', cursive" }}>
                            {recipientName}
                        </h3>
                        <p className="text-white/60 text-xl max-w-2xl leading-relaxed">
                            Celebrating extraordinary consistency and verified impact during the month of{' '}
                            <span className="text-white font-bold">{month} 2024</span>. Your dedication to humanity
                            has created measurable, lasting change.
                        </p>
                    </div>
                </div>

                <footer className="flex justify-between items-end">
                    <div className="flex gap-8">
                        <div className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl p-8 text-center shadow-lg">
                            <p className="text-4xl font-black text-white">{metrics.points}</p>
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-2">Monthly Points</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl p-8 text-center shadow-lg">
                            <p className="text-4xl font-black text-[#51CF66]">{metrics.activities}</p>
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-2">Helps Verified</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl p-8 text-center shadow-lg">
                            <p className="text-4xl font-black text-blue-400">{metrics.livesImpacted}</p>
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-2">Lives Touched</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-mono text-white/20 mb-3">{serialID}</p>
                        <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-sm uppercase tracking-widest shadow-lg">
                            <ShieldCheck size={18} />
                            Official Reward
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );

    return (
        <div className="relative">
            {/* Card Preview */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                onClick={() => setIsPreviewOpen(true)}
                className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] shadow-2xl transition-all duration-700 hover:-translate-y-4 hover:shadow-[0_45px_100px_rgba(0,0,0,0.3)]"
                style={{ aspectRatio: type === 'monthly_excellence' ? '1.414/1' : '1/1.414' }}
            >
                {/* Scaled Preview */}
                <div className="absolute inset-0 scale-[0.35] origin-top-left" style={{ width: '286%', height: '286%' }}>
                    {type === 'annual_impact' ? renderAnnualImpact() : renderMonthlyExcellence()}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#2E5CFF] flex items-center justify-center text-white transform scale-0 group-hover:scale-100 transition-transform delay-100 duration-500">
                            {type === 'annual_impact' ? <Award size={24} /> : <Trophy size={24} />}
                        </div>
                        <h4 className="text-white font-heading font-black text-2xl uppercase tracking-tighter">
                            {type.replace('_', ' ')}
                        </h4>
                    </div>
                    <div className="flex gap-4">
                        <button className="flex-grow btn-primary !py-3 text-sm">View Document</button>
                        <button onClick={(e) => { e.stopPropagation(); handleShare(); }}
                            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>

                {isLocked && (
                    <div className="absolute inset-0 bg-[#1A1B1E]/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-6">
                            <Lock size={40} />
                        </div>
                        <h5 className="text-white font-heading font-bold text-xl mb-2">Honor Restricted</h5>
                        <p className="text-white/40 text-xs uppercase font-bold tracking-[0.2em] mb-8">{description}</p>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#2E5CFF] w-[40%]"></div>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Full Screen Preview */}
            <AnimatePresence>
                {isPreviewOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#1A1B1E] overflow-y-auto p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative w-full max-w-5xl my-auto"
                        >
                            <button
                                onClick={() => setIsPreviewOpen(false)}
                                className="absolute -top-16 right-0 p-4 rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
                            >
                                <X size={32} />
                            </button>

                            <div className="bg-white rounded-[2rem] shadow-[0_80px_160px_rgba(0,0,0,0.8)] overflow-hidden">
                                <div ref={certificateRef}>
                                    {type === 'annual_impact' ? renderAnnualImpact() : renderMonthlyExcellence()}
                                </div>
                            </div>

                            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                                <div className="text-left">
                                    <p className="text-white/30 font-heading font-bold text-xs uppercase tracking-widest mb-2">Integrity Hash</p>
                                    <p className="text-white/60 font-mono text-xs break-all">0x8f3a2b...9d4e1c</p>
                                </div>
                                <div className="flex justify-center gap-6">
                                    <button onClick={handleDownloadPDF} className="btn-primary !px-12 !py-6 shadow-[0_20px_40px_rgba(46,92,255,0.4)] scale-110">
                                        <Download className="inline mr-2" /> Export Artifact
                                    </button>
                                </div>
                                <div className="text-right">
                                    <button onClick={handleShare} className="btn-outline !text-white/60 !border-white/10 hover:!text-white hover:!border-white/40 !px-8 !py-4 text-xs font-bold uppercase tracking-widest">
                                        <Share2 size={16} className="inline mr-2" /> Broadcast
                                    </button>
                                </div>
                            </div>

                            <div className="mt-20 pt-12 border-t border-white/5 flex justify-between items-center text-xs font-heading font-bold text-white/20 uppercase tracking-[0.3em]">
                                <div className="flex items-center gap-4">
                                    <ShieldCheck size={24} />
                                    <span>Immutable Blockchain Record</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span>Verified by AI Audit Protocol v3.2</span>
                                    <Star size={24} className="text-[#2E5CFF]" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LegacyCertificate;
