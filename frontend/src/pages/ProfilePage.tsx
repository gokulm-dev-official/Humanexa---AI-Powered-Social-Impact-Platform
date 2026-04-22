import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import {
    User,
    Mail,
    Save,
    ChevronLeft,
    Camera,
    Info,
    Globe,
    ShieldCheck,
    Award,
    Flame,
    Zap,
    Heart,
    Lock,
    Star,
    CheckCircle2,
    Upload,
    FileText,
    MapPin,
    Loader2,
    Navigation,
    Droplets
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/design-system/Button';
import { Card } from '../components/design-system/Card';
import { Input } from '../components/design-system/Input';
import { Badge } from '../components/design-system/Badge';
import { cn } from '../utils/cn';

const ProfilePage = () => {
    const { user } = useAuth();

    const [fullName, setFullName] = useState(user?.profile?.fullName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [bio, setBio] = useState(user?.profile?.bio || '');
    const [gender, setGender] = useState(user?.profile?.gender || '');
    const [bloodGroup, setBloodGroup] = useState(user?.profile?.bloodGroup || '');
    const [avatar, setAvatar] = useState(user?.profile?.avatar || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState('');

    const initialCoords = user?.address?.coordinates?.coordinates ? { lat: user.address.coordinates.coordinates[1], lng: user.address.coordinates.coordinates[0] } : null;
    const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(initialCoords);
    const [locationAddress, setLocationAddress] = useState(user?.address?.formattedAddress || '');
    const [locationDetecting, setLocationDetecting] = useState(false);
    const [manualSearch, setManualSearch] = useState('');
    const [searching, setSearching] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAvatar(res.data.data.url);
            setMsg('Avatar uploaded! Click save to apply.');
        } catch (err: any) {
            setMsg('Avatar upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updateData: any = {
                fullName,
                email,
                bio,
                avatar,
                bloodGroup: bloodGroup || undefined,
            };
            // Only send gender if it's a valid value
            if (gender && gender !== '') updateData.gender = gender;
            // Always send location coords if available (manual or auto-detected)
            if (locationCoords) {
                updateData.latitude = locationCoords.lat;
                updateData.longitude = locationCoords.lng;
                updateData.locationAddress = locationAddress;
            }
            await api.put('/auth/updatedetails', updateData);
            setMsg('✅ Profile Updated Successfully! Location saved.');
            // Don't reload page - just refresh user data from server
            setTimeout(() => setMsg(''), 4000);
        } catch (err: any) {
            setMsg(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
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
            } else {
                setMsg('Address not found. Try a more specific location.');
            }
        } catch {
            setMsg('Search failed. Please try again.');
        }
        setSearching(false);
    };

    const creditScore = user?.creditScore?.totalPoints || 0;
    const maxScore = 5000;
    const progress = Math.min((creditScore / maxScore) * 100, 100);

    return (
        <div className="min-h-screen pt-24 px-6 pb-32 flex justify-center bg-background relative overflow-hidden">
            {/* Atmospheric Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sapphire/5 blur-[150px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none"></div>

            <div className="max-w-6xl w-full relative z-10">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <Link to="/dashboard" className="inline-flex">
                            <Button variant="ghost" className="pl-0 gap-2 text-secondary-text hover:text-sapphire" size="sm">
                                <ChevronLeft size={16} /> Impact Dashboard
                            </Button>
                        </Link>
                        <h1 className="text-4xl font-serif font-bold text-primary-text mb-2">Identity Control</h1>
                        <p className="text-secondary-text/60 font-medium uppercase tracking-[0.2em] text-[10px]">Managing your trust presence on the network</p>
                    </div>

                    <div className="flex gap-4">
                        <Badge variant={user?.verificationStatus?.idVerified ? "success" : "warning"} size="lg" icon={<div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>}>
                            {user?.verificationStatus?.idVerified ? "Total Identity Verified" : "Identity Verification Pending"}
                        </Badge>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Panel: Trust Card */}
                    <div className="lg:col-span-1 space-y-8">
                        <Card variant="default" className="text-center p-0 relative overflow-hidden group border-sapphire/10">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sapphire-start to-sapphire-end"></div>

                            <div className="p-8">
                                <div className="relative inline-block mb-6">
                                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-soft-xl p-1 group-hover:border-sapphire/20 transition-all duration-500">
                                        <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden relative">
                                            {avatar ? (
                                                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-gray-300 uppercase">
                                                    {fullName.substring(0, 1)}
                                                </div>
                                            )}
                                            {uploading && (
                                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                                    <RefreshCw className="w-6 h-6 text-sapphire animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-1 right-1 p-2.5 bg-sapphire rounded-xl text-white shadow-lg hover:scale-110 active:scale-95 transition-all border-4 border-white"
                                    >
                                        <Camera size={16} />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>

                                <h2 className="text-xl font-bold text-primary-text mb-2 tracking-tight flex items-center justify-center gap-2">
                                    {fullName}
                                    {user?.verificationStatus?.idVerified && (
                                        <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-50" />
                                    )}
                                </h2>
                                <p className="text-[10px] font-bold text-sapphire uppercase tracking-[0.2em] mb-6">{user?.role?.replace('_', ' ')}</p>

                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                                    <div>
                                        <p className="text-2xl font-black text-primary-text">{user?.statistics?.totalHelps || 0}</p>
                                        <p className="text-[9px] text-secondary-text/60 uppercase font-bold tracking-widest">Impacts</p>
                                    </div>
                                    <div className="border-l border-gray-100">
                                        <div className="flex items-center justify-center gap-1.5 mb-0.5 text-orange-500">
                                            <Flame size={14} fill="currentColor" />
                                            <p className="text-2xl font-black text-primary-text">{user?.creditScore?.streak?.current || 0}</p>
                                        </div>
                                        <p className="text-[9px] text-secondary-text/60 uppercase font-bold tracking-widest">Streak</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Achievements Grid */}
                        <Card variant="glass" className="p-6">
                            <h4 className="text-[10px] font-bold text-secondary-text/60 uppercase tracking-[0.2em] mb-4">Achievement Badges</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <AchievementBadge icon={<Heart size={16} />} active color="bg-rose-500" />
                                <AchievementBadge icon={<ShieldCheck size={16} />} active color="bg-sapphire" />
                                <AchievementBadge icon={<Award size={16} />} active={user?.creditScore?.totalPoints > 1000} color="bg-amber-400" />
                                <AchievementBadge icon={<Zap size={16} />} active={user?.statistics?.totalHelps > 10} color="bg-purple-600" />
                                <AchievementBadge icon={<Star size={16} />} active={false} color="bg-emerald-500" />
                                <AchievementBadge icon={<Globe size={16} />} active={false} color="bg-sky-400" />
                            </div>
                        </Card>
                    </div>

                    {/* Middle Panel: Edit Details + Verification */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card variant="default" className="relative overflow-hidden bg-white/80 p-0 shadow-soft-xl border-gray-100">
                            <div className="p-8 md:p-10">
                                <h3 className="text-2xl font-serif font-bold text-primary-text mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-sapphire/10 flex items-center justify-center text-sapphire">
                                        <User size={20} />
                                    </div>
                                    Identity Portfolio
                                </h3>

                                {msg && (
                                    <div className={cn("mb-8 px-4 py-3 border rounded-xl flex items-center gap-3 text-sm font-medium",
                                        msg.toLowerCase().includes('success') || msg.toLowerCase().includes('uploaded') ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-sapphire/5 text-sapphire border-sapphire/10"
                                    )}>
                                        <Info size={16} />
                                        {msg}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-1">
                                            <Input
                                                label="Full Presence Name"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Citizen Name"
                                                leftIcon={<User size={18} />}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Input
                                                label="Comms Email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="email@socialkind.com"
                                                leftIcon={<Mail size={18} />}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="space-y-1 relative">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary-text/40 ml-1 mb-2 block">Chosen Identity</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sapphire transition-colors z-10 pointer-events-none">
                                                    <Globe size={18} />
                                                </div>
                                                <select
                                                    value={gender}
                                                    onChange={(e) => setGender(e.target.value)}
                                                    className="w-full h-14 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl px-4 pl-12 text-primary-text font-medium outline-none focus:border-sapphire focus:ring-4 focus:ring-sapphire/10 transition-all appearance-none"
                                                >
                                                    <option value="">Select Identity</option>
                                                    <option value="male">He / Him</option>
                                                    <option value="female">She / Her</option>
                                                    <option value="other">They / Them</option>
                                                    <option value="private">Private</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1 relative">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary-text/40 ml-1 mb-2 block">Blood Group</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors z-10 pointer-events-none">
                                                    <Droplets size={18} />
                                                </div>
                                                <select
                                                    value={bloodGroup}
                                                    onChange={(e) => setBloodGroup(e.target.value)}
                                                    className="w-full h-14 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl px-4 pl-12 text-primary-text font-medium outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all appearance-none"
                                                >
                                                    <option value="">Select Blood Group</option>
                                                    <option value="A+">A+</option>
                                                    <option value="A-">A-</option>
                                                    <option value="B+">B+</option>
                                                    <option value="B-">B-</option>
                                                    <option value="AB+">AB+</option>
                                                    <option value="AB-">AB-</option>
                                                    <option value="O+">O+</option>
                                                    <option value="O-">O-</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                            </div>
                                            {bloodGroup && (
                                                <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">🩸 {bloodGroup} — You may receive blood donation requests</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Input
                                                label="Impact Vision (Bio)"
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                placeholder="Bridging hearts through..."
                                                leftIcon={<Info size={18} />}
                                            />
                                        </div>
                                    </div>

                                    {/* Location Status */}
                                    <div className={`rounded-xl border p-4 mt-6 ${locationDetecting ? 'bg-gray-50 border-gray-200' :
                                        locationCoords ? 'bg-emerald-50 border-emerald-200' :
                                            'bg-amber-50 border-amber-200'
                                        }`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <MapPin size={20} className={`mt-0.5 ${locationDetecting ? 'text-gray-400 animate-pulse' : locationCoords ? 'text-emerald-600' : 'text-amber-600'}`} />
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Base Location</p>
                                                    {locationDetecting ? (
                                                        <div className="flex items-center gap-2">
                                                            <Loader2 size={14} className="animate-spin text-gray-400" />
                                                            <span className="text-sm text-gray-400">Detecting...</span>
                                                        </div>
                                                    ) : locationCoords ? (
                                                        <p className="text-sm font-semibold text-gray-800 leading-tight">{locationAddress}</p>
                                                    ) : (
                                                        <p className="text-sm text-amber-600">Location needed for better matching</p>
                                                    )}
                                                </div>
                                            </div>
                                            <button type="button" onClick={detectLocation} disabled={locationDetecting} className="text-xs font-bold text-blue-600 hover:text-blue-800 shrink-0 disabled:text-gray-300">
                                                {locationDetecting ? '...' : 'Auto-detect'}
                                            </button>
                                        </div>

                                        {/* Manual search */}
                                        <div className="mt-4 pt-4 border-t border-gray-200/50">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={manualSearch}
                                                    onChange={(e) => setManualSearch(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchLocation())}
                                                    placeholder="Type address..."
                                                    className="flex-1 h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-blue-400"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={searchLocation}
                                                    disabled={searching || !manualSearch.trim()}
                                                    className="px-4 h-10 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex items-center gap-1.5"
                                                >
                                                    {searching ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                                                    {searching ? '...' : 'Find'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            isLoading={loading}
                                            className="w-full h-14 text-base shadow-lg hover:shadow-glow"
                                            leftIcon={<Save size={18} />}
                                        >
                                            Update Identity Profile
                                        </Button>
                                    </div>
                                </form>
                            </div>

                            {/* Verification Section */}
                            <div className="p-8 md:p-10 border-t border-gray-100 bg-gray-50/30">
                                <h3 className="text-xl font-serif font-bold text-primary-text mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <ShieldCheck size={20} />
                                    </div>
                                    Government Verification
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-500",
                                                user?.verificationStatus?.idVerified ? "bg-emerald-500 text-white" : "bg-white border-2 border-gray-100 text-gray-300"
                                            )}>
                                                {user?.verificationStatus?.idVerified ? <CheckCircle2 size={24} /> : <div className="w-4 h-4 rounded-full border-2 border-current"></div>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-primary-text">Identity Verification</p>
                                                <p className="text-xs text-secondary-text/60">{user?.verificationStatus?.idVerified ? 'Verified Account' : 'Action Required'}</p>
                                            </div>
                                        </div>

                                        <p className="text-sm text-secondary-text leading-relaxed">
                                            Upload a government-issued ID (Aadhar, PAN, or Passport) to obtain the <strong>Verification Badge</strong> and increase your trust score.
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        {user?.verificationStatus?.idVerified && user?.governmentId?.documentUrl ? (
                                            <div className="w-full p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm">
                                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                                    <FileText size={24} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-primary-text truncate">Document Verified</p>
                                                    <p className="text-[10px] text-secondary-text/60 uppercase tracking-widest mt-0.5">Verified on {user?.governmentId?.verifiedAt ? new Date(user.governmentId.verifiedAt).toLocaleDateString() : 'Active'}</p>
                                                </div>
                                                <a
                                                    href={user.governmentId.documentUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 text-sapphire hover:bg-sapphire/5 rounded-lg transition-colors"
                                                >
                                                    <Globe size={18} />
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="w-full">
                                                <input
                                                    type="file"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;

                                                        setUploading(true);
                                                        try {
                                                            const formData = new FormData();
                                                            formData.append('image', file);
                                                            const res = await api.post('/upload/image', formData, {
                                                                headers: { 'Content-Type': 'multipart/form-data' }
                                                            });
                                                            await api.post('/auth/verify-id', { documentUrl: res.data.data.url });
                                                            alert('ID Uploaded and Verified! Identity score updated.');
                                                            window.location.reload();
                                                        } catch (err: any) {
                                                            alert('ID upload/verification failed');
                                                        } finally {
                                                            setUploading(false);
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id="id-upload"
                                                    accept="image/*,.pdf"
                                                />
                                                <label
                                                    htmlFor="id-upload"
                                                    className="w-full flex items-center justify-center gap-3 h-14 border-2 border-dashed border-gray-200 rounded-2xl hover:border-sapphire hover:bg-sapphire/[0.02] cursor-pointer transition-all group"
                                                >
                                                    {uploading ? (
                                                        <RefreshCw className="w-5 h-5 text-sapphire animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Upload size={18} className="text-gray-400 group-hover:text-sapphire" />
                                                            <span className="text-sm font-bold text-secondary-text group-hover:text-sapphire">Upload Verification Document</span>
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Panel: Trust Meta */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Circular Progress */}
                        <Card variant="default" className="text-center p-8 relative overflow-hidden flex flex-col items-center border-gray-100">
                            <h4 className="text-[10px] font-bold text-secondary-text/60 uppercase tracking-[0.2em] mb-8">Credit Score Health</h4>
                            <div className="relative w-36 h-36 mb-8">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100" />
                                    <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-sapphire" strokeDasharray={402} strokeDashoffset={402 - (402 * progress) / 100} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-2xl font-black text-primary-text">{creditScore}</p>
                                    <p className="text-[9px] font-bold text-secondary-text/40 uppercase tracking-widest">Points</p>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-primary-text mb-2">{user?.creditScore?.rank || 'Bronze'} Rank</p>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(creditScore % 1000) / 10}%` }}></div>
                            </div>
                            <p className="text-[9px] font-bold text-secondary-text/40 uppercase tracking-widest mt-3">{1000 - (creditScore % 1000)} points until next rank</p>
                        </Card>

                        {/* Security Audit */}
                        <Card variant="default" className="bg-[#18181B] text-white border-0 shadow-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400">
                                    <Lock size={16} />
                                </div>
                                <h4 className="text-xs font-bold uppercase tracking-widest">Security Audit</h4>
                            </div>

                            <div className="space-y-4">
                                <SecurityItem label="Two-Factor Identity" status="Enabled" active />
                                <SecurityItem label="Crypto-Verification" status="Active" active />
                                <SecurityItem label="Biometric Portal" status="Setup" active={false} />
                            </div>

                            <Button variant="ghost" className="w-full mt-6 text-[10px] h-10 uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 border border-white/10">
                                Manage Security
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

function AchievementBadge({ icon, active, color }: any) {
    return (
        <div className={cn(
            "aspect-square rounded-2xl flex items-center justify-center transition-all duration-500",
            active ? `${color} text-white shadow-lg scale-100` : 'bg-gray-50 border border-gray-100 text-gray-300 scale-95 grayscale'
        )}>
            {icon}
        </div>
    );
}

function SecurityItem({ label, status, active }: any) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/50">{label}</span>
            <div className="flex items-center gap-2">
                <CheckCircle2 size={12} className={active ? 'text-emerald-400' : 'text-white/10'} />
                <span className={`text-[9px] font-bold uppercase tracking-widest ${active ? 'text-white' : 'text-white/20'}`}>{status}</span>
            </div>
        </div>
    );
}

function RefreshCw({ className }: any) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    )
}

export default ProfilePage;
