import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Award, Crown, Lock, CheckCircle2, XCircle, ChevronRight, Star, Clock, TrendingUp, CreditCard, Zap } from 'lucide-react';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/cn';

const HelperCertificationPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useNotifications();
    const { user } = useAuth();

    const [cert, setCert] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [eligibility, setEligibility] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/certification/status');
                setCert(res.data.data.certification);
                setStats(res.data.data.stats);
                setEligibility(res.data.data.eligibility);
            } catch { showToast('Failed to load certification data', 'warning'); }
            setLoading(false);
        };
        fetchData();
    }, [showToast]);

    const applyForTier = async (tier: string) => {
        setApplying(tier);
        try {
            await api.post(`/certification/apply/${tier}`);
            showToast(`Upgraded to ${tier}! 🎉`, 'success');
            const res = await api.get('/certification/status');
            setCert(res.data.data.certification);
            setStats(res.data.data.stats);
            setEligibility(res.data.data.eligibility);
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Application failed', 'warning');
        }
        setApplying(null);
    };

    const tiers = [
        {
            id: 'VERIFIED',
            label: 'Verified Helper',
            icon: Shield,
            emoji: '✅',
            gradient: 'from-emerald-500 to-emerald-400',
            lightBg: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            textColor: 'text-emerald-700',
            benefits: ['Blue verification badge', 'Priority task assignment', 'Basic analytics dashboard'],
            price: 'FREE',
        },
        {
            id: 'PREMIUM',
            label: 'Premium Helper',
            icon: Award,
            emoji: '🏅',
            gradient: 'from-amber-500 to-amber-400',
            lightBg: 'bg-amber-50',
            borderColor: 'border-amber-200',
            textColor: 'text-amber-700',
            benefits: ['Gold premium badge', '2x payment multiplier', 'Training & certification', 'Priority support', 'Analytics suite'],
            price: '₹499/mo',
        },
        {
            id: 'ELITE',
            label: 'Elite Helper',
            icon: Crown,
            emoji: '👑',
            gradient: 'from-purple-500 to-purple-400',
            lightBg: 'bg-purple-50',
            borderColor: 'border-purple-200',
            textColor: 'text-purple-700',
            benefits: ['Diamond elite badge', '3x payment multiplier', 'First access to all tasks', 'Personal account manager', 'Revenue sharing', 'Platform advisory role'],
            price: '₹999/mo',
        },
    ];

    const currentTierIdx = ['NONE', 'VERIFIED', 'PREMIUM', 'ELITE'].indexOf(cert?.currentTier || 'NONE');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50/20">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-24 pb-20 px-6">
            <div className="max-w-xl mx-auto space-y-10">
                {/* Elite Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter text-gray-900 italic">Prestige <span className="text-amber-500">Protocol</span></h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em]">Operational Tier Management</p>
                    </div>
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                </div>

                {/* Status Dashboard */}
                <div className="bg-gray-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-gray-200">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        {/* Current Badge */}
                        <div className="w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center relative group">
                            <span className="text-6xl group-hover:scale-110 transition-transform duration-500">{currentTierIdx > 0 ? tiers[currentTierIdx - 1].emoji : '👤'}</span>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-gray-950">
                                <CheckCircle2 size={14} className="text-white" />
                            </div>
                        </div>

                        {/* Current Stats */}
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Active Status</p>
                                <h2 className="text-2xl font-black tracking-tight italic">
                                    {currentTierIdx > 0 ? tiers[currentTierIdx - 1].label : 'Unverified Citizen'}
                                </h2>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-6">
                                <div>
                                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Efficiency</p>
                                    <p className="text-lg font-black tracking-tighter">{stats?.completionRate || 0}%</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Authority</p>
                                    <p className="text-lg font-black tracking-tighter">{stats?.avgRating || 0}/5.0</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Impact</p>
                                    <p className="text-lg font-black tracking-tighter">{stats?.completedTasks || 0} Acts</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prestigious Tiers */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={16} className="text-amber-500" /> Progression Tiers
                        </h3>
                    </div>

                    {tiers.map((tier, idx) => {
                        const tierIdx = idx + 1;
                        const isCurrentTier = tierIdx === currentTierIdx;
                        const isUnlocked = tierIdx <= currentTierIdx;
                        const isNextTier = tierIdx === currentTierIdx + 1;
                        const elig = (eligibility as any)?.[tier.id.toLowerCase()];
                        const isEligible = elig?.eligible;

                        return (
                            <motion.div
                                key={tier.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={cn(
                                    "relative rounded-[2rem] border-2 p-1 transition-all duration-500",
                                    isCurrentTier ? "border-amber-500 shadow-xl shadow-amber-50" : isUnlocked ? "border-gray-100" : "border-gray-50 opacity-60 grayscale"
                                )}
                            >
                                <div className="p-6 flex flex-col md:flex-row items-center gap-8">
                                    {/* Icon Box */}
                                    <div className={cn(
                                        "w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500",
                                        isUnlocked ? `bg-gradient-to-br ${tier.gradient} border-white shadow-lg` : "bg-gray-50 border-gray-100"
                                    )}>
                                        {isUnlocked ? <tier.icon size={32} className="text-white" /> : <Lock size={28} className="text-gray-200" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-4 text-center md:text-left">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                                    <h4 className="text-lg font-black tracking-tight text-gray-900">{tier.label}</h4>
                                                    {isUnlocked && <CheckCircle2 size={16} className="text-emerald-500" />}
                                                </div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{tier.price} Membership</p>
                                            </div>

                                            {isNextTier && (
                                                <div className="px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                                    Next Milestone
                                                </div>
                                            )}
                                        </div>

                                        {/* Benefits Chips */}
                                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                            {tier.benefits.map((benefit, bIdx) => (
                                                <div key={bIdx} className={cn(
                                                    "px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-colors duration-300",
                                                    isUnlocked ? `${tier.lightBg} ${tier.borderColor} ${tier.textColor}` : "bg-gray-50 border-gray-100 text-gray-400"
                                                )}>
                                                    {benefit}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Progress Requirements */}
                                        {isNextTier && elig?.requirements && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                                                {Object.entries(elig.requirements).map(([key, req]: [string, any]) => (
                                                    <div key={key} className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn("text-xs font-black", req.met ? "text-emerald-600" : "text-gray-400")}>
                                                                {req.current}/{req.required}
                                                            </span>
                                                            {req.met ? <CheckCircle2 size={12} className="text-emerald-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Box */}
                                    <div className="w-full md:w-auto shrink-0">
                                        {isNextTier && (
                                            <button
                                                onClick={() => isEligible && applyForTier(tier.id)}
                                                disabled={!isEligible || applying === tier.id}
                                                className={cn(
                                                    "w-full md:w-40 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl",
                                                    isEligible
                                                        ? `bg-gray-950 text-white hover:scale-105 active:scale-95 hover:shadow-2xl`
                                                        : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                                )}
                                            >
                                                {applying === tier.id ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                                ) : isEligible ? (
                                                    "Execute Upgrade"
                                                ) : (
                                                    "Tier Locked"
                                                )}
                                            </button>
                                        )}
                                        {isCurrentTier && (
                                            <div className={cn("w-full md:w-40 h-14 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest border", tier.lightBg, tier.borderColor, tier.textColor)}>
                                                Active Tier
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer Assurance */}
                <div className="p-8 rounded-[2rem] bg-amber-50/30 border border-amber-100 text-center space-y-2">
                    <Award size={24} className="text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-black text-gray-900 italic">Sincerity Reputation Governance</p>
                    <p className="text-[10px] text-amber-700/60 leading-relaxed font-bold uppercase tracking-wider">
                        Higher tiers provide authority to verify critical life-saving tasks and access exclusive impact zones.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HelperCertificationPage;
