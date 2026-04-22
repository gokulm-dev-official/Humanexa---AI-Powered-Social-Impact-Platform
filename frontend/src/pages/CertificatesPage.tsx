
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { PremiumCertificate } from '../components/certificates';
import { CertificateTemplate, CertificateTier } from '../components/Certificate';
import {
    Search, ChevronDown, CheckCircle2, Star, Award,
    Trophy, Sparkles, MapPin, Share2, Download, Lock,
    Shield, TrendingUp, Gem
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { cn } from '../utils/cn';

// Categories for filtering
const CATEGORIES = [
    { id: 'all', label: 'All', icon: Award },
    { id: 'journey', label: 'Journey', icon: TrendingUp },
    { id: 'daily', label: 'Daily', icon: Star, isNew: true },
    { id: 'streak', label: 'Streak', icon: Sparkles },
    { id: 'legacy', label: 'Legacy', icon: Gem },
];

const TIER_CONFIG = [
    { key: 'welcome', label: 'Welcome', color: '#0071E3', icon: '🌱' },
    { key: 'bronze', label: 'Bronze', color: '#A77C52', icon: '🥉' },
    { key: 'silver', label: 'Silver', color: '#8E9196', icon: '🥈' },
    { key: 'gold', label: 'Gold', color: '#D4AF37', icon: '🥇' },
    { key: 'platinum', label: 'Platinum', color: '#7C878E', icon: '💎' },
    { key: 'diamond', label: 'Diamond', color: '#00BFFF', icon: '✨' },
];

const CertificatesPage: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dailyLeaderboard, setDailyLeaderboard] = useState<{ dailyDonors: any[], dailyHelpers: any[] }>({ dailyDonors: [], dailyHelpers: [] });

    useEffect(() => {
        refreshUser();
        api.get('/admin/leaderboard').then(res => {
            if (res.data?.data) setDailyLeaderboard(res.data.data);
        }).catch(err => console.error('Failed to fetch leaderboard', err));
    }, []);

    // User Stats
    const totalPoints = user?.creditScore?.totalPoints || 0;
    const totalActs = user?.statistics?.totalHelps || 0;
    const currentStreak = user?.creditScore?.streak?.current || 0;
    const userName = user?.profile?.fullName || "Verified Citizen";

    const dailyDonors = dailyLeaderboard?.dailyDonors || [];
    const dailyHelpers = dailyLeaderboard?.dailyHelpers || [];
    const isTopDonor = dailyDonors.length > 0 && dailyDonors[0].email?.toLowerCase() === user?.email?.toLowerCase();
    const isTopHelper = dailyHelpers.length > 0 && dailyHelpers[0].email?.toLowerCase() === user?.email?.toLowerCase();

    // Define all certificates
    const certificates = useMemo(() => {
        return [
            {
                id: 'SK-JOURNEY-W',
                template: 'journey',
                tier: 'welcome',
                description: 'The Courage to Care. Your first step into verified humanity.',
                progress: Math.min(totalActs, 1),
                totalRequired: 1,
                isLocked: totalActs < 1,
                date: 'Feb 2, 2026',
                unlockedOn: totalActs >= 1 ? 'Jan 10, 2026' : undefined,
                metrics: { activities: totalActs, points: totalPoints }
            },
            {
                id: 'SK-JOURNEY-B',
                template: 'journey',
                tier: 'bronze',
                description: 'Kindness with Intention. Building a foundation of care.',
                progress: Math.min(totalActs, 5),
                totalRequired: 5,
                isLocked: totalActs < 5,
                date: 'Feb 2, 2026',
                metrics: { activities: totalActs, points: totalPoints }
            },
            {
                id: 'SK-JOURNEY-S',
                template: 'journey',
                tier: 'silver',
                description: 'Reliability of the Heart. Consistent impact verified.',
                progress: Math.min(totalActs, 25),
                totalRequired: 25,
                isLocked: totalActs < 25,
                date: 'Feb 2, 2026',
                metrics: { activities: totalActs, points: totalPoints }
            },
            {
                id: 'SK-JOURNEY-G',
                template: 'journey',
                tier: 'gold',
                description: 'Leadership Through Humanity. A beacon of hope.',
                progress: Math.min(totalActs, 50),
                totalRequired: 50,
                isLocked: totalActs < 50,
                date: 'Feb 2, 2026',
                metrics: { activities: totalActs, points: totalPoints }
            },
            {
                id: 'SK-JOURNEY-P',
                template: 'journey',
                tier: 'platinum',
                description: 'Bearer of Hope. Distinguished service to humanity.',
                progress: Math.min(totalActs, 100),
                totalRequired: 100,
                isLocked: totalActs < 100,
                date: 'Feb 2, 2026',
                metrics: { activities: totalActs, points: totalPoints }
            },
            {
                id: 'SK-JOURNEY-D',
                template: 'journey',
                tier: 'diamond',
                description: 'Legacy of Kindness. A lifetime of verified impact.',
                progress: Math.min(totalActs, 500),
                totalRequired: 500,
                isLocked: totalActs < 500,
                date: 'Feb 2, 2026',
                metrics: { activities: totalActs, points: totalPoints }
            },
            // DAILY CHAMPIONS
            {
                id: 'SK-DAILY-TOP',
                template: 'daily',
                tier: 'gold',
                description: 'Daily Champion. Recognized as the top contributor for Feb 2nd.',
                progress: 1,
                totalRequired: 1,
                isLocked: false,
                date: 'Feb 2, 2026',
                metrics: { activities: 12, ranking: '1st' }
            },
            // STREAK MILESTONES
            {
                id: 'SK-STREAK-30',
                template: 'streak',
                tier: 'silver',
                description: '30-Day Continuum. Unbroken dedication to the cause.',
                progress: Math.min(currentStreak, 30),
                totalRequired: 30,
                isLocked: currentStreak < 30,
                date: 'Jan 15, 2026',
                metrics: { streak: currentStreak }
            },
            // ANNUAL LEGACY
            {
                id: 'SK-ANNUAL-2025',
                template: 'legacy',
                tier: 'platinum',
                description: 'The definitive record of impact for the 2025 solar cycle.',
                progress: 1,
                totalRequired: 1,
                isLocked: false,
                date: 'Dec 31, 2025',
                metrics: { activities: 154, points: 5200 }
            }
        ];
    }, [totalActs, totalPoints, isTopDonor, isTopHelper]);

    const filteredCertificates = useMemo(() => {
        return certificates.filter(cert => {
            const matchesTab = activeTab === 'all' || cert.template === activeTab;
            const matchesSearch = cert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cert.tier.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [certificates, activeTab, searchQuery]);

    // Calculate statistics
    const unlockedCount = certificates.filter(c => !c.isLocked).length;
    const currentTier = certificates.map(c => c).reverse().find(c => !c.isLocked)?.tier || 'None';
    const currentTierIndex = TIER_CONFIG.findIndex(t => t.key === currentTier);

    return (
        <div className="min-h-screen bg-[var(--color-bg)] pb-32 relative" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ─── HERO SECTION ─── */}
            <section className="relative pt-28 pb-16 px-6">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                        className="text-center"
                    >
                        {/* Subtle tag */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/[0.06] shadow-xs mb-8">
                            <Shield size={13} className="text-[var(--color-accent)]" />
                            <span className="text-[12px] font-semibold text-[var(--color-secondary)] tracking-wide">Verified Credentials</span>
                        </div>

                        <h1 className="text-[44px] md:text-[56px] font-bold tracking-tight leading-[1.08] text-[var(--color-primary)] mb-4">
                            Your Impact
                            <br />
                            <span className="text-gradient-blue">Portfolio</span>
                        </h1>

                        <p className="text-[17px] text-[var(--color-secondary)] max-w-lg mx-auto leading-relaxed mb-12">
                            A living record of verified compassion and social contribution.
                        </p>
                    </motion.div>

                    {/* ─── Stats Row ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto"
                    >
                        <StatCard label="Current Tier" value={currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} />
                        <StatCard label="Impact Points" value={totalPoints.toLocaleString()} />
                        <StatCard label="Verified Acts" value={totalActs.toLocaleString()} />
                        <StatCard label="Certificates" value={`${unlockedCount}/${certificates.length}`} />
                    </motion.div>
                </div>
            </section>

            {/* ─── TIER PROGRESSION ─── */}
            <section className="py-8 mb-6">
                <div className="max-w-3xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="flex items-center justify-between relative">
                            {/* Progress line background */}
                            <div className="absolute top-5 left-[8%] right-[8%] h-[2px] bg-black/[0.06] rounded-full" />
                            {/* Active progress line */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(0, (currentTierIndex / (TIER_CONFIG.length - 1)) * 84)}%` }}
                                transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
                                className="absolute top-5 left-[8%] h-[2px] bg-[var(--color-accent)] rounded-full"
                            />

                            {TIER_CONFIG.map((tier, idx) => {
                                const isUnlocked = idx <= currentTierIndex;
                                const isCurrent = idx === currentTierIndex;
                                return (
                                    <div key={tier.key} className="flex flex-col items-center gap-2.5 relative z-10">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.4 + idx * 0.08, type: 'spring', stiffness: 300 }}
                                            className={cn(
                                                "w-[38px] h-[38px] rounded-full flex items-center justify-center text-[15px] border-2 transition-all duration-500",
                                                isCurrent
                                                    ? "bg-[var(--color-accent)] border-[var(--color-accent)] shadow-[0_0_0_4px_rgba(0,113,227,0.12)] scale-110"
                                                    : isUnlocked
                                                        ? "bg-white border-[var(--color-accent)] shadow-sm"
                                                        : "bg-white border-black/[0.08]"
                                            )}
                                        >
                                            {isCurrent ? (
                                                <CheckCircle2 size={16} className="text-white" />
                                            ) : isUnlocked ? (
                                                <span className="text-[13px]">{tier.icon}</span>
                                            ) : (
                                                <Lock size={12} className="text-black/20" />
                                            )}
                                        </motion.div>
                                        <span className={cn(
                                            "text-[11px] font-semibold transition-colors duration-300",
                                            isCurrent ? "text-[var(--color-accent)]" : isUnlocked ? "text-[var(--color-primary)]" : "text-black/25"
                                        )}>
                                            {tier.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ─── FILTERS & SEARCH ─── */}
            <div className="max-w-6xl mx-auto px-6 mb-10">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col md:flex-row justify-between items-center gap-4"
                >
                    {/* Category Tabs */}
                    <div className="flex gap-1 p-1 bg-white rounded-2xl border border-black/[0.04] shadow-xs">
                        {CATEGORIES.map(cat => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveTab(cat.id)}
                                    className={cn(
                                        "relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300",
                                        activeTab === cat.id
                                            ? "bg-[var(--color-primary)] text-white shadow-md"
                                            : "text-[var(--color-secondary)] hover:bg-black/[0.03]"
                                    )}
                                >
                                    <Icon size={14} />
                                    {cat.label}
                                    {cat.isNew && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--color-accent)] rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/25" size={16} />
                        <input
                            type="text"
                            placeholder="Search certificates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field w-full md:w-72 !pl-11 !rounded-2xl !border-black/[0.06] !bg-white !shadow-xs"
                        />
                    </div>
                </motion.div>
            </div>

            {/* ─── CERTIFICATE GALLERY ─── */}
            <div className="max-w-6xl mx-auto px-6">
                {filteredCertificates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredCertificates.map((cert, index) => (
                                <motion.div
                                    key={cert.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ delay: index * 0.06, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                                >
                                    <PremiumCertificate
                                        tier={cert.tier as any}
                                        recipientName={userName}
                                        date={cert.date}
                                        metrics={cert.metrics || {}}
                                        isLocked={cert.isLocked}
                                        certificateID={cert.id}
                                        description={cert.description}
                                        progress={cert.progress}
                                        totalRequired={cert.totalRequired}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-32"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-black/[0.03] flex items-center justify-center mx-auto mb-6">
                            <Award className="w-8 h-8 text-black/15" />
                        </div>
                        <h3 className="text-[20px] font-semibold text-[var(--color-primary)] mb-2">No certificates found</h3>
                        <p className="text-[15px] text-[var(--color-secondary)]">Try adjusting your search or filters.</p>
                    </motion.div>
                )}
            </div>

            {/* ─── FOOTER ─── */}
            <div className="mt-32 max-w-5xl mx-auto px-6">
                <div className="border-t border-black/[0.06] pt-12 text-center">
                    <p className="text-[13px] text-[var(--color-secondary)]">
                        Every certificate is blockchain-verified and non-transferable. Your impact is permanent.
                    </p>
                </div>
            </div>
        </div>
    );
};

/* ─── Stat Card Component ─── */
const StatCard = ({ label, value }: { label: string; value: string }) => (
    <div className="stat-card !p-5 text-center">
        <p className="text-[11px] font-semibold text-[var(--color-secondary)] uppercase tracking-wider mb-1.5">{label}</p>
        <p className="text-[22px] font-bold text-[var(--color-primary)] tracking-tight">{value}</p>
    </div>
);

export default CertificatesPage;
