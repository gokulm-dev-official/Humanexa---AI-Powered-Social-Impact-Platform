import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    APIProvider,
    Map as GoogleMap,
    AdvancedMarker,
    Pin,
    InfoWindow,
    useMap,
} from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Map as MapIcon, Layers, Navigation, 
    Users, Heart, Zap, ShieldAlert, X, ChevronRight,
    LocateFixed, Target, Activity, Send, MapPin
} from 'lucide-react';
import { Button } from '../components/design-system/Button';
import { Card } from '../components/design-system/Card';
import { Badge } from '../components/design-system/Badge';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''; 
const MAP_ID = '4f8a3ce4f8a3ce'; // High-fidelity cinematic map style ID

const DonorDiscoveryPage = () => {
    const navigate = useNavigate();
    const { showToast } = useNotifications();
    const [requests, setRequests] = useState<any[]>([]);
    const [helpers, setHelpers] = useState<any[]>([]); // For live tracking demo
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
    const [showTraffic, setShowTraffic] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // User location
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

    useEffect(() => {
        fetchData();
        getUserLocation();
        
        // Polling for live updates (e.g., helpers moving)
        const interval = setInterval(() => {
            fetchHelpers();
        }, 10000);
        
        return () => clearInterval(interval);
    }, []);

    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                () => showToast('Could not access your location', 'warning')
            );
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [reqRes, broadcastRes, helpRes] = await Promise.all([
                api.get('/help-requests/available'),
                api.get('/help-requests/broadcasts'),
                api.get('/emergency/helper/live-locations')
            ]);
            
            const allRequests = [
                ...(reqRes.data.data.requests || []),
                ...(broadcastRes.data.data.requests || [])
            ];
            
            // Deduplicate by ID using native Map (not the Google Maps one)
            const uniqueRequests = Array.from(new Map(allRequests.map(item => [item._id, item])).values());
            
            setRequests(uniqueRequests);
            setHelpers(helpRes.data.data?.helpers || []);
        } catch (err) {
            console.error('Map data fetch failed', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHelpers = async () => {
        try {
            const res = await api.get('/emergency/helper/live-locations');
            setHelpers(res.data.data?.helpers || []);
        } catch {}
    };

    const filteredRequests = requests.filter(r => 
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-screen w-screen relative bg-zinc-950 overflow-hidden">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                {/* ── MAP CONTAINER ── */}
                <div className="absolute inset-0">
                    <GoogleMap
                        defaultCenter={userLocation || { lat: 20.5937, lng: 78.9629 }}
                        defaultZoom={12}
                        mapId={MAP_ID}
                        mapTypeId={mapType}
                        disableDefaultUI={true}
                        gestureHandling={'greedy'}
                        onClick={() => setSelectedRequest(null)}
                        styles={[
                            {
                                "elementType": "geometry",
                                "stylers": [{ "color": "#212121" }]
                            },
                            {
                                "elementType": "labels.icon",
                                "stylers": [{ "visibility": "off" }]
                            },
                            {
                                "elementType": "labels.text.fill",
                                "stylers": [{ "color": "#757575" }]
                            },
                            {
                                "elementType": "labels.text.stroke",
                                "stylers": [{ "color": "#212121" }]
                            },
                            {
                                "featureType": "administrative",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#757575" }]
                            },
                            {
                                "featureType": "poi",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#181818" }]
                            },
                            {
                                "featureType": "road",
                                "elementType": "geometry.fill",
                                "stylers": [{ "color": "#2c2c2c" }]
                            },
                            {
                                "featureType": "water",
                                "elementType": "geometry",
                                "stylers": [{ "color": "#000000" }]
                            }
                        ]}
                    >
                        {/* User Location Marker */}
                        {userLocation && (
                            <AdvancedMarker position={userLocation}>
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-blue-500/10 rounded-full animate-ping" />
                                    <div className="absolute -inset-2 bg-blue-500/20 rounded-full" />
                                    <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_20px_rgba(59,130,246,0.5)] z-10" />
                                </div>
                            </AdvancedMarker>
                        )}

                        {/* Request Markers */}
                        <Markers 
                            points={filteredRequests} 
                            onMarkerClick={(p) => setSelectedRequest(p)} 
                        />

                        {/* Live Helper Markers */}
                        {helpers.map((h: any) => (
                            <AdvancedMarker 
                                key={h._id} 
                                position={{ lat: h.location.coordinates[1], lng: h.location.coordinates[0] }}
                            >
                                <motion.div 
                                    animate={{ 
                                        scale: [1, 1.1, 1],
                                        boxShadow: [
                                            "0 0 0px rgba(16, 185, 129, 0)",
                                            "0 0 20px rgba(16, 185, 129, 0.4)",
                                            "0 0 0px rgba(16, 185, 129, 0)"
                                        ]
                                    }} 
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    className="w-10 h-10 bg-emerald-500/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-emerald-500/40 relative"
                                >
                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950 animate-pulse" />
                                    <Zap size={16} className="text-emerald-500" fill="currentColor" />
                                </motion.div>
                            </AdvancedMarker>
                        ))}
                    </GoogleMap>
                </div>

                {/* ── SEARCH & FILTER OVERLAY ── */}
                <div className="absolute top-24 left-6 z-20 w-80 space-y-4">
                    <Card className="p-2 border-none bg-white/80 backdrop-blur-xl shadow-2xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search areas or needs..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 pl-10 pr-4 bg-transparent border-none focus:ring-0 font-bold text-sm"
                            />
                        </div>
                    </Card>

                    <div className="flex gap-2">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-white/80 backdrop-blur-md shadow-lg font-black text-[10px]"
                            onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
                        >
                            <Layers size={14} className="mr-2" />
                            {mapType === 'roadmap' ? 'SATELLITE' : 'ROADMAP'}
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-white/80 backdrop-blur-md shadow-lg font-black text-[10px]"
                        >
                            <Users size={14} className="mr-2" />
                            {helpers.length} LIVE HELPERS
                        </Button>
                    </div>
                </div>

                {/* ── LEGEND OVERLAY ── */}
                <div className="absolute top-24 right-6 z-20 space-y-2">
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Map Legend</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-humanexa-trust" />
                                <span className="text-[10px] font-bold text-zinc-700">BROADCAST NEED</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold text-zinc-700">LIVE RESPONDER</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-zinc-700">EMERGENCY SIGNAL</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── SELECTED REQUEST DRAWER ── */}
                <AnimatePresence>
                    {selectedRequest && (
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="absolute inset-y-0 right-0 z-30 w-full sm:w-[450px] bg-white/95 backdrop-blur-3xl shadow-[-20px_0_80px_rgba(0,0,0,0.1)] border-l border-zinc-100 p-8 flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <Badge variant="sapphire">Verified Asset</Badge>
                                <button onClick={() => setSelectedRequest(null)} className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-humanexa-trust">
                                        <Heart size={20} fill="currentColor" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{selectedRequest.requestType} Signal</span>
                                    </div>
                                    <h2 className="text-3xl font-serif font-black tracking-tight leading-none uppercase">
                                        {selectedRequest.title}
                                    </h2>
                                    <p className="flex items-center gap-1.5 text-zinc-400 font-bold text-xs">
                                        <MapPin size={14} /> {selectedRequest.location?.address}
                                    </p>
                                </div>

                                <Card className="p-6 bg-zinc-50 border-none shadow-sm">
                                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Broadcast Description</h4>
                                    <p className="text-sm text-zinc-700 leading-relaxed italic">"{selectedRequest.description}"</p>
                                </Card>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-zinc-50">
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Target Funding</p>
                                        <p className="text-xl font-black text-zinc-900">₹{selectedRequest.amount?.value?.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-blue-50">
                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Raised So Far</p>
                                        <p className="text-xl font-black text-humanexa-trust">₹{(selectedRequest.amountRaised || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                                     <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: `${Math.min(100, ((selectedRequest.amountRaised || 0) / (selectedRequest.amount?.value || 1)) * 100)}%` }} 
                                        className="h-full bg-gradient-to-r from-humanexa-trust to-blue-400" 
                                    />
                                </div>

                                <div className="space-y-4 pt-4">
                                    <Button 
                                        className="w-full h-16 text-sm font-black tracking-widest uppercase hover:scale-[1.02] transition-transform shadow-glow active:scale-95"
                                        onClick={() => navigate(`/donate?requestId=${selectedRequest._id}&amount=500`)}
                                    >
                                        SUPPORT SIGNAL <ChevronRight size={18} className="ml-2" />
                                    </Button>
                                    <Button variant="ghost" className="w-full text-[10px] font-black tracking-[0.2em] text-zinc-400">
                                        VIEW IMPACT METADATA
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="pt-8 border-t border-zinc-100 mt-auto">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-black text-[10px]">IN</div>
                                    <div>
                                        <p className="text-xs font-black text-zinc-900 uppercase">{selectedRequest.donorId?.profile?.fullName || 'Institution Node'}</p>
                                        <p className="text-[9px] font-bold text-zinc-400">Verified Registry Entity</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── LOCATE ME BUTTON ── */}
                <div className="absolute bottom-10 right-10 z-20 flex flex-col gap-3">
                    <button 
                         onClick={() => getUserLocation()}
                         className="w-14 h-14 bg-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all hover:bg-humanexa-trust hover:text-white group"
                    >
                        <LocateFixed size={24} className="group-hover:animate-pulse" />
                    </button>
                    <button className="w-14 h-14 bg-zinc-900 rounded-2xl shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-all">
                        <Navigation size={24} />
                    </button>
                </div>
            </APIProvider>
        </div>
    );
};

// ── MARKER CLUSTERING COMPONENT ──
const Markers = ({ points, onMarkerClick }: { points: any[], onMarkerClick: (p: any) => void }) => {
    const map = useMap();
    const [markers, setMarkers] = useState<{[key: string]: Marker}>({});
    const clusterer = useMemo(() => {
        if (!map) return null;
        return new MarkerClusterer({ map });
    }, [map]);

    useEffect(() => {
        if (!clusterer) return;
        clusterer.clearMarkers();
        clusterer.addMarkers(Object.values(markers));
    }, [clusterer, markers]);

    const setMarkerRef = useCallback((marker: google.maps.Marker | null, key: string) => {
        setMarkers(prev => {
            if (marker) {
                return {...prev, [key]: marker};
            } else {
                const newMarkers = {...prev};
                delete newMarkers[key];
                return newMarkers;
            }
        });
    }, []);

    return (
        <>
            {points.map((point) => (
                <AdvancedMarker
                    key={point._id}
                    position={{ 
                        lat: point.location?.coordinates?.coordinates?.[1] || point.location?.coordinates?.[1] || 0, 
                        lng: point.location?.coordinates?.coordinates?.[0] || point.location?.coordinates?.[0] || 0 
                    }}
                    ref={marker => setMarkerRef(marker as any, point._id)}
                    onClick={() => onMarkerClick(point)}
                >
                    <div className="relative group cursor-pointer">
                        <motion.div 
                            initial={{ scale: 0, rotate: 0 }}
                            animate={{ scale: 1, rotate: 45 }}
                            whileHover={{ scale: 1.15, rotate: 0 }}
                            transition={{ type: 'spring', damping: 15 }}
                            className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border-2 border-humanexa-trust/50 text-white shadow-[0_0_30px_rgba(46,92,255,0.2)] group-hover:bg-humanexa-trust group-hover:border-white group-hover:shadow-glow-blue transition-all duration-300"
                        >
                            <div className="group-hover:rotate-0 transition-transform -rotate-45">
                                {point.requestType === 'emergency' ? (
                                    <ShieldAlert size={20} className="text-red-500 group-hover:text-white" />
                                ) : (
                                    <Activity size={20} className="text-humanexa-trust group-hover:text-white" strokeWidth={3} />
                                )}
                            </div>
                        </motion.div>
                        
                        {/* Verification Ripple for Premium Entities */}
                        <div className="absolute -inset-4 border-2 border-humanexa-trust/20 rounded-[2rem] animate-pulse-slow opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-y-1 whitespace-nowrap uppercase tracking-widest shadow-2xl border border-white/10">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-humanexa-trust animate-pulse" />
                                {point.title?.substring(0, 20)}
                            </div>
                        </div>
                    </div>
                </AdvancedMarker>
            ))}
        </>
    );
};

export default DonorDiscoveryPage;
