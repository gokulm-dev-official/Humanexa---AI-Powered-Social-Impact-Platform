import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import authService from '../services/authService';
import { User, Phone, Mail, Lock, ShieldCheck, Heart, Zap, ChevronRight, ArrowLeft, Camera, Check, Building2, Handshake, Upload, X, FileText, Image, MapPin, Loader2, Navigation } from 'lucide-react';
import { Button } from '../components/design-system/Button';
import { Card } from '../components/design-system/Card';
import { Input } from '../components/design-system/Input';
import { cn } from '../utils/cn';

const registerSchema = z.object({
    fullName: z.string().min(2, 'Name is too short'),
    email: z.string().email('Please enter a valid email address'),
    phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['donor', 'helper', 'institution']),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialRole = (searchParams.get('role') as 'donor' | 'helper' | 'institution') || 'donor';
    const [step, setStep] = useState(1);
    const [formError, setFormError] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [location, setLocation] = useState('');
    const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [locationDetecting, setLocationDetecting] = useState(false);
    const [locationAddress, setLocationAddress] = useState('');
    const [manualSearch, setManualSearch] = useState('');
    const [searching, setSearching] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, watch, setValue, trigger, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: initialRole }
    });

    const role = watch('role');

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            setFormError('');
            // 1. Register the user
            const response = await authService.register({
                ...data,
                latitude: locationCoords?.lat,
                longitude: locationCoords?.lng,
                locationAddress,
            });

            // 2. If registration successful and file is present, upload it.
            // Note: Dispatch setCredentials first so subsequent calls have the token.
            dispatch(setCredentials({ user: response.data.user, token: response.token }));

            if (uploadedFile) {
                try {
                    const uploadRes = await authService.uploadImage(uploadedFile);
                    if (uploadRes.status === 'success') {
                        await authService.verifyId(uploadRes.data.url);
                    }
                } catch (uploadErr) {
                    console.error('ID upload/verification failed:', uploadErr);
                    // We don't block registration if ID upload fails
                }
            }

            setStep(4);
            setTimeout(() => navigate('/dashboard'), 3000);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Registration failed. Please try again.';
            setFormError(msg);
        }
    };

    // Validate step 2 fields before proceeding to step 3
    const handleNextFromStep2 = async () => {
        const valid = await trigger(['fullName', 'email', 'phoneNumber', 'password']);
        if (valid) {
            setFormError('');
            setStep(3);
        }
    };

    const nextStep = () => setStep((s) => s + 1);
    const prevStep = () => {
        setFormError('');
        setStep((s) => s - 1);
    };

    // Handle file upload for government ID
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setFormError('File size must be less than 10MB');
                return;
            }
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                setFormError('Please upload a JPG, PNG, WebP image or PDF file');
                return;
            }
            setUploadedFile(file);
            setFormError('');

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setFilePreview(event.target?.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setFilePreview(null);
            }
        }
    };

    const removeFile = () => {
        setUploadedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // ── Location detection ──
    const detectLocation = async () => {
        setLocationDetecting(true);

        const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=16`);
                const data = await res.json();
                if (data.display_name) return data.display_name.split(',').slice(0, 4).join(',').trim();
            } catch { }
            return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
        };

        // Try browser geolocation
        const tryGeo = (): Promise<{ lat: number; lng: number } | null> => new Promise((resolve) => {
            if (!navigator.geolocation) { resolve(null); return; }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        });

        let coords = await tryGeo();
        if (!coords) {
            // Fallback: low accuracy
            coords = await new Promise((resolve) => {
                if (!navigator.geolocation) { resolve(null); return; }
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    () => resolve(null),
                    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
                );
            });
        }
        if (!coords) {
            // IP fallback
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (data.latitude && data.longitude) coords = { lat: data.latitude, lng: data.longitude };
            } catch { }
        }

        if (coords) {
            setLocationCoords(coords);
            const addr = await reverseGeocode(coords.lat, coords.lng);
            setLocationAddress(addr);
            setLocation(addr);
        }
        setLocationDetecting(false);
    };

    const searchLocation = async () => {
        if (!manualSearch.trim() || manualSearch.trim().length < 3) return;
        setSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualSearch.trim())}&format=json&limit=1&countrycodes=in`);
            const data = await res.json();
            if (data.length > 0) {
                const { lat, lon, display_name } = data[0];
                setLocationCoords({ lat: parseFloat(lat), lng: parseFloat(lon) });
                const addr = display_name.split(',').slice(0, 4).join(',').trim();
                setLocationAddress(addr);
                setLocation(addr);
            } else {
                setFormError('Address not found. Try a more specific location.');
            }
        } catch {
            setFormError('Search failed. Please try again.');
        }
        setSearching(false);
    };

    // Auto-detect location when entering step 3
    React.useEffect(() => {
        if (step === 3 && !locationCoords) {
            detectLocation();
        }
    }, [step]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/20 to-white pt-32 pb-20 px-6 relative overflow-hidden">
            {/* Atmospheric Elements */}
            <div className="absolute top-0 right-[20%] w-[800px] h-[800px] bg-amber-400/5 blur-[150px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-[10%] w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none"></div>

            <div className="max-w-4xl mx-auto relative z-10 text-center">
                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-20 max-w-sm mx-auto">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center relative">
                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-500 bg-white border-2",
                                step >= s ? 'border-amber-500 text-amber-600 shadow-[0_0_15px_rgba(212,175,55,0.3)] scale-110' : 'border-gray-100 text-gray-300')}>
                                {step > s ? <Check size={20} strokeWidth={3} /> : s}
                            </div>
                            {s < 3 && (
                                <div className={cn("w-20 md:w-32 h-1 mx-2 rounded-full transition-all duration-500", step > s ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 'bg-gray-100')}></div>
                            )}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12"
                        >
                            <div className="space-y-4">
                                <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-text tracking-tight">Choose Your Path</h1>
                                <p className="text-secondary-text text-lg">Select how you want to contribute to the movement.</p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <RoleCard
                                    active={role === 'donor'}
                                    onClick={() => setValue('role', 'donor')}
                                    title="I Want to Give"
                                    desc="Donate funds for verified needs and track every rupee."
                                    icon={<Heart className="w-10 h-10" fill={role === 'donor' ? 'currentColor' : 'none'} />}
                                    benefits={["Tax-certified credits", "Track every rupee", "See real impact"]}
                                    emoji="💝"
                                />
                                <RoleCard
                                    active={role === 'institution'}
                                    onClick={() => setValue('role', 'institution')}
                                    title="I Run an Institution"
                                    desc="Create fundraising requests and connect with donors directly."
                                    icon={<Building2 className="w-10 h-10" fill={role === 'institution' ? 'currentColor' : 'none'} />}
                                    benefits={["Direct donor access", "Escrow protection", "Trust verification"]}
                                    emoji="🏛️"
                                />
                                <RoleCard
                                    active={role === 'helper'}
                                    onClick={() => setValue('role', 'helper')}
                                    title="I Want to Help"
                                    desc="Provide direct assistance with proof and build your reputation."
                                    icon={<Handshake className="w-10 h-10" fill={role === 'helper' ? 'currentColor' : 'none'} />}
                                    benefits={["Earn credit points", "Flexible timing", "Build reputation"]}
                                    emoji="🤝"
                                />
                            </div>

                            <div className="pt-8">
                                <Button onClick={nextStep} size="lg" className="px-12 shadow-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:shadow-[0_8px_30px_rgba(212,175,55,0.3)]" rightIcon={<ChevronRight size={20} />}>
                                    Continue
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-2xl mx-auto"
                        >
                            <Card variant="glass" className="p-12 border-white/50 bg-white/80">
                                <div className="text-left mb-10">
                                    <button onClick={prevStep} className="text-secondary-text hover:text-amber-600 flex items-center gap-2 mb-8 transition-colors text-sm font-bold uppercase tracking-widest">
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                    <h2 className="text-3xl font-serif font-black text-primary-text mb-2">
                                        {role === 'institution' ? 'Institution Details' : 'Your Details'}
                                    </h2>
                                    <p className="text-secondary-text font-medium">
                                        {role === 'institution' ? 'Tell us about your organization.' : 'Establish your presence in the sanctuary.'}
                                    </p>
                                </div>

                                {/* Error message */}
                                {formError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium text-left"
                                    >
                                        {formError}
                                    </motion.div>
                                )}

                                <div className="space-y-8 text-left">
                                    <div className="space-y-2">
                                        <Input
                                            label={role === 'institution' ? 'Institution / Organization Name' : 'Full Name'}
                                            leftIcon={role === 'institution' ? <Building2 size={18} /> : <User size={18} />}
                                            {...register('fullName')}
                                            error={errors.fullName?.message}
                                            placeholder={role === 'institution' ? 'Ananda Ashramam' : 'Alexander Thorne'}
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Input
                                                label="Email Address"
                                                type="email"
                                                leftIcon={<Mail size={18} />}
                                                {...register('email')}
                                                error={errors.email?.message}
                                                placeholder="citizen@network.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Input
                                                label="Phone Number"
                                                leftIcon={<Phone size={18} />}
                                                {...register('phoneNumber')}
                                                error={errors.phoneNumber?.message}
                                                placeholder="+91 98765 43210"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Input
                                            label="Secure Password"
                                            type="password"
                                            leftIcon={<Lock size={18} />}
                                            {...register('password')}
                                            error={errors.password?.message}
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <Button onClick={handleNextFromStep2} className="w-full h-14 text-base mt-2 shadow-lg bg-gradient-to-r from-amber-400 to-yellow-500 hover:shadow-[0_8px_30px_rgba(212,175,55,0.3)]">
                                        Proceed to Verification
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-2xl mx-auto"
                        >
                            <Card variant="glass" className="p-12 border-white/50 bg-white/80">
                                <div className="text-left mb-10">
                                    <button onClick={prevStep} className="text-secondary-text hover:text-amber-600 flex items-center gap-2 mb-8 transition-colors text-sm font-bold uppercase tracking-widest">
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                    <h2 className="text-3xl font-serif font-black text-primary-text mb-2">Identity & Location</h2>
                                    <p className="text-secondary-text font-medium">Help us build trust through verification.</p>
                                </div>

                                {/* Error message */}
                                {formError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium text-left"
                                    >
                                        {formError}
                                    </motion.div>
                                )}

                                <div className="space-y-8 text-left">
                                    {/* Government ID Upload - Now functional */}
                                    <div>
                                        <label className="block text-sm font-bold text-primary-text mb-3">
                                            {role === 'institution' ? 'Registration Certificate' : 'Government ID'}
                                            <span className="text-secondary-text/40 font-medium ml-1">(Optional)</span>
                                        </label>

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            accept="image/jpeg,image/png,image/webp,application/pdf"
                                            className="hidden"
                                            id="gov-id-upload"
                                        />

                                        {!uploadedFile ? (
                                            <label
                                                htmlFor="gov-id-upload"
                                                className="p-8 border-2 border-dashed border-gray-200 rounded-3xl text-center group hover:border-amber-400 transition-all cursor-pointer bg-white/50 block"
                                            >
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 shadow-sm transition-transform">
                                                    <Upload className="text-gray-400 group-hover:text-amber-500 transition-colors" size={24} />
                                                </div>
                                                <p className="font-bold text-primary-text">
                                                    {role === 'institution' ? 'Upload Registration Certificate' : 'Upload Government ID'}
                                                </p>
                                                <p className="text-xs text-secondary-text/60 mt-2">
                                                    Drag & drop or <span className="text-amber-600 font-bold">click to browse</span>
                                                </p>
                                                <p className="text-[10px] text-secondary-text/40 mt-2 uppercase tracking-widest font-bold">
                                                    JPG, PNG, WebP or PDF • Max 10MB
                                                </p>
                                                <p className="text-[10px] text-secondary-text/40 mt-1 uppercase tracking-widest font-bold">
                                                    Sensitive info will be auto-blurred
                                                </p>
                                            </label>
                                        ) : (
                                            <div className="p-5 border-2 border-amber-200 rounded-2xl bg-amber-50/30 relative">
                                                <button
                                                    type="button"
                                                    onClick={removeFile}
                                                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-secondary-text hover:text-red-500 hover:bg-red-50 transition-all"
                                                >
                                                    <X size={16} />
                                                </button>
                                                <div className="flex items-center gap-4">
                                                    {filePreview ? (
                                                        <div className="w-20 h-20 rounded-xl overflow-hidden border border-amber-200 shadow-sm flex-shrink-0">
                                                            <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-20 h-20 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                            <FileText size={28} className="text-amber-600" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-primary-text text-sm truncate">{uploadedFile.name}</p>
                                                        <p className="text-xs text-secondary-text/60 mt-1">
                                                            {(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.type.split('/')[1].toUpperCase()}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-2">
                                                            <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                                                                <Check size={10} className="text-emerald-600" strokeWidth={3} />
                                                            </div>
                                                            <span className="text-xs font-bold text-emerald-600">Uploaded successfully</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="mt-3 text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                                                >
                                                    <Image size={12} /> Change file
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-primary-text mb-1">
                                            Your Location
                                            <span className="text-secondary-text/40 font-medium ml-1">(Used for emergency helper matching)</span>
                                        </label>

                                        {/* Detected location display */}
                                        <div className={`rounded-xl border p-4 ${locationDetecting ? 'bg-gray-50 border-gray-200' :
                                                locationCoords ? 'bg-emerald-50 border-emerald-200' :
                                                    'bg-amber-50 border-amber-200'
                                            }`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <MapPin size={18} className={locationDetecting ? 'text-gray-400 animate-pulse' : locationCoords ? 'text-emerald-600' : 'text-amber-600'} />
                                                    <div>
                                                        {locationDetecting ? (
                                                            <div className="flex items-center gap-2">
                                                                <Loader2 size={14} className="animate-spin text-gray-400" />
                                                                <span className="text-sm text-gray-400">Detecting your location...</span>
                                                            </div>
                                                        ) : locationCoords ? (
                                                            <>
                                                                <p className="text-sm font-semibold text-gray-800">{locationAddress}</p>
                                                                <p className="text-xs text-emerald-600 mt-0.5">Location detected ✓</p>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-amber-600">Search your location below</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button type="button" onClick={detectLocation} disabled={locationDetecting} className="text-xs font-bold text-blue-600 hover:text-blue-800 shrink-0 disabled:text-gray-300">
                                                    {locationDetecting ? '...' : 'Auto-detect'}
                                                </button>
                                            </div>

                                            {/* Manual search */}
                                            <div className="mt-3 pt-3 border-t border-gray-200/50">
                                                <p className="text-xs text-gray-400 mb-2">
                                                    {locationCoords ? 'Wrong location? Search:' : 'Search your address:'}
                                                </p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={manualSearch}
                                                        onChange={(e) => setManualSearch(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchLocation())}
                                                        placeholder="e.g. Anna Nagar, Chennai"
                                                        className="flex-1 h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={searchLocation}
                                                        disabled={searching || !manualSearch.trim()}
                                                        className="px-4 h-9 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                                                    >
                                                        {searching ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                                                        {searching ? '...' : 'Search'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                                        <ShieldCheck className="text-amber-600 flex-shrink-0" />
                                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Your data is secured by AES-256 encryption.</p>
                                    </div>

                                    <Button
                                        onClick={handleSubmit(onSubmit)}
                                        disabled={isSubmitting}
                                        isLoading={isSubmitting}
                                        className="w-full h-14 text-base shadow-lg bg-gradient-to-r from-amber-400 to-yellow-500 hover:shadow-[0_8px_30px_rgba(212,175,55,0.3)]"
                                        rightIcon={<ChevronRight size={18} />}
                                    >
                                        Complete Registration
                                    </Button>

                                    {/* Skip ID step option */}
                                    <p className="text-center text-xs text-secondary-text/40">
                                        ID verification is optional. You can upload it later from your profile.
                                    </p>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8"
                        >
                            <div className="w-40 h-40 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30">
                                <Check size={80} className="text-white" strokeWidth={4} />
                            </div>
                            <div className="space-y-4">
                                <h1 className="text-5xl font-serif font-black text-primary-text">Welcome to Humanexa!</h1>
                                <p className="text-xl text-secondary-text max-w-md mx-auto">Your identity has been secured. Preparing your dashboard...</p>
                            </div>
                            <div className="mt-12 flex justify-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-amber-500 animate-bounce"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {step < 4 && (
                    <p className="mt-12 text-secondary-text text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-amber-600 font-bold hover:underline underline-offset-4">Sign In</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

function RoleCard({ title, desc, icon, benefits, active, onClick, emoji }: any) {
    return (
        <Card
            variant={active ? 'default' : 'glass'}
            onClick={onClick}
            className={cn(
                "cursor-pointer group text-left transition-all duration-500 border-2 p-8",
                active ? 'border-amber-400 ring-4 ring-amber-400/10 scale-100 shadow-xl' : 'border-transparent bg-white/40 hover:bg-white hover:border-gray-200 scale-95 opacity-70 hover:opacity-100'
            )}
        >
            <div className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500",
                active ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'
            )}>
                {active ? <span className="text-4xl">{emoji}</span> : React.cloneElement(icon, { size: 40 })}
            </div>
            <h3 className={cn("text-2xl font-serif font-bold mb-3 transition-colors", active ? 'text-primary-text' : 'text-secondary-text')}>{title}</h3>
            <p className={cn("mb-8 text-sm leading-relaxed transition-colors font-medium", active ? 'text-secondary-text' : 'text-secondary-text/60')}>{desc}</p>
            <ul className="space-y-4">
                {benefits.map((b: string) => (
                    <li key={b} className="flex items-center gap-3 text-sm font-bold tracking-wide">
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", active ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-300")}>
                            <Check size={12} strokeWidth={4} />
                        </div>
                        <span className={active ? 'text-primary-text' : 'text-secondary-text/40'}>{b}</span>
                    </li>
                ))}
            </ul>
        </Card>
    );
}

export default RegisterPage;
