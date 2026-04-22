import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, Shield, Award, Clock, Camera, User, CheckCircle2, TrendingUp, MapPin, Calendar, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';
import { Badge } from '../components/design-system/Badge';

const HelperProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { helperId } = useParams();

    const [helper, setHelper] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [ratings, setRatings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, ratingsRes] = await Promise.all([
                    api.get(`/ratings/helper/${helperId}/summary`),
                    api.get(`/ratings/helper/${helperId}?limit=10`),
                ]);
                setSummary(summaryRes.data.data);
                setRatings(ratingsRes.data.data.ratings || []);
            } catch { }
            setLoading(false);
        };
        fetchData();
    }, [helperId]);

    const tierConfig: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
        NONE: { color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300', icon: '👤', label: 'Helper' },
        VERIFIED: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-400', icon: '✅', label: 'Verified Helper' },
        PREMIUM: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-400', icon: '🏅', label: 'Premium Helper' },
        ELITE: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-400', icon: '👑', label: 'Elite Helper' },
    };

    const tier = tierConfig[summary?.tier || 'NONE'] || tierConfig.NONE;
    const overall = summary?.overall || 0;
    const count = summary?.count || 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-amber-50/20">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/20 pt-20 pb-12 px-4">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header */}
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><ChevronLeft size={18} /></button>

                {/* Profile card */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center space-y-4">
                    <div className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center ring-4 ${tier.border} ${tier.bg}`}>
                        <span className="text-5xl">{tier.icon}</span>
                    </div>
                    <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${tier.bg} ${tier.color} border ${tier.border}`}>
                            {tier.label}
                        </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-5xl font-black text-amber-600">{overall}</span>
                        <div className="text-left">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={16} className={s <= Math.round(overall) ? 'text-amber-500 fill-amber-500' : 'text-gray-200'} />
                                ))}
                            </div>
                            <p className="text-xs text-gray-400">{count} reviews</p>
                        </div>
                    </div>
                </motion.div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'On-Time', value: `${summary?.onTimePercentage || 0}%`, icon: Clock },
                        { label: 'Reviews', value: count, icon: Star },
                        { label: 'Rating', value: overall, icon: TrendingUp },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                            <stat.icon size={18} className="text-amber-500 mx-auto mb-1" />
                            <p className="text-lg font-black text-gray-800">{stat.value}</p>
                            <p className="text-xs text-gray-400">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Detailed scores */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Detailed Ratings</h3>
                    {[
                        { label: 'Punctuality', value: summary?.averages?.punctuality || 0, weight: '25%', icon: Clock },
                        { label: 'Photo Quality', value: summary?.averages?.photoQuality || 0, weight: '30%', icon: Camera },
                        { label: 'Professionalism', value: summary?.averages?.professionalism || 0, weight: '20%', icon: User },
                        { label: 'Accuracy', value: summary?.averages?.accuracy || 0, weight: '25%', icon: Award },
                    ].map((item, i) => (
                        <div key={i} className="space-y-1">
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center gap-2 text-gray-700 font-medium">
                                    <item.icon size={14} className="text-gray-400" /> {item.label}
                                    <span className="text-xs text-gray-300">({item.weight})</span>
                                </span>
                                <span className="font-black text-gray-800">{item.value}/5</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.value / 5) * 100}%` }}
                                    transition={{ delay: i * 0.1, duration: 0.6 }}
                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Verified Credentials */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] italic">Verified Credentials</h3>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black uppercase tracking-widest">Registry Authenticated</Badge>
                    </div>

                    <div className="flex items-center gap-6 p-4 rounded-3xl bg-gray-50/50 border border-gray-100">
                        <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-sm transition-all duration-500", tier.bg, tier.border)}>
                            <span className="text-4xl">{tier.icon}</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-lg font-black tracking-tight text-gray-900 italic uppercase">{tier.label}</h4>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Authorized Social Guardian</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <div className="group relative p-5 rounded-2xl bg-gray-950 text-white overflow-hidden cursor-pointer active:scale-95 transition-all">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="relative flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Official Document</p>
                                    <h5 className="text-base font-black italic tracking-tighter uppercase">{tier.label?.split(' ')[0]} Certificate</h5>
                                </div>
                                <Award size={24} className="text-amber-500" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-white/30 font-mono tracking-widest uppercase">ID: SK-CERT-{helperId?.slice(-6).toUpperCase()}</span>
                                <div className="flex items-center gap-2 text-xs font-black text-amber-500 group-hover:translate-x-1 transition-transform">
                                    VIEW <ChevronRight size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed scores */}

                {/* Recent reviews */}
                <div className="space-y-3">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Recent Reviews</h3>
                    {ratings.length > 0 ? ratings.map((r: any, i: number) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{r.ratedBy?.profile?.fullName || 'Donor'}</p>
                                    <div className="flex gap-0.5 mt-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} size={12} className={s <= Math.round(r.weightedScore) ? 'text-amber-500 fill-amber-500' : 'text-gray-200'} />
                                        ))}
                                        <span className="text-xs text-gray-400 ml-1">{r.weightedScore}</span>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                            {r.comment && <p className="text-sm text-gray-600 italic">"{r.comment}"</p>}
                        </motion.div>
                    )) : (
                        <div className="bg-gray-50 rounded-xl p-6 text-center">
                            <p className="text-sm text-gray-400">No reviews yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelperProfilePage;
