import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import {
    ChevronLeft, Phone, MapPin, Navigation, CheckCircle2,
    Clock, X, Shield, Settings, Bell, Radio, Loader2,
    AlertTriangle, Star, ChevronRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type TabView = 'active' | 'history' | 'settings';

const HelperEmergencyPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useNotifications();
    const { alertId: routeAlertId } = useParams<{ alertId?: string }>();

    const [tab, setTab] = useState<TabView>('active');
    const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
    const [history, setHistory] = useState<any>({ responses: [], alerts: [] });
    const [isLoading, setIsLoading] = useState(true);

    // Respond flow
    const [respondingAlert, setRespondingAlert] = useState<any>(null);
    const [respondData, setRespondData] = useState<any>(null);
    const [isResponding, setIsResponding] = useState(false);
    const [helperLocation, setHelperLocation] = useState<{ lat: number; lng: number } | null>(null);
    const locationInterval = useRef<any>(null);

    // Settings
    const [settings, setSettings] = useState<any>({
        isAvailable: true,
        emergencySettings: {
            maxDistance: 10,
            alertTypes: ['MEDICAL', 'FIRE', 'ACCIDENT', 'PERSON_IN_DISTRESS', 'WATER', 'OTHER'],
            notificationSound: 'loud',
            quietHoursEnabled: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '06:00',
        },
    });

    // ── Fetch data ──
    const fetchActive = useCallback(async () => {
        try {
            const res = await api.get('/emergency/helper/active');
            if (res.data.status === 'success') setActiveAlerts(res.data.data.alerts);
        } catch { }
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await api.get('/emergency/helper/history');
            if (res.data.status === 'success') setHistory(res.data.data);
        } catch { }
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await api.get('/emergency/helper/settings');
            if (res.data.status === 'success') setSettings(res.data.data);
        } catch { }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        Promise.all([fetchActive(), fetchHistory(), fetchSettings()]).finally(() => setIsLoading(false));
    }, [fetchActive, fetchHistory, fetchSettings]);

    // Auto-refresh active alerts
    useEffect(() => {
        const iv = setInterval(fetchActive, 10000);
        return () => clearInterval(iv);
    }, [fetchActive]);

    // Update helper location on mount and periodically
    useEffect(() => {
        const updateLoc = () => {
            navigator.geolocation?.getCurrentPosition(
                (pos) => {
                    setHelperLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    api.post('/emergency/helper/location/update', {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                    }).catch(() => { });
                },
                () => { },
                { enableHighAccuracy: true }
            );
        };
        updateLoc();
        locationInterval.current = setInterval(updateLoc, 15000);
        return () => { if (locationInterval.current) clearInterval(locationInterval.current); };
    }, []);

    // ── Accept alert ──
    const acceptAlert = async (alertId: string) => {
        setIsResponding(true);
        try {
            const res = await api.post(`/emergency/helper/${alertId}/accept`);
            if (res.data.status === 'success') {
                setRespondData(res.data.data);
                setRespondingAlert(res.data.data.alert);
                showToast('Emergency accepted! Navigate to location.', 'success');
                fetchActive();
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to accept alert', 'warning');
        } finally {
            setIsResponding(false);
        }
    };

    // Mark arrived
    const markArrived = async () => {
        if (!respondingAlert?._id) return;
        try {
            await api.post(`/emergency/helper/${respondingAlert._id}/arrive`);
            showToast('Arrival marked!', 'success');
        } catch { }
    };

    // Resolve
    const resolveEmergency = async () => {
        if (!respondingAlert?._id) return;
        try {
            await api.post(`/emergency/helper/${respondingAlert._id}/resolve`);
            showToast('Emergency resolved! Thank you for helping! 🎉', 'success');
            setRespondingAlert(null);
            setRespondData(null);
            fetchActive();
            fetchHistory();
        } catch { }
    };

    // Save settings
    const saveSettings = async () => {
        try {
            await api.patch('/emergency/helper/settings', {
                isAvailable: settings.isAvailable,
                ...settings.emergencySettings,
            });
            showToast('Settings saved!', 'success');
        } catch { showToast('Failed to save settings', 'warning'); }
    };

    const emergencyLabels: Record<string, string> = {
        MEDICAL: '🚑 Medical', FIRE: '🔥 Fire', ACCIDENT: '🚗 Accident',
        PERSON_IN_DISTRESS: '👤 Distress', WATER: '💧 Water', OTHER: '📦 Other',
    };

    // ── RESPONDING VIEW ──
    if (respondingAlert) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 pt-24 pb-12 px-4">
                <div className="max-w-2xl mx-auto space-y-5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-blue-600">Emergency Response</span>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">#{respondingAlert.alertId?.slice(-4)}</span>
                    </div>

                    {/* Route Navigation Map */}
                    <div className="h-64 rounded-2xl bg-gray-100 border border-gray-200 relative overflow-hidden shadow-inner isolate">
                        {helperLocation && respondingAlert.location?.latitude ? (
                            <MapContainer
                                bounds={[[helperLocation.lat, helperLocation.lng], [respondingAlert.location.latitude, respondingAlert.location.longitude]]}
                                scrollWheelZoom={false}
                                style={{ height: '100%', width: '100%', zIndex: 1 }}
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://carto.com/">Carto</a>'
                                />
                                <Marker position={[helperLocation.lat, helperLocation.lng]}>
                                    <Popup>You are here</Popup>
                                </Marker>
                                <Marker position={[respondingAlert.location.latitude, respondingAlert.location.longitude]}>
                                    <Popup>{respondingAlert.location.address}</Popup>
                                </Marker>
                                {/* Dashed line representing route direction direction */}
                                <Polyline positions={[
                                    [helperLocation.lat, helperLocation.lng],
                                    [respondingAlert.location.latitude, respondingAlert.location.longitude]
                                ]} color="#3b82f6" weight={4} dashArray="10, 10" />
                            </MapContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center z-10 space-y-3">
                                    <Loader2 className="animate-spin text-blue-500 mx-auto" size={28} />
                                    <p className="text-sm font-bold text-gray-500">Connecting to GPS...</p>
                                </div>
                            </div>
                        )}

                        {/* Overlay metric */}
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-gray-100 z-[400] flex flex-col items-center">
                            <span className="text-sm font-black text-blue-600">{respondData?.distance} km</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">~{respondData?.eta} Min ETA</span>
                        </div>
                    </div>

                    {/* Navigation Info */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                        <div className="text-center">
                            <p className="text-2xl font-black text-blue-600">{respondData?.distance} km</p>
                            <p className="text-xs text-gray-400">~{respondData?.eta} minutes ETA</p>
                        </div>
                        <div className="border-t border-gray-100 pt-3 space-y-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Emergency Details</p>
                            <p className="text-sm">{emergencyLabels[respondingAlert.emergencyType] || respondingAlert.emergencyType}</p>
                            <p className="text-sm text-gray-600">{respondingAlert.description || 'No description'}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <MapPin size={12} /> {respondingAlert.location?.address}
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-3 space-y-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Reported By</p>
                            <p className="text-sm font-semibold">{respondingAlert.donorName}</p>
                            <a href={`tel:${respondingAlert.donorPhone}`} className="inline-flex items-center gap-1 text-xs text-blue-600 font-bold"><Phone size={12} /> {respondingAlert.donorPhone}</a>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={markArrived} className="flex-1 h-12 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200">
                            <CheckCircle2 size={16} /> I've Arrived
                        </button>
                        <button onClick={resolveEmergency} className="flex-1 h-12 rounded-xl bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200">
                            <Shield size={16} /> Mark Resolved
                        </button>
                    </div>

                    {/* Open in maps */}
                    {respondingAlert.location && (
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${respondingAlert.location.latitude},${respondingAlert.location.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-center h-11 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                        >
                            <Navigation size={14} /> Open in Google Maps
                        </a>
                    )}
                </div>
            </div>
        );
    }

    // ── MAIN VIEW ──
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/20 pt-24 pb-12 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ChevronLeft size={18} /> Dashboard</button>
                    <h1 className="text-lg font-black text-gray-800 flex items-center gap-2">🚨 Emergency Alerts</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    {(['active', 'history', 'settings'] as TabView[]).map((t) => (
                        <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${tab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {t === 'active' ? `Active (${activeAlerts.length})` : t === 'history' ? 'History' : 'Settings'}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* ── Active Tab ── */}
                    {tab === 'active' && (
                        <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                            {isLoading ? (
                                <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-gray-400" size={28} /></div>
                            ) : activeAlerts.length === 0 ? (
                                <div className="text-center py-16 space-y-3">
                                    <div className="text-4xl">🔔</div>
                                    <p className="text-sm font-bold text-gray-500">No active emergency alerts</p>
                                    <p className="text-xs text-gray-400">You'll be notified instantly when an emergency occurs near you.</p>
                                </div>
                            ) : activeAlerts.map((alert: any) => (
                                <motion.div key={alert._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-xl border-2 border-red-200 p-5 space-y-3 shadow-lg shadow-red-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{emergencyLabels[alert.emergencyType]?.split(' ')[0] || '🚨'}</span>
                                            <div>
                                                <p className="font-black text-red-600">{emergencyLabels[alert.emergencyType] || alert.emergencyType}</p>
                                                <p className="text-xs text-gray-400">{alert.donorName} • Just now</p>
                                            </div>
                                        </div>
                                        <span className="text-lg font-black text-blue-600">{alert.distance} km</span>
                                    </div>
                                    {alert.description && <p className="text-sm text-gray-600">{alert.description}</p>}
                                    <div className="flex items-center gap-2 text-xs text-gray-400"><MapPin size={12} /> {alert.location?.address}</div>
                                    <div className="flex gap-3">
                                        <button onClick={() => acceptAlert(alert._id)} disabled={isResponding}
                                            className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-xl transition-all disabled:opacity-50">
                                            {isResponding ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} I'LL HELP
                                        </button>
                                        <button className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-500 font-bold text-xs hover:bg-gray-200 transition-colors">Can't Help</button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* ── History Tab ── */}
                    {tab === 'history' && (
                        <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                            {history.alerts?.length === 0 ? (
                                <div className="text-center py-16"><p className="text-sm text-gray-400">No emergency history yet.</p></div>
                            ) : history.alerts?.map((a: any, i: number) => (
                                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${a.status === 'RESOLVED' ? 'bg-emerald-100' : a.status === 'EXPIRED' ? 'bg-gray-100' : 'bg-amber-100'}`}>
                                            {emergencyLabels[a.emergencyType]?.split(' ')[0] || '🚨'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{emergencyLabels[a.emergencyType] || a.emergencyType}</p>
                                            <p className="text-xs text-gray-400">{a.location?.address} • {new Date(a.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full ${a.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                                        a.status === 'EXPIRED' ? 'bg-gray-100 text-gray-500' :
                                            a.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                                                'bg-amber-100 text-amber-700'
                                        }`}>{a.status}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* ── Settings Tab ── */}
                    {tab === 'settings' && (
                        <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">Available for Emergencies</p>
                                        <p className="text-xs text-gray-400">Turn off when not available</p>
                                    </div>
                                    <button
                                        onClick={() => setSettings((s: any) => ({ ...s, isAvailable: !s.isAvailable }))}
                                        className={`w-12 h-7 rounded-full transition-colors relative ${settings.isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${settings.isAvailable ? 'left-6' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Notification Distance</p>
                                    {[10, 15, 25, 50].map((d) => (
                                        <label key={d} className="flex items-center gap-3 py-2 cursor-pointer">
                                            <input type="radio" name="dist" checked={settings.emergencySettings?.maxDistance === d}
                                                onChange={() => setSettings((s: any) => ({ ...s, emergencySettings: { ...s.emergencySettings, maxDistance: d } }))}
                                                className="accent-red-600 w-4 h-4" />
                                            <span className="text-sm text-gray-700">{d} km {d === 10 ? '(Recommended)' : d === 50 ? '(Very far)' : ''}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Notification Sound</p>
                                    {(['loud', 'standard', 'vibration'] as const).map((s) => (
                                        <label key={s} className="flex items-center gap-3 py-2 cursor-pointer">
                                            <input type="radio" name="sound" checked={settings.emergencySettings?.notificationSound === s}
                                                onChange={() => setSettings((prev: any) => ({ ...prev, emergencySettings: { ...prev.emergencySettings, notificationSound: s } }))}
                                                className="accent-red-600 w-4 h-4" />
                                            <span className="text-sm text-gray-700 capitalize">{s === 'loud' ? 'Loud siren (Recommended)' : s === 'standard' ? 'Standard notification' : 'Vibration only'}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button onClick={saveSettings} className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-200 hover:shadow-xl transition-all">
                                Save Settings
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default HelperEmergencyPage;
