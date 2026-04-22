import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, Mail, Share2, Lock, Zap, ArrowRight, Clock, ShieldCheck, Eye, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import { useAuth } from '../hooks/useAuth';

const DonationSuccessPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const amount = Number(searchParams.get('amount')) || 0;
    const type = searchParams.get('type') || 'ESCROW';
    const receiptId = searchParams.get('receiptId') || '';
    const institution = searchParams.get('institution') || 'Institution';
    const title = searchParams.get('title') || 'Donation';
    const hash = searchParams.get('hash') || '';

    const isEscrow = type === 'ESCROW';

    // Confetti effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }> = [];
        const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: -Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 6 + 3,
                life: 1,
            });
        }

        let frame = 0;
        const animate = () => {
            if (frame > 180) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05;
                p.life -= 0.004;
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size * 0.6);
            });
            frame++;
            requestAnimationFrame(animate);
        };
        animate();
    }, []);

    const generatePDF = () => {
        try {
            const doc = new jsPDF();
            const pw = doc.internal.pageSize.getWidth();
            
            // Premium Header — Gold gradient bar
            doc.setFillColor(245, 158, 11);
            doc.rect(0, 0, pw, 50, 'F');
            doc.setFillColor(217, 119, 6);
            doc.rect(0, 45, pw, 5, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(26);
            doc.setFont('helvetica', 'bold');
            doc.text('SOCIAL KIND', 20, 22);
            doc.setFontSize(10);
            doc.text('OFFICIAL DONATION RECEIPT', 20, 32);
            doc.setFontSize(8);
            doc.text('Section 80G - Tax Deductible', 20, 40);

            // Receipt ID right-aligned
            doc.setFontSize(9);
            doc.text(`Receipt: ${receiptId || 'N/A'}`, pw - 20, 22, { align: 'right' });
            doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, pw - 20, 30, { align: 'right' });

            let y = 65;
            const addSection = (title: string) => {
                doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(31, 41, 55);
                doc.text(title, 20, y); y += 2;
                doc.setDrawColor(245, 158, 11); doc.setLineWidth(0.5); doc.line(20, y, 80, y); y += 8;
            };
            const addRow = (label: string, value: string) => {
                doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
                doc.text(label, 25, y);
                doc.setFont('helvetica', 'bold'); doc.setTextColor(31, 41, 55);
                doc.text(String(value || 'N/A'), 90, y); y += 7;
            };

            addSection('DONOR DETAILS');
            addRow('Name', user?.profile?.fullName || 'Anonymous');
            addRow('Status', 'Verified Citizen');
            y += 4;

            addSection('DONATION DETAILS');
            addRow('Amount', `Rs. ${amount.toLocaleString('en-IN')}`);
            addRow('Type', isEscrow ? 'Escrow Protected' : 'Direct Transfer');
            addRow('Institution', institution);
            addRow('Purpose', title);
            y += 4;

            // Amount highlight box
            doc.setFillColor(255, 251, 235);
            doc.roundedRect(20, y, pw - 40, 35, 3, 3, 'F');
            doc.setDrawColor(245, 158, 11); doc.setLineWidth(0.3);
            doc.roundedRect(20, y, pw - 40, 35, 3, 3, 'S');
            doc.setFontSize(10); doc.setTextColor(107, 114, 128); doc.setFont('helvetica', 'normal');
            doc.text('TOTAL DONATION AMOUNT', pw / 2, y + 12, { align: 'center' });
            doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.setTextColor(217, 119, 6);
            doc.text(`Rs. ${amount.toLocaleString('en-IN')}`, pw / 2, y + 27, { align: 'center' });
            y += 45;

            // Tax info
            doc.setFontSize(9); doc.setTextColor(107, 114, 128); doc.setFont('helvetica', 'italic');
            doc.text('This donation is eligible for 100% tax deduction under Section 80G of the Income Tax Act, 1961.', pw / 2, y, { align: 'center' });
            y += 6;
            doc.text('This is a computer-generated receipt. No signature required.', pw / 2, y, { align: 'center' });

            // Blockchain Verify (if hash exists)
            if (hash) {
                y += 10;
                doc.setFontSize(7); doc.setTextColor(156, 163, 175); doc.setFont('helvetica', 'normal');
                doc.text(`Blockchain Verification: ${hash}`, pw / 2, y, { align: 'center' });
            }

            // Footer
            doc.setFontSize(10); doc.setTextColor(245, 158, 11); doc.setFont('helvetica', 'bold');
            doc.text('Thank you for making a difference with Social Kind.', pw / 2, 280, { align: 'center' });

            doc.save(`SocialKind_Receipt_${receiptId || 'receipt'}.pdf`);
        } catch (err) {
            console.error('PDF Generation failed:', err);
            alert('Failed to generate receipt PDF. Please try again.');
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: 'I donated on Social Kind!',
                text: `I just donated ₹${amount.toLocaleString()} to "${title}" on Social Kind! Join me in making a difference.`,
                url: window.location.origin,
            });
        }
    };

    const escrowSteps = [
        { icon: Lock, label: 'Funds Locked', desc: 'Secured in escrow vault', done: true },
        { icon: Eye, label: 'Awaiting Proof', desc: 'GPS-verified photos required', done: false },
        { icon: ShieldCheck, label: 'Admin + AI Review', desc: 'Verification check', done: false },
        { icon: Clock, label: '7-Day Review', desc: 'Your review period', done: false },
        { icon: CheckCircle2, label: 'Funds Released', desc: 'To institution', done: false },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
            <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />

            <div className="pt-24 pb-12 px-4 max-w-lg mx-auto relative z-10">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="text-center space-y-6"
                >
                    {/* Animated checkmark */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                        className="w-28 h-28 rounded-full mx-auto flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                    >
                        <CheckCircle2 size={56} className="text-white" />
                    </motion.div>

                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Donation Successful! 🎉</h1>
                        <p className="text-gray-500 text-sm mt-2">
                            Your {isEscrow ? 'escrow protected' : 'direct'} donation has been processed
                        </p>
                    </div>

                    {/* Amount card */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-6 border border-amber-200"
                    >
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Amount Donated</p>
                        <p className="text-4xl font-black text-amber-600 mt-1">₹{amount.toLocaleString()}</p>
                        <p className="text-sm text-amber-700/70 mt-1">{institution} — {title}</p>
                    </motion.div>

                    {/* Escrow timeline */}
                    {isEscrow && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="bg-white rounded-2xl border border-emerald-200 p-5 text-left"
                        >
                            <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Lock size={14} /> Escrow Timeline
                            </h3>
                            <div className="space-y-3">
                                {escrowSteps.map((step, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                            <step.icon size={14} className={step.done ? 'text-white' : 'text-gray-400'} />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold ${step.done ? 'text-emerald-700' : 'text-gray-500'}`}>{step.label}</p>
                                            <p className="text-xs text-gray-400">{step.desc}</p>
                                        </div>
                                        {i < escrowSteps.length - 1 && (
                                            <div className={`absolute left-[35px] mt-8 w-0.5 h-5 ${step.done ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Tax benefits */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-left"
                    >
                        <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2">💰 Tax Benefits</h3>
                        <p className="text-sm text-amber-800">
                            This donation is eligible for <strong>100% tax deduction</strong> under Section 80G of the Income Tax Act, 1961.
                        </p>
                        <p className="text-xs text-amber-600 mt-1">Deductible amount: ₹{amount.toLocaleString()}</p>
                    </motion.div>

                    {/* Receipt details */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="bg-white rounded-xl border border-gray-200 p-5 text-left space-y-2"
                    >
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Receipt Details</h3>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Receipt ID</span><span className="font-bold text-gray-800">{receiptId}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-bold text-gray-800">{isEscrow ? '🔒 Escrow' : '⚡ Direct'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-bold text-gray-800">{new Date().toLocaleDateString()}</span></div>
                            {hash && <div className="flex justify-between"><span className="text-gray-500">Verification</span><span className="font-mono text-xs text-gray-600">{hash}</span></div>}
                        </div>
                    </motion.div>

                    {/* Action buttons */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.3 }}
                        className="space-y-3"
                    >
                        <div className="flex gap-3">
                            <button onClick={generatePDF} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-200 hover:shadow-xl transition-all">
                                <Download size={16} /> Download PDF
                            </button>
                            <button onClick={handleShare} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:shadow-xl transition-all">
                                <Share2 size={16} /> Share
                            </button>
                        </div>
                        <button onClick={() => navigate('/dashboard')} className="w-full h-11 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                            Back to Dashboard <ArrowRight size={14} />
                        </button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default DonationSuccessPage;
