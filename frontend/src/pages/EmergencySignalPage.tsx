import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import {
    X, MapPin, Camera, AlertTriangle, Phone, MessageCircle,
    Navigation, CheckCircle2, Clock, ChevronLeft, Shield,
    Loader2, Users, Star, Zap, Radio
} from 'lucide-react';

// ── Types ──
type EmergencyType = 'MEDICAL' | 'FIRE' | 'ACCIDENT' | 'PERSON_IN_DISTRESS' | 'WATER' | 'OTHER';
type FlowStep = 'form' | 'sending' | 'confirmation' | 'tracking' | 'no-helpers';

interface LocationData {
    latitude: number;
    longitude: number;
    address: string;
    accuracy: number;
}

const EMERGENCY_TYPES: { type: EmergencyType; icon: string; label: string }[] = [
    { type: 'MEDICAL', icon: '🚑', label: 'Medical Emergency' },
    { type: 'FIRE', icon: '🔥', label: 'Fire Emergency' },
    { type: 'ACCIDENT', icon: '🚗', label: 'Accident' },
    { type: 'PERSON_IN_DISTRESS', icon: '👤', label: 'Person in Distress' },
    { type: 'WATER', icon: '💧', label: 'Water Emergency' },
    { type: 'OTHER', icon: '📦', label: 'Other Emergency' },
];

const EmergencySignalPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showToast } = useNotifications();

    // Flow state
    const [step, setStep] = useState<FlowStep>('form');
    const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [location, setLocation] = useState<LocationData | null>(null);
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState('');
    const [manualAddress, setManualAddress] = useState('');
    const [searchingAddress, setSearchingAddress] = useState(false);

    // Result state
    const [alertData, setAlertData] = useState<any>(null);
    const [notifiedCount, setNotifiedCount] = useState(0);
    const [nearestHelpers, setNearestHelpers] = useState<any[]>([]);

    // Tracking state
    const [trackingData, setTrackingData] = useState<any>(null);
    const [acceptedHelper, setAcceptedHelper] = useState<any>(null);
    const [helperStatus, setHelperStatus] = useState<string>('WAITING');
    const trackingInterval = useRef<any>(null);
    const locationWatchId = useRef<number | null>(null);

    // Reverse geocode helper
    const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=16`
            );
            const data = await res.json();
            if (data.display_name) return data.display_name.split(',').slice(0, 4).join(',').trim();
        } catch { }
        return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
    };

    // IP-based location fallback
    const fetchIPLocation = async (): Promise<LocationData | null> => {
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data.latitude && data.longitude) {
                const address = await reverseGeocode(data.latitude, data.longitude);
                return {
                    latitude: data.latitude,
                    longitude: data.longitude,
                    address,
                    accuracy: 5000,
                };
            }
        } catch { }
        return null;
    };

    // Get GPS location with multiple fallbacks
    const fetchLocation = useCallback(async () => {
        setLocationLoading(true);
        setLocationError('');

        // Strategy 1: Try browser geolocation (high accuracy first, then low accuracy)
        const tryBrowserGeo = (highAccuracy: boolean): Promise<LocationData | null> => {
            return new Promise((resolve) => {
                if (!navigator.geolocation) { resolve(null); return; }
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        const { latitude, longitude, accuracy } = pos.coords;
                        const address = await reverseGeocode(latitude, longitude);
                        resolve({ latitude, longitude, address, accuracy: Math.round(accuracy) });
                    },
                    () => resolve(null),
                    { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 15000 : 10000, maximumAge: 0 }
                );
            });
        };

        // Try high accuracy GPS
        let loc = await tryBrowserGeo(true);
        if (!loc) {
            // Fallback: low accuracy (usually faster on desktop)
            loc = await tryBrowserGeo(false);
        }
        if (!loc) {
            // Fallback: IP-based geolocation
            loc = await fetchIPLocation();
        }

        if (loc) {
            setLocation(loc);
            setLocationLoading(false);

            // Start continuous location watching for live accuracy improvements
            if (navigator.geolocation && locationWatchId.current === null) {
                locationWatchId.current = navigator.geolocation.watchPosition(
                    async (pos) => {
                        const { latitude, longitude, accuracy } = pos.coords;
                        const address = await reverseGeocode(latitude, longitude);
                        setLocation({ latitude, longitude, address, accuracy: Math.round(accuracy) });
                    },
                    () => {},
                    { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
                );
            }
        } else {
            setLocationError('Unable to detect location. Please search your address below.');
            setLocationLoading(false);
        }
    }, []);

    // Manual address search
    const searchAddress = async () => {
        if (!manualAddress.trim() || manualAddress.trim().length < 3) return;
        setSearchingAddress(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualAddress.trim())}&format=json&limit=1&countrycodes=in`
            );
            const data = await res.json();
            if (data.length > 0) {
                const { lat, lon, display_name } = data[0];
                setLocation({
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon),
                    address: display_name.split(',').slice(0, 4).join(',').trim(),
                    accuracy: 500,
                });
                setLocationError('');
            } else {
                showToast('Address not found. Try a more specific location.', 'warning');
            }
        } catch {
            showToast('Search failed. Please try again.', 'warning');
        }
        setSearchingAddress(false);
    };

    useEffect(() => { fetchLocation(); }, [fetchLocation]);

    // Photo handler
    const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('Photo must be under 5MB', 'warning'); return; }
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPhoto(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    // Send emergency alert
    const sendAlert = async () => {
        if (!selectedType || !location) return;
        setStep('sending');

        // Refresh location right before sending for maximum accuracy
        try {
            const freshLoc = await new Promise<LocationData | null>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        const { latitude, longitude, accuracy } = pos.coords;
                        const address = await reverseGeocode(latitude, longitude);
                        resolve({ latitude, longitude, address, accuracy: Math.round(accuracy) });
                    },
                    () => resolve(null),
                    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
                );
            });
            if (freshLoc) setLocation(freshLoc);
        } catch {}
        try {
            let photoUrl = '';
            if (photoFile) {
                const fd = new FormData();
                fd.append('file', photoFile);
                try {
                    const upRes = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                    photoUrl = upRes.data?.data?.url || '';
                } catch { /* photo optional */ }
            }
            const res = await api.post('/emergency/create', {
                emergencyType: selectedType,
                description,
                photo: photoUrl,
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: location.address,
                    accuracy: location.accuracy,
                },
            });
            if (res.data.status === 'success') {
                setAlertData(res.data.data.alert);
                setNotifiedCount(res.data.data.notifiedCount);
                setNearestHelpers(res.data.data.nearestHelpers || []);
                setStep(res.data.data.notifiedCount > 0 ? 'confirmation' : 'no-helpers');
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to send alert', 'warning');
            setStep('form');
        }
    };

    // Start tracking polling
    const startTracking = () => {
        if (!alertData?._id) return;
        setStep('tracking');
        const poll = async () => {
            try {
                const res = await api.get(`/emergency/${alertData._id}/status`);
                if (res.data.status === 'success') {
                    setTrackingData(res.data.data);
                    if (res.data.data.acceptedHelper) {
                        setAcceptedHelper(res.data.data.acceptedHelper);
                        setHelperStatus('ACCEPTED');
                    }
                    if (res.data.data.alert?.status === 'RESOLVED') setHelperStatus('RESOLVED');
                    if (res.data.data.alert?.status === 'EXPIRED') setHelperStatus('EXPIRED');
                }
            } catch { }
        };
        poll();
        trackingInterval.current = setInterval(poll, 5000);
    };

    useEffect(() => () => {
        if (trackingInterval.current) clearInterval(trackingInterval.current);
        if (locationWatchId.current !== null) {
            navigator.geolocation.clearWatch(locationWatchId.current);
            locationWatchId.current = null;
        }
    }, []);

    // Cancel alert
    const cancelAlert = async () => {
        if (!alertData?._id) return;
        try {
            await api.delete(`/emergency/${alertData._id}/cancel`);
            showToast('Emergency alert cancelled', 'info');
            if (trackingInterval.current) clearInterval(trackingInterval.current);
            navigate('/dashboard');
        } catch { showToast('Failed to cancel alert', 'warning'); }
    };

    const getAccuracyLabel = () => {
        if (!location) return '';
        if (location.accuracy < 100) return { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'High accuracy ✓', icon: '✓' };
        if (location.accuracy < 1000) return { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Good accuracy', icon: '●' };
        return { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Approximate location', icon: '≈' };
    };
    const accInfo = getAccuracyLabel();

    // ── RENDER ──
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 pt-24 pb-12 px-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-100/30 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="max-w-2xl mx-auto relative z-10">

                {/* ═══ STEP: FORM ═══ */}
                <AnimatePresence mode="wait">
                    {step === 'form' && (
                        <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                                    <ChevronLeft size={18} /> Back
                                </button>
                                <button onClick={() => navigate('/dashboard')} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="text-center space-y-2">
                                <div className="text-5xl animate-pulse">🚨</div>
                                <h1 className="text-3xl font-black text-red-600 tracking-tight">EMERGENCY SIGNAL</h1>
                                <p className="text-gray-500 text-sm">Alert nearby helpers about an emergency</p>
                            </div>

                            {/* Location Box */}
                            <div className={`rounded-xl border p-4 ${locationLoading ? 'bg-gray-50 border-gray-200' : location ? (accInfo as any)?.bg || 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <MapPin size={20} className={locationLoading ? 'text-gray-400 animate-pulse' : location ? (accInfo as any)?.color || 'text-blue-600' : 'text-red-500'} />
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Your Location</p>
                                            {locationLoading ? (
                                                <div className="space-y-1">
                                                    <p className="text-sm text-gray-400 flex items-center gap-2">
                                                        <Loader2 size={14} className="animate-spin" /> Detecting location...
                                                    </p>
                                                    <p className="text-xs text-gray-300">Trying GPS, network, and IP-based detection</p>
                                                </div>
                                            ) : locationError && !location ? (
                                                <p className="text-sm text-red-500">{locationError}</p>
                                            ) : location ? (
                                                <>
                                                    <p className="text-sm font-semibold text-gray-800">{location.address}</p>
                                                    <p className={`text-xs mt-1 ${(accInfo as any)?.color || 'text-gray-400'}`}>
                                                        {(accInfo as any)?.label} {location.accuracy < 5000 ? `(~${location.accuracy}m)` : '(IP-based)'}
                                                    </p>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                    <button onClick={fetchLocation} disabled={locationLoading} className="text-xs font-bold text-blue-600 hover:text-blue-800 shrink-0 disabled:text-gray-300">
                                        {locationLoading ? '...' : 'Refresh'}
                                    </button>
                                </div>

                                {/* Manual address search */}
                                <div className="mt-3 pt-3 border-t border-gray-200/50">
                                    <p className="text-xs text-gray-400 mb-2">
                                        {location ? 'Wrong location? Search your address:' : 'Or search your address:'}
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={manualAddress}
                                            onChange={(e) => setManualAddress(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
                                            placeholder="e.g. Gandhi Road, Coimbatore"
                                            className="flex-1 h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                                        />
                                        <button
                                            onClick={searchAddress}
                                            disabled={searchingAddress || !manualAddress.trim()}
                                            className="px-4 h-9 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            {searchingAddress ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                                            {searchingAddress ? 'Searching...' : 'Search'}
                                        </button>
                                    </div>
                                </div>

                                {/* Live Map Preview */}
                                {location && (
                                    <div className="mt-3 rounded-xl overflow-hidden border border-gray-200/50 h-40">
                                        <iframe
                                            title="Your Location"
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            style={{ border: 0 }}
                                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.015}%2C${location.latitude - 0.01}%2C${location.longitude + 0.015}%2C${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`}
                                            allowFullScreen
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Emergency Type Selection */}
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">What's the emergency?</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {EMERGENCY_TYPES.map((et) => (
                                        <button
                                            key={et.type}
                                            onClick={() => setSelectedType(et.type)}
                                            className={`rounded-xl border-2 p-4 text-center transition-all hover:shadow-md ${selectedType === et.type
                                                ? 'border-red-500 bg-red-50 shadow-lg shadow-red-100'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="text-3xl mb-2">{et.icon}</div>
                                            <p className="text-xs font-bold text-gray-700">{et.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Photo Upload */}
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Take Photo <span className="font-normal text-gray-400">(Optional but recommended)</span></p>
                                {photo ? (
                                    <div className="relative inline-block">
                                        <img src={photo} alt="Emergency" className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200" />
                                        <button onClick={() => { setPhoto(null); setPhotoFile(null); }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">✕</button>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center gap-2 h-20 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 cursor-pointer hover:border-gray-400 hover:bg-gray-100 transition-colors">
                                        <Camera size={20} className="text-gray-400" />
                                        <span className="text-sm text-gray-500">Take photo or upload</span>
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                                    </label>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Describe the Situation <span className="font-normal text-gray-400">(Optional)</span></p>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                                    placeholder="Accident on NH44, person unconscious, need immediate medical help..."
                                    rows={3}
                                    className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 resize-none transition-all"
                                />
                                <p className="text-xs text-gray-400 text-right mt-1">{description.length}/500</p>
                            </div>

                            {/* Warning */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
                                <p className="font-bold flex items-center gap-1"><AlertTriangle size={14} /> IMPORTANT:</p>
                                <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                                    <li>This will alert ALL helpers within 10 km radius</li>
                                    <li>Only use for genuine emergencies</li>
                                    <li>False alerts may suspend your account</li>
                                    <li>Helpers will see your name and contact info</li>
                                </ul>
                            </div>

                            {/* Confirmation Checkbox */}
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="w-5 h-5 rounded border-2 border-gray-300 text-red-600 focus:ring-red-500 accent-red-600" />
                                <span className="text-sm font-semibold text-gray-700">I confirm this is a genuine emergency</span>
                            </label>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button onClick={() => navigate('/dashboard')} className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors">Cancel</button>
                                <button
                                    onClick={sendAlert}
                                    disabled={!selectedType || !location || !confirmed || locationLoading}
                                    className={`flex-[2] h-14 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${!selectedType || !location || !confirmed || locationLoading
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-xl shadow-red-200 hover:shadow-2xl hover:-translate-y-0.5 animate-pulse'
                                        }`}
                                >
                                    🚨 SEND EMERGENCY SIGNAL
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ STEP: SENDING ═══ */}
                    {step === 'sending' && (
                        <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-6">
                            <div className="relative mx-auto w-24 h-24">
                                <div className="absolute inset-0 rounded-full border-4 border-red-200 animate-ping" />
                                <div className="absolute inset-2 rounded-full border-4 border-red-300 animate-ping" style={{ animationDelay: '0.3s' }} />
                                <div className="absolute inset-4 rounded-full bg-red-500 flex items-center justify-center">
                                    <Radio size={28} className="text-white animate-pulse" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-red-600">SENDING ALERT...</h2>
                            <div className="text-sm text-gray-500 space-y-1">
                                <p>• Scanning 10 km radius</p>
                                <p>• Checking helper availability</p>
                                <p>• Sending emergency notifications</p>
                            </div>
                            <p className="text-xs text-gray-400">Please wait...</p>
                        </motion.div>
                    )}

                    {/* ═══ STEP: CONFIRMATION ═══ */}
                    {step === 'confirmation' && (
                        <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                            <div className="text-center space-y-3">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }} className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={40} className="text-emerald-600" />
                                </motion.div>
                                <h2 className="text-3xl font-black text-emerald-600">ALERT SENT!</h2>
                                <p className="text-gray-500">Emergency signal sent successfully</p>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5 space-y-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                    <Users size={18} className="text-blue-600" />
                                    <span>{notifiedCount} helpers within 10 km have been alerted</span>
                                </div>
                                {nearestHelpers.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Nearest Helpers:</p>
                                        {nearestHelpers.map((h: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">{h.name?.[0] || 'H'}</div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{h.name}</p>
                                                        <p className="text-xs text-gray-400">{h.helps} helps • ⭐ {h.rating}</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-blue-600">{h.distance} km</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1">
                                <p className="font-bold">NEXT STEPS:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>Helpers will see your alert and location</li>
                                    <li>Nearest available helper will respond</li>
                                    <li>You'll be notified when a helper accepts</li>
                                    <li>You can track helper's location in real-time</li>
                                </ul>
                            </div>

                            {alertData && (
                                <div className="text-xs text-gray-400 space-y-0.5">
                                    <p>Alert ID: #{alertData.alertId}</p>
                                    <p>Time: {new Date(alertData.createdAt).toLocaleTimeString()}</p>
                                    <p>Location: {alertData.location?.address}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={startTracking} className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-200 hover:shadow-xl transition-all flex items-center justify-center gap-2">
                                    <Navigation size={16} /> Track Helpers
                                </button>
                                <button onClick={() => navigate('/dashboard')} className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors">Dashboard</button>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ STEP: TRACKING ═══ */}
                    {step === 'tracking' && (
                        <motion.div key="tracking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                            <div className="flex items-center justify-between">
                                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ChevronLeft size={18} /> Back</button>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Emergency #{alertData?.alertId?.slice(-4)}</span>
                            </div>

                            {/* Live Map — OpenStreetMap Embed */}
                            <div className="h-64 rounded-2xl border border-gray-200 overflow-hidden relative">
                                {alertData?.location ? (
                                    <iframe
                                        title="Emergency Location"
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        style={{ border: 0 }}
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${alertData.location.longitude - 0.02}%2C${alertData.location.latitude - 0.015}%2C${alertData.location.longitude + 0.02}%2C${alertData.location.latitude + 0.015}&layer=mapnik&marker=${alertData.location.latitude}%2C${alertData.location.longitude}`}
                                        allowFullScreen
                                    />
                                ) : location ? (
                                    <iframe
                                        title="Your Location"
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        style={{ border: 0 }}
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.02}%2C${location.latitude - 0.015}%2C${location.longitude + 0.02}%2C${location.latitude + 0.015}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`}
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-100 via-green-50 to-blue-50 flex items-center justify-center">
                                        <p className="text-sm text-gray-400">Map loading...</p>
                                    </div>
                                )}
                                {acceptedHelper?.location && (
                                    <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-emerald-200">
                                        <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                                            🔵 Helper en route — {acceptedHelper.distance} km away
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Status Banner */}
                            <div className={`rounded-xl p-4 text-center ${helperStatus === 'ACCEPTED' ? 'bg-emerald-50 border border-emerald-200' :
                                helperStatus === 'RESOLVED' ? 'bg-blue-50 border border-blue-200' :
                                    helperStatus === 'EXPIRED' ? 'bg-red-50 border border-red-200' :
                                        'bg-amber-50 border border-amber-200'
                                }`}>
                                {helperStatus === 'WAITING' && (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 size={16} className="animate-spin text-amber-600" />
                                        <span className="font-bold text-amber-700">Waiting for helper response...</span>
                                    </div>
                                )}
                                {helperStatus === 'ACCEPTED' && acceptedHelper && (
                                    <div className="space-y-2">
                                        <p className="font-black text-emerald-700 text-lg">✅ HELPER RESPONDING!</p>
                                        <p className="text-sm text-emerald-600">{acceptedHelper.name} is on their way</p>
                                        <p className="text-xs text-emerald-500">Distance: {acceptedHelper.distance} km • ETA: ~{acceptedHelper.eta} minutes</p>
                                        <div className="flex gap-2 justify-center mt-2">
                                            <a href={`tel:${acceptedHelper.phone}`} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"><Phone size={12} /> Call</a>
                                        </div>
                                    </div>
                                )}
                                {helperStatus === 'RESOLVED' && <p className="font-black text-blue-700 text-lg">✅ Emergency Resolved</p>}
                                {helperStatus === 'EXPIRED' && <p className="font-black text-red-700">⏰ Alert Expired</p>}
                            </div>

                            {/* Notified Helpers */}
                            {trackingData?.notifiedHelpers?.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Notified Helpers ({trackingData.notifiedCount})</p>
                                    {trackingData.notifiedHelpers.map((h: any, i: number) => (
                                        <div key={i} className={`flex items-center justify-between py-2 rounded-lg px-3 ${h.id === acceptedHelper?.id ? 'bg-emerald-50 border border-emerald-200' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${h.id === acceptedHelper?.id ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {h.name?.[0] || 'H'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{h.name}</p>
                                                    <p className="text-xs text-gray-400">{h.helps} helps • {h.isOnline ? '🟢 Online' : '⚪ Offline'}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-500">{h.distance} km</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <a href="tel:108" className="flex-1 h-11 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center gap-1 hover:bg-gray-200"><Phone size={14} /> Call 108</a>
                                <button onClick={cancelAlert} className="flex-1 h-11 rounded-xl border border-red-200 text-red-500 font-bold text-xs hover:bg-red-50 transition-colors">Cancel Alert</button>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ STEP: NO HELPERS ═══ */}
                    {step === 'no-helpers' && (
                        <motion.div key="no-helpers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-6">
                            <div className="text-5xl">⚠️</div>
                            <h2 className="text-2xl font-black text-amber-600">NO HELPERS NEARBY</h2>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto">Unfortunately, no helpers are available within 10 km of your location right now.</p>
                            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 max-w-xs mx-auto text-left">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Alternative Options:</p>
                                <a href="tel:108" className="flex items-center gap-3 p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                                    <Phone size={18} className="text-red-600" />
                                    <div><p className="text-sm font-bold text-red-700">Call 108</p><p className="text-xs text-red-500">Ambulance</p></div>
                                </a>
                                <a href="tel:100" className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                                    <Shield size={18} className="text-blue-600" />
                                    <div><p className="text-sm font-bold text-blue-700">Call 100</p><p className="text-xs text-blue-500">Police</p></div>
                                </a>
                            </div>
                            <button onClick={() => navigate('/dashboard')} className="px-8 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors">Back to Dashboard</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default EmergencySignalPage;
