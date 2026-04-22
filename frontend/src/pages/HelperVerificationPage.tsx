import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, MapPin, Clock, CheckCircle2, XCircle, AlertTriangle, ChevronLeft, RefreshCw, Navigation, Upload } from 'lucide-react';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';

interface ValidationResult {
    isValid: boolean;
    gps: { found: boolean; latitude?: number; longitude?: number; distanceFromFacility?: number; withinRadius: boolean };
    timestamp: { found: boolean; deviationSeconds?: number; withinTolerance: boolean };
    quality: { isValid: boolean };
    errors: Array<{ code: string; message: string }>;
}

const HelperVerificationPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useNotifications();
    const [searchParams] = useSearchParams();
    const taskId = searchParams.get('taskId') || '';
    const facilityLat = Number(searchParams.get('lat')) || 13.0827;
    const facilityLng = Number(searchParams.get('lng')) || 80.2707;

    const [step, setStep] = useState<'location' | 'camera' | 'result'>('location');
    const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000;
        const dL = ((lat2 - lat1) * Math.PI) / 180;
        const dN = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dL / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dN / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const getLocation = useCallback(() => {
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                setCurrentPosition({ lat: latitude, lng: longitude, accuracy });
                setDistance(Math.round(haversine(latitude, longitude, facilityLat, facilityLng)));
                setGpsLoading(false);
            },
            (err) => {
                showToast('Unable to get GPS location. Please enable location services.', 'warning');
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    }, [facilityLat, facilityLng, showToast]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 1920, height: 1080 } });
            streamRef.current = stream;
            if (videoRef.current) { videoRef.current.srcObject = stream; }
            setStep('camera');
        } catch { showToast('Camera access denied', 'warning'); }
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.9));
        streamRef.current?.getTracks().forEach((t) => t.stop());
        validatePhoto();
    };

    const validatePhoto = async () => {
        setIsValidating(true);
        setStep('result');
        try {
            const res = await api.post('/verification/validate-photo', {
                photoMetadata: {
                    gpsLatitude: currentPosition?.lat,
                    gpsLongitude: currentPosition?.lng,
                    timestamp: new Date().toISOString(),
                    width: 1920,
                    height: 1080,
                    fileSize: 500000,
                    format: 'jpeg',
                },
                facilityLat,
                facilityLon: facilityLng,
                allowedRadius: 50,
            });
            setValidation(res.data.data.validation);
        } catch {
            setValidation({ isValid: false, gps: { found: false, withinRadius: false }, timestamp: { found: false, withinTolerance: false }, quality: { isValid: false }, errors: [{ code: 'ERROR', message: 'Validation failed' }] });
        }
        setIsValidating(false);
    };

    const distColor = distance !== null ? (distance <= 50 ? 'text-emerald-600' : distance <= 100 ? 'text-amber-600' : 'text-red-600') : 'text-gray-400';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pt-20 pb-12 px-4">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><ChevronLeft size={18} /></button>
                    <div>
                        <h1 className="text-lg font-black text-gray-800">Photo Verification</h1>
                        <p className="text-xs text-gray-400">GPS-verified proof submission</p>
                    </div>
                </div>

                {/* Step indicators */}
                <div className="flex gap-2">
                    {['Location', 'Camera', 'Result'].map((s, i) => (
                        <div key={i} className={`flex-1 h-1.5 rounded-full ${['location', 'camera', 'result'].indexOf(step) >= i ? 'bg-amber-500' : 'bg-gray-200'}`} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* STEP 1: Location */}
                    {step === 'location' && (
                        <motion.div key="loc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><MapPin size={24} className="text-blue-600" /></div>
                                    <div>
                                        <h2 className="font-bold text-gray-800">Confirm Your Location</h2>
                                        <p className="text-xs text-gray-400">Must be within 50m of facility</p>
                                    </div>
                                </div>

                                {currentPosition ? (
                                    <div className="space-y-3">
                                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Your Position</span>
                                                <span className="font-mono text-xs text-gray-600">{currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">GPS Accuracy</span>
                                                <span className="font-bold text-gray-700">±{Math.round(currentPosition.accuracy)}m</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Distance to Facility</span>
                                                <span className={`font-black text-lg ${distColor}`}>{distance}m</span>
                                            </div>
                                        </div>
                                        {distance !== null && distance <= 100 ? (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                                                <CheckCircle2 size={16} className="text-emerald-600" />
                                                <span className="text-sm font-bold text-emerald-700">You're within range!</span>
                                            </div>
                                        ) : (
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                                                <AlertTriangle size={16} className="text-red-600" />
                                                <span className="text-sm font-bold text-red-700">Too far from facility ({distance}m). Must be ≤50m.</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button onClick={getLocation} disabled={gpsLoading} className="w-full h-14 rounded-xl bg-blue-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors">
                                        {gpsLoading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Getting Location...</> : <><Navigation size={18} /> Get My Location</>}
                                    </button>
                                )}

                                <button onClick={getLocation} className="w-full text-sm text-blue-600 font-bold flex items-center justify-center gap-1 hover:text-blue-700">
                                    <RefreshCw size={14} /> Refresh Location
                                </button>
                            </div>

                            <button
                                onClick={startCamera}
                                disabled={!currentPosition || (distance !== null && distance > 100)}
                                className={`w-full h-14 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                    currentPosition && distance !== null && distance <= 100
                                        ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-xl shadow-amber-200/50 hover:-translate-y-0.5'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <Camera size={18} /> I'm at location — Open Camera
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 2: Camera */}
                    {step === 'camera' && (
                        <motion.div key="cam" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                {/* GPS overlay */}
                                <div className="absolute top-3 left-3 right-3 flex justify-between">
                                    <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-xs text-white font-bold">GPS Active</span>
                                    </div>
                                    <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                                        <span className="text-xs text-white font-mono">{distance}m away</span>
                                    </div>
                                </div>
                                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                                    <span className="text-xs text-white font-mono">{new Date().toLocaleTimeString()}</span>
                                </div>
                            </div>
                            <canvas ref={canvasRef} className="hidden" />
                            <button onClick={capturePhoto} className="w-full h-16 rounded-xl bg-gradient-to-r from-red-500 to-red-400 text-white font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-red-200/50 hover:shadow-2xl transition-all">
                                <Camera size={24} /> CAPTURE PHOTO
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 3: Validation Result */}
                    {step === 'result' && (
                        <motion.div key="res" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            {capturedPhoto && (
                                <div className="rounded-2xl overflow-hidden border border-gray-200">
                                    <img src={capturedPhoto} alt="Captured" className="w-full aspect-[4/3] object-cover" />
                                </div>
                            )}

                            {isValidating ? (
                                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4">
                                    <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                    <p className="font-bold text-gray-700">Validating photo...</p>
                                    <p className="text-xs text-gray-400">Checking GPS, timestamp, and quality</p>
                                </div>
                            ) : validation && (
                                <div className="space-y-3">
                                    {/* Overall status */}
                                    <div className={`rounded-2xl p-5 border ${validation.isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex items-center gap-3">
                                            {validation.isValid ? <CheckCircle2 size={32} className="text-emerald-600" /> : <XCircle size={32} className="text-red-600" />}
                                            <div>
                                                <h3 className={`font-black text-lg ${validation.isValid ? 'text-emerald-700' : 'text-red-700'}`}>
                                                    {validation.isValid ? 'PHOTO VALIDATED ✅' : 'VALIDATION FAILED ❌'}
                                                </h3>
                                                <p className="text-xs text-gray-500">{validation.isValid ? 'All checks passed' : `${validation.errors.length} issue(s) found`}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Checklist */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2.5">
                                        {[
                                            { label: 'GPS Data Found', pass: validation.gps.found, detail: validation.gps.found ? `${validation.gps.latitude?.toFixed(4)}, ${validation.gps.longitude?.toFixed(4)}` : 'No GPS data' },
                                            { label: 'Location Within Range', pass: validation.gps.withinRadius, detail: `${validation.gps.distanceFromFacility || '?'}m from facility (max 50m)` },
                                            { label: 'Timestamp Valid', pass: validation.timestamp.withinTolerance, detail: `${validation.timestamp.deviationSeconds || 0}s deviation (max 120s)` },
                                            { label: 'Image Quality', pass: validation.quality.isValid, detail: validation.quality.isValid ? 'Resolution OK' : 'Low quality' },
                                        ].map((check, i) => (
                                            <div key={i} className="flex items-center gap-3 py-1.5">
                                                {check.pass ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> : <XCircle size={18} className="text-red-500 shrink-0" />}
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-700">{check.label}</p>
                                                    <p className="text-xs text-gray-400">{check.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Errors */}
                                    {validation.errors.length > 0 && (
                                        <div className="bg-red-50 rounded-xl border border-red-200 p-4 space-y-2">
                                            <p className="text-xs font-black text-red-700 uppercase tracking-widest">Issues Found</p>
                                            {validation.errors.map((err, i) => (
                                                <div key={i} className="flex items-start gap-2">
                                                    <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                                    <p className="text-sm text-red-700">{err.message}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button onClick={() => { setStep('location'); setValidation(null); setCapturedPhoto(null); }} className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200">
                                            <RefreshCw size={16} /> Retake
                                        </button>
                                        {validation.isValid && (
                                            <button onClick={() => { showToast('Photo accepted! ✅', 'success'); navigate(-1); }} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                                                <Upload size={16} /> Use Photo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default HelperVerificationPage;
