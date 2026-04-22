import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Users, Heart, Building2, Filter, X, ArrowRight, IndianRupee, ChevronRight, Navigation, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/design-system/Button';
import { Card } from '../components/design-system/Card';
import { Badge } from '../components/design-system/Badge';

const appleEase = [0.25, 0.1, 0.25, 1] as const;

// Haversine distance
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

const getInstCoords = (inst: any): { lat: number; lng: number } | null => {
    const coords = inst.address?.coordinates?.coordinates;
    if (coords && coords.length === 2 && coords[0] !== 0 && coords[1] !== 0) {
        return { lat: coords[1], lng: coords[0] };
    }
    return null;
};

const InstitutionDiscoveryPage: React.FC = () => {
    const navigate = useNavigate();
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
    const [donateAmount, setDonateAmount] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationStatus, setLocationStatus] = useState<'detecting' | 'found' | 'failed'>('detecting');

    useEffect(() => {
        // Detect user location
        setLocationStatus('detecting');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocationStatus('found');
                },
                async () => {
                    // IP fallback
                    try {
                        const res = await fetch('https://ipapi.co/json/');
                        const data = await res.json();
                        if (data.latitude && data.longitude) {
                            setUserLocation({ lat: data.latitude, lng: data.longitude });
                            setLocationStatus('found');
                        } else {
                            setLocationStatus('failed');
                        }
                    } catch {
                        setLocationStatus('failed');
                    }
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setLocationStatus('failed');
        }
        fetchInstitutions();
    }, []);

    const fetchInstitutions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/auth/institutions');
            if (res.data?.data?.institutions) {
                setInstitutions(res.data.data.institutions);
            }
        } catch (err) {
            console.error('Failed to fetch institutions:', err);
            setInstitutions([]);
        } finally {
            setLoading(false);
        }
    };

    const getDistance = (inst: any): number | null => {
        if (!userLocation) return null;
        const coords = getInstCoords(inst);
        if (!coords) return null;
        return calcDistanceKm(userLocation.lat, userLocation.lng, coords.lat, coords.lng);
    };

    const filtered = institutions
        .filter(inst => {
            const matchesSearch = !searchQuery ||
                inst.profile?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inst.profile?.bio?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLocation = !locationFilter ||
                inst.address?.formattedAddress?.toLowerCase().includes(locationFilter.toLowerCase());
            return matchesSearch && matchesLocation;
        })
        .sort((a, b) => {
            // Sort by distance if available
            const distA = getDistance(a);
            const distB = getDistance(b);
            if (distA !== null && distB !== null) return distA - distB;
            if (distA !== null) return -1;
            if (distB !== null) return 1;
            return 0;
        });

    const handleDonate = (inst: any) => {
        if (!donateAmount || Number(donateAmount) <= 0) return;
        navigate(`/donate?institutionId=${inst._id}&amount=${donateAmount}`);
    };

    return (
        <div className="min-h-screen bg-background pt-20 pb-16 px-5 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: appleEase }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h1 className="text-[28px] font-bold text-primary-text tracking-tight">Institutions</h1>
                            <p className="text-[13px] text-secondary-text">Discover & support verified institutions in your community</p>
                        </div>
                    </div>

                    {/* Location Status */}
                    <div className="mt-3 flex items-center gap-2 text-[11px]">
                        {locationStatus === 'detecting' && (
                            <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                                <Loader2 size={12} className="animate-spin" /> Detecting your location...
                            </span>
                        )}
                        {locationStatus === 'found' && userLocation && (
                            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium">
                                <MapPin size={12} /> Location detected — showing distance
                            </span>
                        )}
                        {locationStatus === 'failed' && (
                            <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                                <MapPin size={12} /> Location unavailable — distances hidden
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Search & Filter Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5, ease: appleEase }}
                    className="mb-6 space-y-3"
                >
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-text/40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search institutions..."
                                className="w-full h-12 bg-white border border-gray-200 rounded-xl pl-11 pr-4 text-[14px] font-medium text-primary-text placeholder:text-secondary-text/30 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`h-12 px-4 rounded-xl border flex items-center gap-2 text-[12px] font-bold transition-all ${showFilters ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-white border-gray-200 text-secondary-text hover:border-purple-200'}`}
                        >
                            <Filter size={14} />
                            Filters
                        </button>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex gap-3 pt-1">
                                    <div className="flex-1 relative">
                                        <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-text/40" />
                                        <input
                                            type="text"
                                            value={locationFilter}
                                            onChange={e => setLocationFilter(e.target.value)}
                                            placeholder="Filter by location..."
                                            className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 text-[13px] font-medium text-primary-text placeholder:text-secondary-text/30 focus:outline-none focus:border-purple-400 transition-all"
                                        />
                                    </div>
                                    {locationFilter && (
                                        <button onClick={() => setLocationFilter('')} className="h-10 px-3 rounded-lg bg-gray-100 text-secondary-text hover:bg-gray-200 transition-colors">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Results count */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[12px] text-secondary-text font-medium">
                        {filtered.length} institution{filtered.length !== 1 ? 's' : ''} found
                        {userLocation && ' • sorted by distance'}
                    </p>
                </div>

                {/* Institution Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((inst, i) => {
                            const distance = getDistance(inst);
                            const coords = getInstCoords(inst);
                            return (
                                <motion.div
                                    key={inst._id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05, ease: appleEase }}
                                >
                                    <Card
                                        className="bg-white hover:shadow-soft-md transition-all duration-300 cursor-pointer overflow-hidden"
                                        onClick={() => setSelectedInstitution(inst)}
                                    >
                                        {/* Cover Image / Map */}
                                        <div className="h-32 relative overflow-hidden">
                                            {coords ? (
                                                <iframe
                                                    title={`Map of ${inst.profile?.fullName}`}
                                                    width="100%"
                                                    height="100%"
                                                    frameBorder="0"
                                                    style={{ border: 0, pointerEvents: 'none' }}
                                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.015}%2C${coords.lat - 0.01}%2C${coords.lng + 0.015}%2C${coords.lat + 0.01}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`}
                                                    loading="lazy"
                                                />
                                            ) : inst.profile?.avatar ? (
                                                <img src={inst.profile.avatar} alt={inst.profile.fullName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                                                    <Building2 size={40} className="text-purple-300" />
                                                </div>
                                            )}
                                            {/* Distance badge */}
                                            {distance !== null && (
                                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm border border-gray-100 flex items-center gap-1">
                                                    <Navigation size={10} className="text-blue-600" />
                                                    <span className="text-[11px] font-bold text-blue-700">{distance} km</span>
                                                </div>
                                            )}
                                            <div className="absolute -bottom-6 left-4">
                                                <div className="w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center border-2 border-white overflow-hidden">
                                                    {inst.profile?.avatar ? (
                                                        <img src={inst.profile.avatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Building2 size={22} className="text-purple-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 pt-9 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-[15px] font-bold text-primary-text line-clamp-1">{inst.profile?.fullName || 'Institution'}</h3>
                                                    <p className="text-[11px] text-secondary-text flex items-center gap-1 mt-0.5">
                                                        <MapPin size={10} />
                                                        {inst.address?.formattedAddress?.split(',').slice(0, 2).join(',') || 'Location not set'}
                                                    </p>
                                                </div>
                                                {inst.verificationStatus?.idVerified && (
                                                    <Badge variant="success" size="sm">Verified</Badge>
                                                )}
                                            </div>

                                            {inst.profile?.bio && (
                                                <p className="text-[12px] text-secondary-text line-clamp-2 leading-relaxed">{inst.profile.bio}</p>
                                            )}

                                            <div className="flex items-center gap-4 pt-1">
                                                <div className="flex items-center gap-1.5 text-[11px] text-secondary-text">
                                                    <Users size={12} />
                                                    <span className="font-medium">{inst.institutionMembers?.length || 0} members</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-secondary-text">
                                                    <Heart size={12} />
                                                    <span className="font-medium">{inst.statistics?.totalHelps || 0} helped</span>
                                                </div>
                                                {distance !== null && (
                                                    <div className="flex items-center gap-1.5 text-[11px] text-blue-600 ml-auto">
                                                        <Navigation size={10} />
                                                        <span className="font-bold">{distance} km</span>
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                size="sm"
                                                variant="primary"
                                                className="w-full"
                                                rightIcon={<ChevronRight size={14} />}
                                                onClick={e => { e.stopPropagation(); setSelectedInstitution(inst); }}
                                            >
                                                View Profile & Donate
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                            <Building2 size={28} className="text-purple-300" />
                        </div>
                        <h3 className="text-[18px] font-semibold text-primary-text mb-1">No Institutions Found</h3>
                        <p className="text-[13px] text-secondary-text">
                            {searchQuery || locationFilter ? 'Try different search terms or filters' : 'No institutions registered yet'}
                        </p>
                    </div>
                )}
            </div>

            {/* Institution Detail Modal */}
            <AnimatePresence>
                {selectedInstitution && (() => {
                    const selCoords = getInstCoords(selectedInstitution);
                    const selDistance = getDistance(selectedInstitution);
                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-xl flex items-center justify-center p-6"
                            onClick={() => setSelectedInstitution(null)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                onClick={e => e.stopPropagation()}
                                className="w-full max-w-lg bg-white rounded-3xl overflow-hidden max-h-[85vh] overflow-y-auto shadow-2xl"
                            >
                                {/* Header with Map */}
                                <div className="h-48 relative overflow-hidden">
                                    {selCoords ? (
                                        <iframe
                                            title="Institution Location"
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            style={{ border: 0 }}
                                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${selCoords.lng - 0.02}%2C${selCoords.lat - 0.015}%2C${selCoords.lng + 0.02}%2C${selCoords.lat + 0.015}&layer=mapnik&marker=${selCoords.lat}%2C${selCoords.lng}`}
                                        />
                                    ) : selectedInstitution.profile?.avatar ? (
                                        <img src={selectedInstitution.profile.avatar} alt="" className="w-full h-full object-cover opacity-40" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600" />
                                    )}
                                    <button onClick={() => setSelectedInstitution(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors backdrop-blur-sm">
                                        <X size={16} />
                                    </button>
                                    {/* Distance overlay */}
                                    {selDistance !== null && (
                                        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-1.5">
                                            <Navigation size={12} className="text-blue-600" />
                                            <span className="text-[13px] font-bold text-blue-700">{selDistance} km away</span>
                                        </div>
                                    )}
                                    <div className="absolute -bottom-8 left-6">
                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center border-4 border-white overflow-hidden">
                                            {selectedInstitution.profile?.avatar ? (
                                                <img src={selectedInstitution.profile.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Building2 size={28} className="text-purple-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 pt-12 space-y-6">
                                    <div>
                                        <h2 className="text-[22px] font-bold text-primary-text">{selectedInstitution.profile?.fullName}</h2>
                                        <p className="text-[12px] text-secondary-text flex items-center gap-1 mt-1">
                                            <MapPin size={12} />
                                            {selectedInstitution.address?.formattedAddress || 'Location not provided'}
                                        </p>
                                        {selDistance !== null && (
                                            <p className="text-[12px] text-blue-600 font-bold flex items-center gap-1 mt-1">
                                                <Navigation size={12} /> {selDistance} km from your location
                                            </p>
                                        )}
                                        {selectedInstitution.profile?.bio && (
                                            <p className="text-[13px] text-secondary-text mt-3 leading-relaxed">{selectedInstitution.profile.bio}</p>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-purple-50 rounded-xl p-3 text-center">
                                            <p className="text-[18px] font-bold text-purple-700">{selectedInstitution.institutionMembers?.length || 0}</p>
                                            <p className="text-[10px] text-purple-500 font-medium uppercase">Members</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                                            <p className="text-[18px] font-bold text-blue-700">{selectedInstitution.statistics?.totalHelps || 0}</p>
                                            <p className="text-[10px] text-blue-500 font-medium uppercase">Helped</p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                            <p className="text-[18px] font-bold text-emerald-700">{selectedInstitution.creditScore?.totalPoints || 0}</p>
                                            <p className="text-[10px] text-emerald-500 font-medium uppercase">Trust Score</p>
                                        </div>
                                    </div>

                                    {/* Members List */}
                                    {selectedInstitution.institutionMembers?.length > 0 && (
                                        <div>
                                            <h3 className="text-[14px] font-bold text-primary-text mb-3 flex items-center gap-2">
                                                <Users size={16} className="text-purple-500" />
                                                Members ({selectedInstitution.institutionMembers.length})
                                            </h3>
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {selectedInstitution.institutionMembers.map((member: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-purple-100 flex items-center justify-center shrink-0">
                                                            {member.photo ? (
                                                                <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Users size={16} className="text-purple-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[13px] font-semibold text-primary-text truncate">{member.name}</p>
                                                            <p className="text-[11px] text-secondary-text">Age: {member.age || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Donate Section */}
                                    <div className="pt-2 border-t border-gray-100">
                                        <h3 className="text-[14px] font-bold text-primary-text mb-3 flex items-center gap-2">
                                            <Heart size={16} className="text-red-500" />
                                            Donate to this Institution
                                        </h3>
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text/40" />
                                                <input
                                                    type="number"
                                                    value={donateAmount}
                                                    onChange={e => setDonateAmount(e.target.value)}
                                                    placeholder="Enter amount"
                                                    className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 text-[14px] font-bold text-primary-text placeholder:text-secondary-text/30 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
                                                />
                                            </div>
                                            <Button
                                                variant="primary"
                                                className="h-11 px-6 bg-gradient-to-r from-purple-600 to-blue-600"
                                                rightIcon={<ArrowRight size={14} />}
                                                onClick={() => handleDonate(selectedInstitution)}
                                                disabled={!donateAmount || Number(donateAmount) <= 0}
                                            >
                                                Donate
                                            </Button>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            {[100, 500, 1000, 2500].map(amt => (
                                                <button
                                                    key={amt}
                                                    onClick={() => setDonateAmount(String(amt))}
                                                    className="flex-1 h-8 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-bold text-secondary-text hover:border-purple-300 hover:text-purple-600 transition-all"
                                                >
                                                    ₹{amt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
};

export default InstitutionDiscoveryPage;
