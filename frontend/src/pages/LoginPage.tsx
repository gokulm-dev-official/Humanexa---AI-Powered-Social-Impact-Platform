import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import authService from '../services/authService';
import { Heart, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Building2, Handshake, Sparkles, MapPin, Loader2, Navigation } from 'lucide-react';
import { Input } from '../components/design-system/Input';
import { Button } from '../components/design-system/Button';
import { cn } from '../utils/cn';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type RoleType = 'donor' | 'institution' | 'helper' | null;

const roleConfig = {
    donor: {
        icon: Heart,
        title: "I'M A DONOR",
        subtitle: 'I want to help causes',
        loginTitle: 'DONOR LOGIN',
        loginSubtitle: 'Welcome back! Login to continue helping',
        buttonText: 'LOGIN TO MY DONOR DASHBOARD',
        signupText: 'Sign Up as Donor',
        gradient: 'from-rose-400 to-pink-600',
        bgGlow: 'bg-rose-500/10',
        iconBg: 'from-rose-400 to-pink-600',
        emoji: '💝',
    },
    institution: {
        icon: Building2,
        title: 'I RUN AN INSTITUTION',
        subtitle: 'I need funds for my org',
        loginTitle: 'INSTITUTION LOGIN',
        loginSubtitle: 'Welcome back! Manage your fundraising',
        buttonText: 'LOGIN TO MY INSTITUTION DASHBOARD',
        signupText: 'Sign Up as Institution',
        gradient: 'from-amber-400 to-yellow-600',
        bgGlow: 'bg-amber-500/10',
        iconBg: 'from-amber-400 to-yellow-600',
        emoji: '🏛️',
    },
    helper: {
        icon: Handshake,
        title: "I'M A HELPER",
        subtitle: 'I verify & earn',
        loginTitle: 'HELPER LOGIN',
        loginSubtitle: 'Welcome back! Find verification tasks',
        buttonText: 'LOGIN TO MY HELPER DASHBOARD',
        signupText: 'Sign Up as Helper',
        gradient: 'from-emerald-400 to-teal-600',
        bgGlow: 'bg-emerald-500/10',
        iconBg: 'from-emerald-400 to-teal-600',
        emoji: '🤝',
    },
};

const LoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<RoleType>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [locationDetecting, setLocationDetecting] = useState(false);
    const [locationAddress, setLocationAddress] = useState('');
    const [manualSearch, setManualSearch] = useState('');
    const [searching, setSearching] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            setLoginError('');
            const payload: any = { ...data, role: selectedRole };
            if (locationCoords) {
                payload.latitude = locationCoords.lat;
                payload.longitude = locationCoords.lng;
                payload.locationAddress = locationAddress;
            }
            const response = await authService.login(payload);
            dispatch(setCredentials({ user: response.data.user, token: response.token }));

            // Route based on role
            const userRole = response.data.user.role;
            if (userRole === 'institution') {
                navigate('/dashboard');
            } else if (userRole === 'helper') {
                navigate('/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (error: any) {
            setLoginError(error.response?.data?.message || 'Login failed. Please check your credentials.');
        }
    };

    const handleRoleSelect = (role: RoleType) => {
        setSelectedRole(role);
        setLoginError('');
        reset();
    };

    const handleBackToRoles = () => {
        setSelectedRole(null);
        setLoginError('');
        reset();
    };

    const otherRoles = selectedRole
        ? (Object.keys(roleConfig) as RoleType[]).filter((r) => r !== selectedRole && r !== null)
        : [];

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
                setLocationAddress(display_name.split(',').slice(0, 4).join(',').trim());
            }
        } catch { }
        setSearching(false);
    };

    useEffect(() => {
        if (selectedRole && !locationCoords) {
            detectLocation();
        }
    }, [selectedRole]);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-amber-50/30 to-white overflow-hidden relative">
            {/* Decorative background elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-amber-400/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-rose-400/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-[40%] left-[50%] w-[500px] h-[500px] bg-emerald-400/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 pt-8 px-8 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center p-1 bg-white shadow-lg group-hover:shadow-glow group-hover:scale-110 transition-all duration-500">
                        <img src="/src/assets/logo_splash.png" alt="Logo" className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div>
                        <span className="font-serif text-xl font-black tracking-tighter text-primary-text uppercase block leading-none">Humanexa</span>
                        <span className="text-[9px] font-bold text-secondary-text/50 uppercase tracking-[0.2em]">தமிழ் நேசம்</span>
                    </div>
                </Link>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
                <AnimatePresence mode="wait">
                    {!selectedRole ? (
                        /* STEP 1: ROLE SELECTION */
                        <motion.div
                            key="role-selection"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.5 }}
                            className="w-full max-w-[1100px]"
                        >
                            {/* Title */}
                            <div className="text-center mb-16">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2, duration: 0.6 }}
                                >
                                    <h1 className="text-4xl md:text-5xl font-serif font-black text-primary-text mb-4 tracking-tight">
                                        India's Most Transparent
                                    </h1>
                                    <p className="text-2xl md:text-3xl font-serif text-amber-600 font-bold">
                                        Philanthropy Platform
                                    </p>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4, duration: 0.5 }}
                                    className="mt-8 flex items-center justify-center gap-2"
                                >
                                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-300" />
                                    <span className="text-sm font-bold text-secondary-text/60 uppercase tracking-[0.3em]">Who are you?</span>
                                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-300" />
                                </motion.div>
                                <p className="text-secondary-text mt-3 text-sm">Choose your account type to login</p>
                            </div>

                            {/* Role Cards */}
                            <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-[960px] mx-auto">
                                {(Object.entries(roleConfig) as [RoleType, typeof roleConfig.donor][]).map(([role, config], i) => (
                                    <motion.div
                                        key={role}
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                                    >
                                        <div
                                            onClick={() => handleRoleSelect(role)}
                                            className="group relative bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-amber-300 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(212,175,55,0.2)] text-center"
                                        >
                                            {/* Icon */}
                                            <div className={cn(
                                                "w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-500 shadow-lg",
                                                config.iconBg
                                            )}>
                                                <span className="text-4xl">{config.emoji}</span>
                                            </div>

                                            {/* Role Name */}
                                            <h3 className="text-lg font-black text-primary-text tracking-tight uppercase mb-2">
                                                {config.title}
                                            </h3>
                                            <p className="text-sm text-secondary-text/60 mb-8">{config.subtitle}</p>

                                            {/* Login Button */}
                                            <button className="w-full h-12 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-amber-500 hover:to-yellow-600 transition-all duration-300 tracking-wide text-sm uppercase">
                                                Login
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Sign Up */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="text-center mt-12 text-secondary-text text-sm"
                            >
                                Don't have an account?{' '}
                                <Link to="/register" className="text-amber-600 font-bold hover:underline underline-offset-4">Sign Up</Link>
                            </motion.p>
                        </motion.div>
                    ) : (
                        /* STEP 2: LOGIN FORM */
                        <motion.div
                            key="login-form"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.5 }}
                            className="w-full max-w-md"
                        >
                            <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-10">
                                {/* Back button */}
                                <button
                                    onClick={handleBackToRoles}
                                    className="flex items-center gap-2 text-secondary-text hover:text-amber-600 transition-colors mb-8 text-sm font-bold uppercase tracking-widest group"
                                >
                                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                    Back to Role Selection
                                </button>

                                {/* Role Icon & Title */}
                                <div className="text-center mb-8">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-4 shadow-lg",
                                        roleConfig[selectedRole].iconBg
                                    )}>
                                        <span className="text-3xl">{roleConfig[selectedRole].emoji}</span>
                                    </div>
                                    <h2 className="text-2xl font-serif font-black text-primary-text tracking-tight">
                                        {roleConfig[selectedRole].loginTitle}
                                    </h2>
                                    <p className="text-secondary-text text-sm mt-2">{roleConfig[selectedRole].loginSubtitle}</p>
                                </div>

                                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />

                                {/* Error message */}
                                {loginError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium"
                                    >
                                        {loginError}
                                    </motion.div>
                                )}

                                {/* Form */}
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                    <Input
                                        label="Email or Mobile Number"
                                        type="email"
                                        placeholder="priya@example.com"
                                        leftIcon={<Mail size={18} />}
                                        {...register('email')}
                                        error={errors.email?.message}
                                    />

                                    <div className="relative">
                                        <Input
                                            label="Password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            leftIcon={<Lock size={18} />}
                                            {...register('password')}
                                            error={errors.password?.message}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-[2.1rem] text-secondary-text hover:text-amber-600 transition-colors z-10"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between py-1">
                                        <label className="flex items-center gap-2 cursor-pointer group select-none">
                                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400/20 transition-all cursor-pointer" />
                                            <span className="text-sm font-medium text-secondary-text group-hover:text-primary-text transition-colors">Remember me</span>
                                        </label>
                                        <a href="#" className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors">Forgot password?</a>
                                    </div>

                                    {/* Location Status */}
                                    <div className={`rounded-xl border p-3 mt-4 ${locationDetecting ? 'bg-gray-50 border-gray-200' :
                                            locationCoords ? 'bg-emerald-50 border-emerald-200' :
                                                'bg-amber-50 border-amber-200'
                                        }`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <MapPin size={16} className={`mt-0.5 ${locationDetecting ? 'text-gray-400 animate-pulse' : locationCoords ? 'text-emerald-600' : 'text-amber-600'}`} />
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">Current Location</p>
                                                    {locationDetecting ? (
                                                        <div className="flex items-center gap-2">
                                                            <Loader2 size={12} className="animate-spin text-gray-400" />
                                                            <span className="text-xs text-gray-400">Detecting... (Used for matching)</span>
                                                        </div>
                                                    ) : locationCoords ? (
                                                        <>
                                                            <p className="text-xs font-semibold text-gray-800 leading-tight">{locationAddress}</p>
                                                        </>
                                                    ) : (
                                                        <p className="text-xs text-amber-600">Location needed for emergency matches</p>
                                                    )}
                                                </div>
                                            </div>
                                            <button type="button" onClick={detectLocation} disabled={locationDetecting} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 shrink-0 disabled:text-gray-300">
                                                {locationDetecting ? '...' : 'Refresh'}
                                            </button>
                                        </div>

                                        {/* Manual search */}
                                        <div className="mt-2 pt-2 border-t border-gray-200/50">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={manualSearch}
                                                    onChange={(e) => setManualSearch(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchLocation())}
                                                    placeholder="Type address..."
                                                    className="flex-1 h-8 rounded-md border border-gray-200 px-2 text-xs focus:outline-none focus:border-blue-400"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={searchLocation}
                                                    disabled={searching || !manualSearch.trim()}
                                                    className="px-3 h-8 rounded-md bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex items-center gap-1"
                                                >
                                                    {searching ? <Loader2 size={10} className="animate-spin" /> : <Navigation size={10} />}
                                                    {searching ? '...' : 'Find'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-14 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold rounded-xl shadow-lg hover:shadow-[0_8px_30px_rgba(212,175,55,0.3)] hover:-translate-y-0.5 transition-all duration-300 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                {roleConfig[selectedRole].buttonText}
                                                <ArrowRight size={16} />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-8" />

                                {/* Sign up & Switch roles */}
                                <div className="text-center space-y-4">
                                    <p className="text-secondary-text text-sm">
                                        Don't have an account?{' '}
                                        <Link to={`/register?role=${selectedRole}`} className="text-amber-600 font-bold hover:underline underline-offset-4">
                                            {roleConfig[selectedRole].signupText}
                                        </Link>
                                    </p>
                                    <div className="flex items-center justify-center gap-1 text-xs text-secondary-text/50">
                                        <span>Wrong role?</span>
                                        {otherRoles.map((role) => (
                                            <button
                                                key={role}
                                                onClick={() => handleRoleSelect(role)}
                                                className="text-amber-600 font-bold hover:underline underline-offset-4 mx-1"
                                            >
                                                I'm {role === 'institution' ? 'Institution' : role === 'donor' ? 'Donor' : 'Helper'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="relative z-10 py-6 text-center">
                <p className="text-[10px] text-secondary-text/30 uppercase tracking-[0.3em] font-bold">
                    Secured by Humanexa Protocol • End-to-end Encrypted
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
