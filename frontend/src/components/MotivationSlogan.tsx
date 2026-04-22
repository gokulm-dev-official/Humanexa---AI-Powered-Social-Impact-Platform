import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MotivationSloganProps {
    onComplete: () => void;
}

const slogans = [
    { text: "Your kindness can rewrite someone's story today.", emoji: "💫" },
    { text: "A small act of giving creates ripples of hope.", emoji: "🌊" },
    { text: "Be the reason someone believes in humanity.", emoji: "🤝" },
    { text: "Every donation plants a seed of change.", emoji: "🌱" },
    { text: "Together, we turn compassion into action.", emoji: "❤️‍🔥" },
    { text: "One drop of kindness can fill an ocean of need.", emoji: "🩸" },
    { text: "The world changes when you choose to care.", emoji: "✨" },
    { text: "Help today, inspire forever.", emoji: "🕊️" },
];

const MotivationSlogan: React.FC<MotivationSloganProps> = ({ onComplete }) => {
    const [slogan] = useState(() => slogans[Math.floor(Math.random() * slogans.length)]);
    const [wordIndex, setWordIndex] = useState(-1);

    const words = slogan.text.split(' ');

    useEffect(() => {
        // Animate words one by one
        const interval = setInterval(() => {
            setWordIndex(prev => {
                if (prev >= words.length - 1) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 1;
            });
        }, 180);

        // Complete after 3.5 seconds
        const timer = setTimeout(() => onComplete(), 3500);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [onComplete, words.length]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#0d1117] to-[#0a0a1a] overflow-hidden"
        >
            {/* Ambient gradient orbs */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.15, 0.08] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-1/4 left-1/4 w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[120px]"
                />
                <motion.div
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.12, 0.05] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] rounded-full bg-amber-500/10 blur-[120px]"
                />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0">
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                            opacity: 0
                        }}
                        animate={{
                            y: [null, Math.random() * -200],
                            opacity: [0, 0.4, 0],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                        className="absolute w-1 h-1 rounded-full bg-white/30"
                    />
                ))}
            </div>

            {/* Main content */}
            <div className="relative z-10 max-w-2xl mx-auto px-8 text-center">
                {/* Emoji */}
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                    className="text-5xl md:text-6xl mb-8"
                >
                    {slogan.emoji}
                </motion.div>

                {/* Words animated one by one */}
                <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-1">
                    {words.map((word, i) => (
                        <motion.span
                            key={i}
                            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                            animate={i <= wordIndex ? {
                                opacity: 1,
                                y: 0,
                                filter: 'blur(0px)',
                            } : {}}
                            transition={{
                                duration: 0.4,
                                ease: [0.25, 0.1, 0.25, 1],
                            }}
                            className="text-[28px] md:text-[36px] font-bold text-white/90 tracking-tight leading-tight"
                        >
                            {word}
                        </motion.span>
                    ))}
                </div>

                {/* Bottom tagline */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 0.8 }}
                    className="mt-8 text-[13px] text-white/25 tracking-[0.3em] uppercase font-medium"
                >
                    Social Kind • Make an impact today
                </motion.p>

                {/* Progress bar */}
                <motion.div className="mt-6 w-32 h-0.5 bg-white/5 rounded-full mx-auto overflow-hidden">
                    <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3.2, ease: 'linear' }}
                        className="h-full bg-gradient-to-r from-blue-500/60 to-amber-500/60 rounded-full"
                    />
                </motion.div>
            </div>
        </motion.div>
    );
};

export default MotivationSlogan;
