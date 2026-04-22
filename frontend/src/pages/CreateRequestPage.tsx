import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Utensils,
    Pill,
    Siren,
    MapPin,
    Clock,
    Shield,
    Check,
    ChevronRight,
    AlertTriangle,
    Info,
    Heart,
    Lock,
    ArrowRight
} from 'lucide-react';

import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../context/NotificationContext';
import LocationPicker from '../components/LocationPicker';
import MockPaymentModal from '../components/MockPaymentModal';
import { Button } from '../components/design-system/Button';

// --- Schema & Types ---

const requestSchema = z.object({
    category: z.enum(['nourishment', 'healing', 'emergency']),
    urgency: z.enum(['low', 'medium', 'high', 'critical']),
    amountValue: z.number().min(1, "Amount is required"),
    narrative: z.string().min(20, "Please provide more context (min 20 chars)").max(500, "Limit 500 chars"),
});

type RequestFormValues = z.infer<typeof requestSchema>;

// --- Components ---

const ProfileQuickView = ({ user }: { user: any }) => (
    <div className="flex items-center gap-6 text-sm font-medium text-secondary-text bg-white/50 backdrop-blur-sm px-6 py-2 rounded-full border border-gray-100 shadow-sm mb-8 w-fit mx-auto">
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-humanexa-trust"></span>
            <span className="uppercase tracking-widest text-[10px] font-bold">Trust {user?.creditScore?.rank || 'Bronze'}</span>
        </div>
        <div className="w-px h-4 bg-gray-200"></div>
        <div>
            <span className="font-bold text-humanexa-trust">{user?.statistics?.totalHelps || 0}</span> <span className="text-[10px] uppercase tracking-widest">Acts</span>
        </div>
        <div className="w-px h-4 bg-gray-200"></div>
        <div>
            <span className="font-bold text-humanexa-verified">{user?.statistics?.livesTouched || 0}</span> <span className="text-[10px] uppercase tracking-widest">Lives</span>
        </div>
    </div>
);

const HeroSection = ({ onInitiate }: { onInitiate: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-humanexa-trust to-[#0F172A] text-white shadow-2xl p-12 md:p-20 text-center mb-12 group"
    >
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-humanexa-sincere/20 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-humanexa-verified/20 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                <Heart size={14} className="text-humanexa-sincere fill-current" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-humanexa-sincere">The Sincerity Protocol</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tight leading-tight">
                INITIATE A <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-humanexa-sincere to-amber-200">SIGNAL OF KINDNESS</span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 font-medium leading-relaxed max-w-2xl mx-auto">
                Every act begins with intention. Every intention deserves verification.
                Every verification builds humanity.
            </p>

            <Button
                onClick={onInitiate}
                className="h-16 px-10 text-lg bg-gradient-to-r from-humanexa-sincere to-amber-600 border-none shadow-glow hover:scale-105"
            >
                START A VERIFIED ACT
            </Button>
        </div>
    </motion.div>
);

const StepIndicator = ({ step }: { step: number }) => (
    <div className="flex justify-center mb-12">
        <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all duration-500 ${s === step ? 'bg-humanexa-trust text-white shadow-lg scale-110' :
                        s < step ? 'bg-humanexa-verified text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                        {s < step ? <Check size={20} /> : s}
                    </div>
                    {s < 3 && (
                        <div className={`w-16 h-1 rounded-full transition-all duration-500 ${s < step ? 'bg-humanexa-verified' : 'bg-gray-100'
                            }`} />
                    )}
                </div>
            ))}
        </div>
    </div>
);

const CreateRequestPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useNotifications();

    // View State
    const [view, setView] = useState<'hero' | 'form'>('hero');
    const [step, setStep] = useState(1);
    const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
    const [locationAddress, setLocationAddress] = useState<string>('Pinned Location');
    const [isPayOpen, setIsPayOpen] = useState(false);
    const [pendingData, setPendingData] = useState<RequestFormValues | null>(null);
    const [agreed, setAgreed] = useState(false);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);

    const { register, handleSubmit, watch, formState: { errors }, setValue, trigger } = useForm<RequestFormValues>({
        resolver: zodResolver(requestSchema),
        defaultValues: { urgency: 'medium' }
    });

    const category = watch('category');
    const urgency = watch('urgency');
    const narrativeVal = watch('narrative') || '';

    // --- Actions ---

    const nextStep = async () => {
        let fields: (keyof RequestFormValues)[] = [];
        if (step === 1) fields = ['category', 'urgency', 'amountValue'];
        if (step === 2) fields = ['narrative'];

        const isValid = await trigger(fields);
        if (step === 2 && !selectedLocation) {
            showToast('Please pin a location', 'error');
            return;
        }

        if (isValid) setStep(s => s + 1);
    };

    const prevStep = () => setStep(s => s - 1);

    const onFormSubmit = (data: RequestFormValues) => {
        if (!agreed) return showToast('Please agree to the protocol', 'warning');
        setPendingData(data);

        if (user?.role === 'institution') {
            // Institutions don't pay into escrow for broadcasts
            handleActualSubmitDirectly(data);
        } else {
            setIsPayOpen(true);
        }
    };

    const handleActualSubmitDirectly = async (data: RequestFormValues) => {
        try {
            await api.post('/help-requests', {
                title: `${data.category.charAt(0).toUpperCase() + data.category.slice(1)} Assistance`,
                description: data.narrative,
                requestType: data.category === 'nourishment' ? 'food' : data.category === 'healing' ? 'medicine' : 'emergency',
                urgency: data.urgency,
                amount: {
                    value: data.amountValue,
                    currency: 'INR'
                },
                targetBeneficiaries: {
                    count: 1,
                    specificNeeds: 'Community'
                },
                location: {
                    address: locationAddress,
                    coordinates: {
                        type: 'Point',
                        coordinates: selectedLocation ? [selectedLocation[1], selectedLocation[0]] : [0, 0]
                    }
                }
            });
            setSubmissionSuccess(true);
        } catch (error: any) {
            console.error(error);
            showToast('Failed to deploy signal', 'error');
        }
    };

    const handleActualSubmit = async () => {
        if (!pendingData) return;
        try {
            await api.post('/help-requests', {
                title: `${pendingData.category.charAt(0).toUpperCase() + pendingData.category.slice(1)} Assistance`,
                description: pendingData.narrative,
                requestType: pendingData.category === 'nourishment' ? 'food' : pendingData.category === 'healing' ? 'medicine' : 'emergency',
                urgency: pendingData.urgency,
                amount: {
                    value: pendingData.amountValue,
                    currency: 'INR'
                },
                targetBeneficiaries: {
                    count: 1,
                    specificNeeds: 'Community'
                },
                location: {
                    address: locationAddress, // In prod, reverse geocode
                    coordinates: {
                        type: 'Point',
                        coordinates: selectedLocation ? [selectedLocation[1], selectedLocation[0]] : [0, 0]
                    }
                }
            });
            setIsPayOpen(false);
            setSubmissionSuccess(true);
        } catch (error: any) {
            console.error(error);
            showToast('Failed to deploy signal', 'error');
            setIsPayOpen(false);
        }
    };

    // --- Render ---

    if (submissionSuccess) {
        return (
            <div className="min-h-screen pt-32 p-6 flex items-center justify-center bg-background">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-xl w-full text-center space-y-8"
                >
                    <div className="w-24 h-24 rounded-full bg-humanexa-verified/10 flex items-center justify-center mx-auto text-humanexa-verified">
                        <Check size={48} />
                    </div>
                    <h2 className="text-4xl font-serif font-black text-humanexa-trust">Verified & Deployed!</h2>
                    <p className="text-secondary-text">
                        Your signal #{Math.floor(Math.random() * 10000)} is now broadcast to nearby helpers.
                        Funds are effectively secured in Escrow.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button onClick={() => navigate('/dashboard')} className="bg-humanexa-trust text-white">
                            Track on Dashboard
                        </Button>
                        <Button variant="secondary" onClick={() => {
                            setSubmissionSuccess(false);
                            setView('hero');
                            setStep(1);
                        }}>
                            New Signal
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 bg-background relative selection:bg-humanexa-trust/20">
            <div className="max-w-5xl mx-auto px-6">

                {/* Header Profile View */}
                <ProfileQuickView user={user} />

                <AnimatePresence mode="wait">
                    {view === 'hero' ? (
                        <HeroSection onInitiate={() => setView('form')} key="hero" />
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2rem] shadow-soft-xl border border-gray-100 overflow-hidden"
                        >
                            <div className="p-8 md:p-12">
                                <StepIndicator step={step} />

                                {step === 1 && (
                                    <div className="space-y-12">
                                        {/* Category Selection */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <h3 className="text-2xl font-bold text-humanexa-trust">Step 1: Define Sincerity Protocol</h3>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-secondary-text/50">Core Sincerity Category</div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {[
                                                    { id: 'nourishment', icon: Utensils, label: 'Nourishment', sub: 'Food & Water', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                                    { id: 'healing', icon: Pill, label: 'Healing', sub: 'Medicine', color: 'text-blue-600', bg: 'bg-blue-50' },
                                                    { id: 'emergency', icon: Siren, label: 'Emergency', sub: 'Critical Aid', color: 'text-crimson', bg: 'bg-red-50' }
                                                ].map((card) => (
                                                    <div
                                                        key={card.id}
                                                        onClick={() => setValue('category', card.id as any)}
                                                        className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer group hover:shadow-lg ${category === card.id
                                                            ? 'border-humanexa-trust bg-humanexa-trust/5'
                                                            : 'border-transparent bg-gray-50 hover:bg-white hover:border-gray-200'
                                                            }`}
                                                    >
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.bg} ${card.color}`}>
                                                            <card.icon size={24} />
                                                        </div>
                                                        <h4 className="font-bold text-lg text-primary-text">{card.label}</h4>
                                                        <p className="text-xs font-medium text-secondary-text">{card.sub}</p>
                                                        {category === card.id && (
                                                            <div className="absolute top-4 right-4 text-humanexa-trust">
                                                                <Check size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            {errors.category && <p className="text-humanexa-honest text-sm font-bold">{errors.category.message}</p>}
                                        </div>

                                        {/* Urgency */}
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-secondary-text">Urgency Level</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {[
                                                    { id: 'low', label: 'Low', time: '1-3 days', color: 'bg-emerald-100 text-emerald-700' },
                                                    { id: 'medium', label: 'Normal', time: '< 24h', color: 'bg-amber-100 text-amber-700' },
                                                    { id: 'high', label: 'High', time: '< 6h', color: 'bg-orange-100 text-orange-700' },
                                                    { id: 'critical', label: 'Critical', time: 'Immediate', color: 'bg-red-100 text-red-700' },
                                                ].map((opt) => (
                                                    <div
                                                        key={opt.id}
                                                        onClick={() => setValue('urgency', opt.id as any)}
                                                        className={`p-4 rounded-xl border cursor-pointer text-center transition-all ${urgency === opt.id
                                                            ? 'border-humanexa-trust ring-2 ring-humanexa-trust/10 ' + opt.color
                                                            : 'border-gray-100 bg-white hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <div className="font-black text-sm uppercase">{opt.label}</div>
                                                        <div className="text-[10px] opacity-80 mt-1">{opt.time}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Escrow */}
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-secondary-text">Escrow Commitment (₹)</h4>
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-humanexa-trust">₹</div>
                                                <input
                                                    type="number"
                                                    {...register('amountValue', { valueAsNumber: true })}
                                                    className="w-full h-20 pl-16 pr-6 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-humanexa-trust focus:bg-white outline-none text-3xl font-black text-primary-text transition-all"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 p-4 bg-humanexa-trust/5 rounded-xl border border-humanexa-trust/10">
                                                <Lock size={16} className="text-humanexa-trust" />
                                                <p className="text-xs text-secondary-text/80">Funds held securely. Auto-released only upon AI verification. Zero fees.</p>
                                            </div>
                                        </div>

                                        <Button onClick={nextStep} className="w-full h-14 bg-humanexa-trust text-white text-lg">
                                            Proceed to Context <ArrowRight size={20} className="ml-2" />
                                        </Button>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-12">
                                        <div className="flex justify-between items-end">
                                            <h3 className="text-2xl font-bold text-humanexa-trust">Step 2: Human Context</h3>
                                            <Button variant="ghost" size="sm" onClick={prevStep}>Back</Button>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-secondary-text">Narrative Context</h4>
                                            <textarea
                                                {...register('narrative')}
                                                rows={5}
                                                className="w-full p-6 rounded-2xl border border-gray-200 focus:border-humanexa-trust focus:ring-4 focus:ring-humanexa-trust/10 outline-none text-base leading-relaxed resize-none"
                                                placeholder="Why is this help needed? Be specific and respectful..."
                                            />
                                            <div className="flex justify-between text-xs text-secondary-text/60 font-bold uppercase tracking-widest">
                                                <span>Minimum 20 characters</span>
                                                <span>{500 - narrativeVal.length} remaining</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-secondary-text">Deploy Location (Drag to Pin)</h4>
                                            <div className="h-[400px] rounded-3xl overflow-hidden border border-gray-100 relative shadow-sm">
                                                <LocationPicker onLocationSelect={(lat, lng, addr) => {
                                                    setSelectedLocation([lat, lng]);
                                                    setLocationAddress(addr || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                                                }} />
                                            </div>
                                        </div>

                                        <Button onClick={nextStep} className="w-full h-14 bg-humanexa-trust text-white text-lg">
                                            Preview & Commit <ArrowRight size={20} className="ml-2" />
                                        </Button>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-12">
                                        <div className="flex justify-between items-end">
                                            <h3 className="text-2xl font-bold text-humanexa-trust">Step 3: Protocol Agreement</h3>
                                            <Button variant="ghost" size="sm" onClick={prevStep}>Back</Button>
                                        </div>

                                        {/* Summary Card */}
                                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 space-y-6">
                                            <div className="flex justify-between items-start pb-6 border-b border-gray-200">
                                                <div>
                                                    <h4 className="text-lg font-bold text-humanexa-trust uppercase">{category}</h4>
                                                    <p className="text-sm text-secondary-text px-2 py-0.5 bg-gray-200 rounded text-xs inline-block mt-1 uppercase font-bold">{urgency}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-3xl font-black text-humanexa-trust">₹{watch('amountValue')}</div>
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-secondary-text">Escrow Value</div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-widest text-secondary-text mb-2">Narrative</div>
                                                <p className="text-primary-text font-medium leading-relaxed italic">"{narrativeVal}"</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-secondary-text uppercase tracking-widest">
                                                <MapPin size={14} />
                                                <span>Location Pinned ({selectedLocation ? 'Verified' : 'Pending'})</span>
                                            </div>
                                        </div>

                                        {/* Legal */}
                                        <div
                                            onClick={() => setAgreed(!agreed)}
                                            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex gap-4 ${agreed ? 'border-humanexa-verified bg-humanexa-verified/5' : 'border-gray-200 hover:border-humanexa-trust/40'
                                                }`}
                                        >
                                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 ${agreed ? 'bg-humanexa-verified border-humanexa-verified text-white' : 'border-gray-300'
                                                }`}>
                                                {agreed && <Check size={14} />}
                                            </div>
                                            <div className="space-y-2">
                                                <h5 className="font-bold text-primary-text text-sm">Sincerity Protocol Agreement</h5>
                                                <ul className="text-xs text-secondary-text space-y-1 list-disc pl-4">
                                                    <li>I confirm this is a genuine need for help.</li>
                                                    <li>I accept AI verification as the final authority.</li>
                                                    <li>I will NOT attempt direct contact with the helper outside the protocol.</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleSubmit(onFormSubmit)}
                                            disabled={!agreed}
                                            className={`w-full h-16 text-lg shadow-xl transition-all ${agreed
                                                ? 'bg-gradient-to-r from-humanexa-trust to-humanexa-sincere text-white hover:scale-[1.02]'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            Initialize Impact Bridge
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <MockPaymentModal
                    isOpen={isPayOpen}
                    onClose={() => setIsPayOpen(false)}
                    onSuccess={handleActualSubmit}
                    amount={watch('amountValue') || 0}
                />
            </div>
        </div>
    );
};

export default CreateRequestPage;
