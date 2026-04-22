import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import {
    Droplets, MapPin, Phone, Building2, Clock, AlertCircle,
    ChevronLeft, Plus, X, Heart, CheckCircle2, Users,
    Navigation, Zap, Search
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components/design-system/Button';
import { Card } from '../components/design-system/Card';
import { Input } from '../components/design-system/Input';
import { Badge } from '../components/design-system/Badge';

const appleEase = [0.25, 0.1, 0.25, 1] as const;

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_OPTIONS = [
    { value: 'normal', label: 'Normal', color: 'bg-emerald-100 text-emerald-700', desc: '1-3 days' },
    { value: 'urgent', label: 'Urgent', color: 'bg-amber-100 text-amber-700', desc: '< 24h' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700', desc: 'Immediate' },
];

const BloodDonationPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useNotifications();

    const [tab, setTab] = useState<'requests' | 'my'>('requests');
    const [nearbyRequests, setNearbyRequests] = useState<any[]>([]);
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Create form
    const [formData, setFormData] = useState({
        bloodGroup: user?.profile?.bloodGroup || '',
        urgency: 'urgent',
        unitsNeeded: 1,
        hospitalName: '',
        contactNumber: '',
        description: '',
    });

    // Haversine distance calculation
    const calcDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10) / 10;
    };

    useEffect(() => {
        // Detect user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                async () => {
                    // IP fallback
                    try {
                        const res = await fetch('https://ipapi.co/json/');
                        const data = await res.json();
                        if (data.latitude && data.longitude) setUserLocation({ lat: data.latitude, lng: data.longitude });
                    } catch {}
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [nearbyRes, myRes] = await Promise.all([
                api.get('/blood-request/nearby'),
                api.get('/blood-request/my'),
            ]);
            setNearbyRequests(nearbyRes.data?.data?.requests || []);
            setMyRequests(myRes.data?.data?.requests || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRequest = async () => {
        if (!formData.bloodGroup || !formData.hospitalName || !formData.contactNumber) {
            showToast('Please fill all required fields', 'warning');
            return;
        }

        try {
            // Try to get current location, but don't block if unavailable
            const position = await new Promise<GeolocationPosition | null>((resolve) => {
                navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
                    enableHighAccuracy: true, timeout: 10000
                });
            });

            const locationData = position ? {
                type: 'Point',
                coordinates: [position.coords.longitude, position.coords.latitude],
                address: formData.hospitalName,
            } : {
                // Send [0,0] — backend will fallback to user's profile location
                type: 'Point',
                coordinates: [0, 0],
                address: formData.hospitalName,
            };

            const res = await api.post('/blood-request', {
                ...formData,
                location: locationData,
            });

            const notified = res.data?.data?.notifiedDonors || 0;
            showToast(`Blood request created! ${notified} compatible donor(s) notified.`, 'success');
            setShowCreateModal(false);
            setFormData({
                bloodGroup: user?.profile?.bloodGroup || '',
                urgency: 'urgent',
                unitsNeeded: 1,
                hospitalName: '',
                contactNumber: '',
                description: '',
            });
            fetchData();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to create request', 'error');
        }
    };

    const handleRespond = async (requestId: string) => {
        try {
            await api.post(`/blood-request/${requestId}/respond`);
            showToast('You\'ve offered to donate! The requester will be notified.', 'success');
            fetchData();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to respond', 'error');
        }
    };

    const handleAccept = async (requestId: string, donorId: string) => {
        try {
            await api.post(`/blood-request/${requestId}/accept/${donorId}`);
            showToast('Donor accepted! Contact details shared.', 'success');
            fetchData();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to accept', 'error');
        }
    };

    const getUrgencyBadge = (urgency: string) => {
        const opt = URGENCY_OPTIONS.find(o => o.value === urgency);
        return opt ? (
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", opt.color)}>
                {opt.label}
            </span>
        ) : null;
    };

    return (
        <div className="min-h-screen bg-background pt-20 pb-16 px-5 lg:px-8 relative overflow-y-auto">
            {/* Background orbs */}
            <div className="orb-blue w-[500px] h-[500px] top-[-150px] right-[-150px]" />
            <div className="orb-green w-[400px] h-[400px] bottom-[-150px] left-[-150px]" />

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-secondary-text hover:text-primary-text mb-4 transition-colors">
                        <ChevronLeft size={16} /> Back
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                                    <Droplets size={24} className="text-red-600" />
                                </div>
                                <div>
                                    <h1 className="text-[28px] font-bold text-primary-text tracking-tight">Blood Donation</h1>
                                    <p className="text-[13px] text-secondary-text">Request or donate blood to save lives</p>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            leftIcon={<Plus size={16} />}
                            onClick={() => setShowCreateModal(true)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Request Blood
                        </Button>
                    </div>

                    {/* User blood group badge */}
                    {user?.profile?.bloodGroup ? (
                        <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-red-50 rounded-xl border border-red-100">
                            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                                <span className="text-white font-black text-sm">{user.profile.bloodGroup}</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-red-800">Your Blood Group: {user.profile.bloodGroup}</p>
                                <p className="text-[11px] text-red-600/70">You'll be notified for compatible blood requests nearby</p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-xl border border-amber-100">
                            <AlertCircle size={18} className="text-amber-600" />
                            <div>
                                <p className="text-sm font-bold text-amber-800">Blood Group Not Set</p>
                                <p className="text-[11px] text-amber-600/70">
                                    <button onClick={() => navigate('/profile')} className="underline font-bold">Go to Profile</button> to set your blood group
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-black/[0.03] rounded-xl p-1">
                    {[
                        { key: 'requests', label: 'Nearby Requests', icon: <Search size={14} />, count: nearbyRequests.length },
                        { key: 'my', label: 'My Requests', icon: <Heart size={14} />, count: myRequests.length },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key as any)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-300",
                                tab === t.key
                                    ? "bg-white shadow-sm text-primary-text"
                                    : "text-secondary-text hover:text-primary-text"
                            )}
                        >
                            {t.icon} {t.label}
                            {t.count > 0 && <Badge variant="error" size="sm">{t.count}</Badge>}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : tab === 'requests' ? (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {nearbyRequests.length > 0 ? nearbyRequests.map((req, i) => (
                                <motion.div
                                    key={req._id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Card className="p-5 bg-white hover:shadow-soft-md transition-all">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                                    <span className="text-red-700 font-black text-lg">{req.bloodGroup}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-[15px] font-bold text-primary-text">{req.bloodGroup} Blood Needed</h4>
                                                    <p className="text-[12px] text-secondary-text">{req.requesterId?.profile?.fullName || 'Anonymous'}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {getUrgencyBadge(req.urgency)}
                                                {userLocation && req.location?.coordinates?.[0] && req.location.coordinates[0] !== 0 && (
                                                    <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                                                        <Navigation size={10} />
                                                        {calcDistanceKm(userLocation.lat, userLocation.lng, req.location.coordinates[1], req.location.coordinates[0])} km
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mini Map */}
                                        {req.location?.coordinates?.[0] && req.location.coordinates[0] !== 0 && (
                                            <div className="rounded-xl overflow-hidden border border-gray-100 h-28 mb-3">
                                                <iframe
                                                    title={`Location of ${req.hospitalName}`}
                                                    width="100%"
                                                    height="100%"
                                                    frameBorder="0"
                                                    style={{ border: 0 }}
                                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${req.location.coordinates[0] - 0.01}%2C${req.location.coordinates[1] - 0.008}%2C${req.location.coordinates[0] + 0.01}%2C${req.location.coordinates[1] + 0.008}&layer=mapnik&marker=${req.location.coordinates[1]}%2C${req.location.coordinates[0]}`}
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                            <div className="flex items-center gap-1.5 text-[12px] text-secondary-text">
                                                <Building2 size={12} /> {req.hospitalName}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[12px] text-secondary-text">
                                                <Droplets size={12} /> {req.unitsNeeded} unit(s)
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[12px] text-secondary-text">
                                                <Users size={12} /> {req.respondents?.length || 0} responded
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[12px] text-secondary-text">
                                                <Clock size={12} /> {new Date(req.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {req.description && (
                                            <p className="text-[12px] text-secondary-text mb-4 leading-relaxed">{req.description}</p>
                                        )}

                                        <Button
                                            onClick={() => handleRespond(req._id)}
                                            variant="primary"
                                            size="sm"
                                            className="bg-red-600 hover:bg-red-700 w-full"
                                            leftIcon={<Heart size={14} />}
                                        >
                                            I Want to Donate Blood
                                        </Button>
                                    </Card>
                                </motion.div>
                            )) : (
                                <div className="text-center py-16">
                                    <div className="w-14 h-14 bg-black/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Droplets size={24} className="text-secondary-text/40" />
                                    </div>
                                    <h4 className="text-[16px] font-semibold text-primary-text mb-1">No Active Requests</h4>
                                    <p className="text-[13px] text-secondary-text">No blood requests matching your blood group nearby</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="my"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {myRequests.length > 0 ? myRequests.map((req) => (
                                <Card key={req._id} className="p-5 bg-white">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                                <span className="text-red-700 font-black text-lg">{req.bloodGroup}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-[15px] font-bold text-primary-text">{req.hospitalName}</h4>
                                                <p className="text-[12px] text-secondary-text">{req.unitsNeeded} unit(s) needed</p>
                                            </div>
                                        </div>
                                        <Badge variant={req.status === 'active' ? 'warning' : req.status === 'fulfilled' ? 'success' : 'neutral'}>
                                            {req.status}
                                        </Badge>
                                    </div>

                                    {/* Respondents */}
                                    {req.respondents?.length > 0 && (
                                        <div className="space-y-2 mt-4">
                                            <h5 className="text-[11px] font-bold text-secondary-text uppercase tracking-widest">Respondents ({req.respondents.length})</h5>
                                            {req.respondents.map((resp: any) => (
                                                <div key={resp._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                                            <Heart size={12} className="text-red-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-semibold text-primary-text">{resp.donorId?.profile?.fullName || 'Donor'}</p>
                                                            <p className="text-[11px] text-secondary-text">{resp.donorId?.profile?.bloodGroup || 'Unknown'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {resp.status === 'offered' && req.status === 'active' && (
                                                            <Button
                                                                size="sm"
                                                                variant="primary"
                                                                className="h-7 px-3 text-[10px] bg-emerald-600"
                                                                onClick={() => handleAccept(req._id, resp.donorId?._id || resp.donorId)}
                                                            >
                                                                Accept & Share Contact
                                                            </Button>
                                                        )}
                                                        {resp.status === 'accepted' && (
                                                            <Badge variant="success" size="sm">
                                                                <CheckCircle2 size={10} className="mr-1" /> Accepted
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            )) : (
                                <div className="text-center py-16">
                                    <div className="w-14 h-14 bg-black/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Heart size={24} className="text-secondary-text/40" />
                                    </div>
                                    <h4 className="text-[16px] font-semibold text-primary-text mb-1">No Requests Yet</h4>
                                    <p className="text-[13px] text-secondary-text">Create a blood request when needed</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Create Blood Request Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-[480px] max-w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-red-600 to-rose-500 p-5 text-white relative">
                                <button onClick={() => setShowCreateModal(false)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                                    <X size={14} />
                                </button>
                                <Droplets size={20} className="mb-2 text-white/80" />
                                <h3 className="text-[17px] font-bold">Request Blood Donation</h3>
                                <p className="text-white/60 text-[13px]">Nearby compatible donors will be notified</p>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Blood Group Selector */}
                                <div>
                                    <label className="text-[12px] font-semibold text-secondary-text mb-2 block">Blood Group Needed *</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {BLOOD_GROUPS.map(bg => (
                                            <button
                                                key={bg}
                                                onClick={() => setFormData(d => ({ ...d, bloodGroup: bg }))}
                                                className={cn(
                                                    "h-10 rounded-xl text-sm font-bold transition-all border",
                                                    formData.bloodGroup === bg
                                                        ? "bg-red-600 text-white border-red-600 shadow-md"
                                                        : "bg-white text-primary-text border-gray-200 hover:border-red-300"
                                                )}
                                            >
                                                {bg}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Urgency */}
                                <div>
                                    <label className="text-[12px] font-semibold text-secondary-text mb-2 block">Urgency Level</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {URGENCY_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setFormData(d => ({ ...d, urgency: opt.value }))}
                                                className={cn(
                                                    "py-2.5 rounded-xl text-xs font-bold transition-all border text-center",
                                                    formData.urgency === opt.value
                                                        ? cn(opt.color, "border-transparent ring-2 ring-offset-1")
                                                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                                )}
                                            >
                                                {opt.label}
                                                <div className="text-[10px] opacity-70 mt-0.5">{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Units */}
                                <div>
                                    <label className="text-[12px] font-semibold text-secondary-text mb-2 block">Units Needed</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setFormData(d => ({ ...d, unitsNeeded: n }))}
                                                className={cn(
                                                    "flex-1 h-10 rounded-xl text-sm font-bold transition-all border",
                                                    formData.unitsNeeded === n
                                                        ? "bg-red-600 text-white border-red-600"
                                                        : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
                                                )}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Hospital & Contact */}
                                <Input
                                    label="Hospital / Location Name *"
                                    value={formData.hospitalName}
                                    onChange={e => setFormData(d => ({ ...d, hospitalName: e.target.value }))}
                                    placeholder="e.g. Apollo Hospital, Chennai"
                                    leftIcon={<Building2 size={16} />}
                                />

                                <Input
                                    label="Contact Number *"
                                    value={formData.contactNumber}
                                    onChange={e => setFormData(d => ({ ...d, contactNumber: e.target.value }))}
                                    placeholder="+91 XXXXX XXXXX"
                                    leftIcon={<Phone size={16} />}
                                />

                                <div>
                                    <label className="text-[12px] font-semibold text-secondary-text mb-2 block">Additional Details (Optional)</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData(d => ({ ...d, description: e.target.value }))}
                                        className="w-full h-20 p-3 rounded-xl border border-gray-200 text-sm resize-none focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
                                        placeholder="Any specific requirements or details..."
                                    />
                                </div>

                                <Button
                                    onClick={handleCreateRequest}
                                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold"
                                    leftIcon={<Droplets size={16} />}
                                >
                                    Send Blood Request
                                </Button>

                                <p className="text-[11px] text-center text-secondary-text">
                                    Compatible donors within 25km will be notified immediately
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BloodDonationPage;
