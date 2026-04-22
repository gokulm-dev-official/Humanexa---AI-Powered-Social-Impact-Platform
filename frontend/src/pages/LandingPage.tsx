import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Heart,
    ShieldCheck,
    ArrowRight,
    Zap,
    Award,
    CheckCircle2,
    Camera,
    Globe,
    Star,
    Sparkles,
    Users,
    Lock,
} from 'lucide-react';
import { Button } from '../components/design-system/Button';
import { Card } from '../components/design-system/Card';
import { Badge } from '../components/design-system/Badge';

const appleEase = [0.25, 0.1, 0.25, 1] as const;
const springConfig = { type: 'spring', damping: 25, stiffness: 300 };

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="relative bg-background overflow-hidden">

            {/* ═══════════════════════════════════════════
                HERO SECTION
            ═══════════════════════════════════════════ */}
            <section className="relative min-h-screen flex items-center pt-16 pb-20 px-5 lg:px-8 overflow-hidden">
                {/* Atmospheric Orbs */}
                <div className="orb-blue w-[700px] h-[700px] top-[-15%] left-[5%]" />
                <div className="orb-amber w-[500px] h-[500px] bottom-[10%] right-[5%]" />

                <div className="max-w-6xl mx-auto w-full relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: appleEase }}
                        className="space-y-8"
                    >
                        <Badge variant="accent" size="lg" dot>
                            Verified Impact Platform
                        </Badge>

                        <h1 className="text-[48px] lg:text-[64px] font-bold text-primary-text tracking-tight leading-[1.05]">
                            Every act of{' '}
                            <span className="text-gradient-blue">kindness</span>,{' '}
                            <br className="hidden md:block" />
                            verified with{' '}
                            <span className="italic font-serif">trust</span>
                        </h1>

                        <p className="text-[17px] text-secondary-text max-w-lg leading-[1.6]">
                            Social Kind is a transparent platform where donations reach the right people, 
                            verified by AI and tracked in real-time. No leakage, no guesswork — just genuine human impact.
                        </p>

                        <div className="flex flex-wrap gap-3 pt-2">
                            <Button
                                onClick={() => navigate('/register')}
                                size="lg"
                                className="px-8 shadow-md hover:shadow-lg"
                                rightIcon={<ArrowRight size={18} />}
                            >
                                Get Started Free
                            </Button>
                            <Button
                                onClick={() => navigate('/live-impact')}
                                variant="secondary"
                                size="lg"
                                className="px-8"
                            >
                                See Live Impact
                            </Button>
                        </div>

                        {/* Trust Metrics */}
                        <div className="flex items-center gap-8 pt-6 border-t border-black/[0.06] w-fit">
                            <div className="flex flex-col">
                                <span className="text-[28px] font-bold text-primary-text tracking-tight">100K+</span>
                                <span className="text-[12px] text-secondary-text font-medium">Active Users</span>
                            </div>
                            <div className="w-px h-10 bg-black/[0.06]" />
                            <div className="flex flex-col">
                                <span className="text-[28px] font-bold text-primary-text tracking-tight">₹1.2Cr</span>
                                <span className="text-[12px] text-secondary-text font-medium">Verified Donations</span>
                            </div>
                            <div className="w-px h-10 bg-black/[0.06]" />
                            <div className="flex flex-col">
                                <span className="text-[28px] font-bold text-primary-text tracking-tight">99.8%</span>
                                <span className="text-[12px] text-secondary-text font-medium">Delivery Rate</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Visual Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: appleEase, delay: 0.15 }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative z-10 w-full aspect-[4/5] max-w-[480px] mx-auto bg-white rounded-3xl border border-black/[0.04] shadow-soft-xl overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center transition-transform duration-[3s] ease-apple group-hover:scale-[1.04]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                            {/* Overlay Content */}
                            <div className="absolute bottom-8 left-8 right-8 space-y-3">
                                <Badge variant="success" size="md" dot className="backdrop-blur-md bg-success/20 border-white/10 text-white">
                                    Impact Verified
                                </Badge>
                                <h3 className="text-[28px] font-bold text-white tracking-tight leading-tight">
                                    Real people,<br />real impact
                                </h3>
                                <p className="text-white/50 text-[13px] font-medium">
                                    ₹25,000 donation delivered and verified just now
                                </p>
                            </div>

                            {/* Floating Card: Verified */}
                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-8 -right-4 bg-white/90 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-soft-lg border border-black/[0.04] flex items-center gap-3"
                            >
                                <div className="w-9 h-9 bg-success/10 rounded-xl flex items-center justify-center text-success">
                                    <CheckCircle2 size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-secondary-text font-medium">Status</p>
                                    <p className="text-[13px] font-semibold text-primary-text">Verified ✓</p>
                                </div>
                            </motion.div>

                            {/* Floating Card: Rank */}
                            <motion.div
                                animate={{ y: [0, 8, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -bottom-4 -left-4 bg-surface-dark px-5 py-4 rounded-2xl shadow-soft-xl flex items-center gap-3"
                            >
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-400">
                                    <Star size={20} fill="currentColor" />
                                </div>
                                <div className="text-white">
                                    <p className="text-[10px] text-white/40 font-medium">Top Contributor</p>
                                    <p className="text-[15px] font-semibold tracking-tight">Elite Donor</p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                HOW IT WORKS
            ═══════════════════════════════════════════ */}
            <section className="py-28 px-5 lg:px-8 bg-white border-y border-black/[0.04]">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.6, ease: appleEase }}
                        className="text-center mb-16"
                    >
                        <Badge variant="neutral" size="lg" className="mb-4">How It Works</Badge>
                        <h2 className="text-[34px] font-bold text-primary-text tracking-tight mb-3">
                            Built on transparency
                        </h2>
                        <p className="text-[15px] text-secondary-text max-w-lg mx-auto leading-relaxed">
                            Every donation is protected, tracked, and verified — so your kindness always reaches the right person.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Lock size={24} className="text-accent" />}
                            title="Secure Escrow"
                            desc="Your donation is held safely in escrow until the helper provides verified proof of delivery. Zero leakage guaranteed."
                            delay={0}
                        />
                        <FeatureCard
                            icon={<Camera size={24} className="text-success" />}
                            title="AI Verification"
                            desc="Photo proof with GPS location is verified by our AI system in real-time. You see exactly where your money went."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={<Award size={24} className="text-amber-500" />}
                            title="Impact Certificates"
                            desc="Earn beautiful certificates and build your trust score as you contribute. Track your legacy of kindness."
                            delay={0.2}
                        />
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                CTA SECTION
            ═══════════════════════════════════════════ */}
            <section className="py-28 px-5 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.7, ease: appleEase }}
                        className="h-[420px] rounded-3xl bg-surface-dark overflow-hidden relative group"
                    >
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469571486040-0b9b1773d779?auto=format&fit=crop&q=80&w=1600')] bg-cover bg-center opacity-15 grayscale group-hover:opacity-20 group-hover:grayscale-0 transition-all duration-[1.5s] ease-apple" />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/60 to-surface-dark/40" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 z-10">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                                <Heart size={28} fill="currentColor" className="text-danger" />
                            </div>
                            <h2 className="text-[36px] md:text-[44px] font-bold text-white tracking-tight leading-tight mb-4 max-w-2xl">
                                Start making a real<br />difference today
                            </h2>
                            <p className="text-[15px] text-white/40 max-w-md mb-8 leading-relaxed">
                                Join thousands of people creating verified, transparent impact in communities that need it most.
                            </p>
                            <div className="flex gap-4">
                                <Button
                                    onClick={() => navigate('/register')}
                                    size="lg"
                                    className="px-8 bg-white text-surface-dark hover:bg-white/90 border-none shadow-xl"
                                >
                                    Create Account
                                </Button>
                                <Button
                                    onClick={() => navigate('/login')}
                                    variant="secondary"
                                    size="lg"
                                    className="px-8 border-white/15 text-white hover:bg-white/10 bg-transparent"
                                >
                                    Sign In
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════ */}
            <footer className="py-12 px-5 lg:px-8 bg-background">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 border-t border-black/[0.06] pt-12">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-surface-dark text-white rounded-lg flex items-center justify-center text-[13px] font-bold">S</div>
                        <span className="text-[15px] font-semibold text-primary-text tracking-tight">Social Kind</span>
                    </div>
                    <p className="text-[12px] text-secondary-text">
                        © 2026 Social Kind. Transparent AI-Powered Impact Platform.
                    </p>
                    <div className="flex gap-6 text-[12px] font-medium text-secondary-text">
                        <a href="#" className="hover:text-primary-text transition-colors duration-200">Privacy</a>
                        <a href="#" className="hover:text-primary-text transition-colors duration-200">Terms</a>
                        <a href="#" className="hover:text-primary-text transition-colors duration-200">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// ─── Feature Card Component ───
const FeatureCard = ({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay }}
        className="group"
    >
        <div className="space-y-5">
            <div className="w-14 h-14 bg-black/[0.03] rounded-2xl flex items-center justify-center transition-all duration-400 ease-apple group-hover:scale-105 group-hover:bg-white group-hover:shadow-soft-md">
                {icon}
            </div>
            <div className="space-y-2">
                <h3 className="text-[20px] font-semibold text-primary-text tracking-tight">{title}</h3>
                <p className="text-[14px] text-secondary-text leading-[1.6]">{desc}</p>
            </div>
        </div>
    </motion.div>
);

export default LandingPage;
