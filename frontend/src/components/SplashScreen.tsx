import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Assets
import logo4k from '../assets/logo_4k.png';
import kindness1 from '../assets/kindness_1.png';
import kindness2 from '../assets/kindness_2.png';

interface SplashScreenProps {
    onComplete: () => void;
}

const appleEase = [0.25, 0.1, 0.25, 1] as const;
const springEase = [0.16, 1, 0.3, 1] as const;

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [phase, setPhase] = useState<'intro' | 'reveal' | 'ready'>('intro');
    const [montageIndex, setMontageIndex] = useState(0);

    const montageImages = [
        kindness1,
        kindness2,
        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=2670&auto=format&fit=crop"
    ];

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase('reveal'), 1500),
            setTimeout(() => setPhase('ready'), 3200),
            setTimeout(() => onComplete(), 5200),
        ];

        const montageTimer = setInterval(() => {
            setMontageIndex(prev => (prev + 1) % montageImages.length);
        }, 2000);

        return () => {
            timers.forEach(clearTimeout);
            clearInterval(montageTimer);
        };
    }, [onComplete]);

    // Particle system
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: any[] = [];
        const particleCount = 400;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            x: number; y: number; vx: number; vy: number;
            size: number; color: string; alpha: number; life: number;

            constructor() {
                this.x = Math.random() * window.innerWidth;
                this.y = Math.random() * window.innerHeight;
                this.vx = (Math.random() - 0.5) * 1.2;
                this.vy = (Math.random() - 0.5) * 1.2;
                this.size = Math.random() * 2 + 0.5;
                this.color = Math.random() > 0.5 ? '#0071E3' : '#FF9F0A';
                this.alpha = 0;
                this.life = 0;
            }

            update(targetPhase: string) {
                this.life++;
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;

                if (targetPhase === 'intro') {
                    this.alpha = Math.min(0.5, this.life / 80);
                    this.x += this.vx;
                    this.y += this.vy;
                } else if (targetPhase === 'reveal') {
                    const dx = centerX - this.x;
                    const dy = centerY - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                    this.vx += (dx / dist) * 1.0;
                    this.vy += (dy / dist) * 1.0;
                    this.alpha = 0.8;

                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.92;
                    this.vy *= 0.92;
                } else {
                    const angle = Math.atan2(this.y - centerY, this.x - centerX);
                    this.vx += Math.cos(angle) * 1.2;
                    this.vy += Math.sin(angle) * 1.2;
                    this.x += this.vx;
                    this.y += this.vy;
                    this.alpha *= 0.94;
                }
            }

            draw() {
                if (this.alpha <= 0.03) return;
                ctx!.globalAlpha = this.alpha;
                ctx!.fillStyle = this.color;
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx!.fill();
            }
        }

        const init = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            const isLight = phase === 'reveal' || phase === 'ready';
            ctx.fillStyle = isLight ? 'rgba(248, 249, 250, 0.15)' : 'rgba(10, 14, 26, 0.15)';
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

            particles.forEach(p => {
                p.update(phase);
                p.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        init();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [phase]);

    const isLightPhase = phase === 'reveal' || phase === 'ready';

    return (
        <div className={`fixed inset-0 z-[100] transition-colors duration-[1200ms] overflow-hidden flex flex-col items-center justify-center ${isLightPhase ? 'bg-background' : 'bg-[#0A0E1A]'}`}>

            {/* Background Montage */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={montageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isLightPhase ? 0.06 : 0.12 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0"
                    >
                        <img
                            src={montageImages[montageIndex]}
                            alt="Humanity"
                            className="w-full h-full object-cover filter grayscale brightness-75"
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Ambient glow */}
            <div className={`absolute inset-0 z-[5] transition-opacity duration-1000 ${isLightPhase ? 'opacity-15' : 'opacity-30'}`}>
                <div className="absolute top-[20%] left-[10%] w-[80vw] h-[80vw] bg-accent/10 blur-[150px] rounded-full animate-gentle-pulse" />
                <div className="absolute bottom-[20%] right-[10%] w-[60vw] h-[60vw] bg-warning/5 blur-[150px] rounded-full animate-gentle-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Particle Layer */}
            <canvas ref={canvasRef} className="absolute inset-0 z-10" />

            {/* Film grain */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className={`absolute inset-0 pointer-events-none z-50 transition-all duration-1000 ${isLightPhase ? 'shadow-[inset_0_0_8vw_rgba(0,0,0,0.03)]' : 'shadow-[inset_0_0_15vw_rgba(0,0,0,0.8)]'}`} />

            {/* Content */}
            <div className="relative z-30 flex flex-col items-center gap-10 max-w-3xl text-center px-8">

                {/* Phase 1: Intro Words */}
                <AnimatePresence>
                    {phase === 'intro' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.8 }}
                            className="space-y-3"
                        >
                            <p className="text-white/30 text-[13px] tracking-[0.5em] uppercase font-light">
                                In a world that needs kindness
                            </p>
                            <h2 className="text-white text-[24px] font-serif italic tracking-wide animate-gentle-pulse">
                                Every small act matters...
                            </h2>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Phase 2 & 3: Logo Reveal */}
                <AnimatePresence>
                    {(phase === 'reveal' || phase === 'ready') && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.2, ease: springEase }}
                            className="flex flex-col items-center gap-8"
                        >
                            <div className="relative">
                                <motion.div
                                    className="h-[300px] md:h-[400px] w-auto relative"
                                    animate={phase === 'ready' ? { scale: [1, 1.02, 1] } : {}}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <TransparentImage
                                        src={logo4k}
                                        className="h-full w-auto object-contain drop-shadow-[0_0_60px_rgba(0,113,227,0.15)]"
                                    />
                                </motion.div>

                                {/* Shine effect */}
                                {phase === 'ready' && (
                                    <motion.div
                                        initial={{ x: '-100%', opacity: 0 }}
                                        animate={{ x: '300%', opacity: 0.5 }}
                                        transition={{ duration: 1.8, ease: "easeInOut" }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[45deg] blur-sm z-10"
                                    />
                                )}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 1 }}
                                className="space-y-2"
                            >
                                <p className="text-accent/40 text-[12px] font-medium tracking-[0.4em] uppercase">
                                    Transparent Impact Platform
                                </p>
                                <h1 className="text-primary-text text-[32px] md:text-[44px] font-bold tracking-tight leading-tight">
                                    Where kindness{' '}
                                    <span className="text-accent italic font-serif">meets</span>{' '}
                                    trust.
                                </h1>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Shockwave on reveal */}
            {phase === 'reveal' && (
                <motion.div
                    initial={{ scale: 0, opacity: 0.6 }}
                    animate={{ scale: 8, opacity: 0 }}
                    transition={{ duration: 1.8, ease: "easeOut" }}
                    className="absolute z-40 w-48 h-48 border border-accent/20 rounded-full"
                />
            )}
        </div>
    );
};

// ─── Transparent Image Helper ───
const TransparentImage: React.FC<{ src: string; className?: string }> = ({ src, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const image = new Image();
        image.src = src;
        image.crossOrigin = "anonymous";
        image.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const dpr = window.devicePixelRatio || 1;
            canvas.width = image.width * dpr;
            canvas.height = image.height * dpr;

            ctx.scale(dpr, dpr);
            ctx.drawImage(image, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                if (r > 245 && g > 245 && b > 245) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);
        };
    }, [src]);

    return <canvas ref={canvasRef} className={className} style={{ pointerEvents: 'none' }} />;
};

export default SplashScreen;
