import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Lock, ShieldCheck, X, CheckCircle2, RefreshCw, Zap, DollarSign } from 'lucide-react';

interface MockPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (donationType: 'ESCROW' | 'DIRECT') => void;
    amount: number;
}

const MockPaymentModal: React.FC<MockPaymentModalProps> = ({ isOpen, onClose, onSuccess, amount }) => {
    const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
    const [donationType, setDonationType] = useState<'ESCROW' | 'DIRECT'>('ESCROW');

    const handlePay = () => {
        setStep('processing');
        setTimeout(() => {
            setStep('success');
            setTimeout(() => {
                onSuccess(donationType);
                setStep('details');
            }, 2000);
        }, 3000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#1A1B1E]/60 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-[0_64px_128px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        {step === 'details' && (
                            <div className="p-12">
                                <div className="flex justify-between items-center mb-12">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[#2E5CFF]/10 flex items-center justify-center text-[#2E5CFF]">
                                            <Lock size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-heading font-black text-[#1A1B1E] uppercase tracking-tight">Sovereign Escrow</h3>
                                            <p className="text-[10px] font-heading font-bold text-[#495057]/40 uppercase tracking-widest">Authorized Fund Allocation</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 text-[#495057]/20 hover:text-[#1A1B1E] transition-colors"><X size={24} /></button>
                                </div>

                                <div className="p-10 bg-[#FAFBFC] rounded-[2.5rem] border border-[#E9ECEF] mb-12 text-center relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#2E5CFF]/5 blur-[40px] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                                    <p className="text-[10px] text-[#495057]/40 font-heading font-bold uppercase tracking-[0.2em] mb-4">Vault Commitment</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-2xl font-heading font-black text-[#2E5CFF]">₹</span>
                                        <span className="text-6xl font-heading font-black text-[#1A1B1E] tracking-tighter">{amount.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-heading font-black text-[#495057]/40 uppercase tracking-widest ml-1">Identity Asset</label>
                                        <div className="relative group">
                                            <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-[#495057]/20 group-focus-within:text-[#2E5CFF] transition-all" size={20} />
                                            <input
                                                type="text"
                                                placeholder="Asset Identifier"
                                                className="impact-input !pl-16 !py-5 font-mono text-sm tracking-widest"
                                                defaultValue="4242 4242 4242 4242"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-heading font-black text-[#495057]/40 uppercase tracking-widest ml-1">Validity</label>
                                            <input
                                                type="text"
                                                placeholder="MM / YY"
                                                className="impact-input !py-5 text-center font-mono"
                                                defaultValue="12/28"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-heading font-black text-[#495057]/40 uppercase tracking-widest ml-1">Pin Code</label>
                                            <input
                                                type="password"
                                                placeholder="CVC"
                                                className="impact-input !py-5 text-center font-mono"
                                                defaultValue="***"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-4">
                                    <label className="text-[10px] font-heading font-black text-[#495057]/40 uppercase tracking-widest ml-1">Assistance Protection Model</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setDonationType('ESCROW')}
                                            className={`p-5 rounded-3xl border-2 transition-all text-left relative overflow-hidden group ${
                                                donationType === 'ESCROW' 
                                                ? 'border-[#2E5CFF] bg-[#2E5CFF]/5 shadow-glow-sapphire' 
                                                : 'border-[#E9ECEF] hover:border-[#2E5CFF]/30'
                                            }`}
                                        >
                                            {donationType === 'ESCROW' && <div className="absolute top-0 right-0 w-8 h-8 bg-[#2E5CFF] text-white flex items-center justify-center rounded-bl-xl shadow-lg"><CheckCircle2 size={14} /></div>}
                                            <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${donationType === 'ESCROW' ? 'text-[#2E5CFF]' : 'text-gray-400'}`}>30m Escrow</p>
                                            <p className="text-[9px] text-[#495057]/50 font-bold leading-snug">Funds released only after photo proof.</p>
                                        </button>
                                        <button 
                                            onClick={() => setDonationType('DIRECT')}
                                            className={`p-5 rounded-3xl border-2 transition-all text-left relative overflow-hidden group ${
                                                donationType === 'DIRECT' 
                                                ? 'border-emerald-500 bg-emerald-50 shadow-glow-success' 
                                                : 'border-[#E9ECEF] hover:border-emerald-200'
                                            }`}
                                        >
                                            {donationType === 'DIRECT' && <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500 text-white flex items-center justify-center rounded-bl-xl shadow-lg"><Zap size={14} fill="currentColor" /></div>}
                                            <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${donationType === 'DIRECT' ? 'text-emerald-600' : 'text-gray-400'}`}>Direct Pay</p>
                                            <p className="text-[9px] text-[#495057]/50 font-bold leading-snug">Instant release to helping citizen.</p>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePay}
                                    className="btn-primary w-full mt-12 py-6 text-lg shadow-2xl shadow-[#2E5CFF]/20 group"
                                >
                                    Authorize & Seal Vault <Zap fill="currentColor" size={20} className="inline ml-2 group-hover:scale-125 transition-transform" />
                                </button>

                                <div className="mt-10 flex items-center justify-center gap-3">
                                    <ShieldCheck size={16} className="text-[#51CF66]" />
                                    <span className="text-[9px] font-heading font-black text-[#495057]/40 uppercase tracking-[0.2em]">Sovereign AIS-256 Cloud Encryption Active</span>
                                </div>
                            </div>
                        )}

                        {step === 'processing' && (
                            <div className="p-24 text-center flex flex-col items-center">
                                <div className="relative mb-12">
                                    <div className="w-24 h-24 rounded-[2rem] border-2 border-[#E9ECEF] flex items-center justify-center bg-white shadow-xl relative z-10">
                                        <RefreshCw className="text-[#2E5CFF] animate-spin-slow" size={40} />
                                    </div>
                                    <div className="absolute inset-0 bg-[#2E5CFF]/10 blur-3xl animate-pulse"></div>
                                </div>
                                <h4 className="text-3xl font-heading font-black text-[#1A1B1E] uppercase tracking-tight mb-3">Weaving Security</h4>
                                <p className="text-[#495057]/60 font-medium">Securing your sincerity into the immutable Social Kind vault...</p>

                                <div className="mt-12 w-48 h-1.5 bg-[#FAFBFC] rounded-full overflow-hidden border border-[#E9ECEF]">
                                    <motion.div
                                        initial={{ x: '-100%' }}
                                        animate={{ x: '100%' }}
                                        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                                        className="w-full h-full bg-[#2E5CFF]"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="p-24 text-center flex flex-col items-center">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-24 h-24 bg-[#51CF66] text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-[#51CF66]/30"
                                >
                                    <CheckCircle2 size={48} />
                                </motion.div>
                                <h4 className="text-3xl font-heading font-black text-[#1A1B1E] uppercase tracking-tight mb-3">Vault Sealed</h4>
                                <p className="text-[#495057]/60 font-medium italic">Impact path successfully authorized and secured.</p>

                                <div className="mt-10 flex items-center gap-3 px-6 py-2 bg-[#51CF66]/10 text-[#51CF66] rounded-full text-[10px] font-heading font-black uppercase tracking-widest">
                                    <span className="w-2 h-2 rounded-full bg-[#51CF66] animate-pulse"></span>
                                    Fund Locked in Escrow
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MockPaymentModal;
