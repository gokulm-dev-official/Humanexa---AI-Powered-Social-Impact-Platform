import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet + React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
    initialLocation?: [number, number];
    autoDetect?: boolean;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialLocation, autoDetect = true }) => {
    const [position, setPosition] = useState<[number, number] | null>(initialLocation || null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [locationAddress, setLocationAddress] = useState<string>('');

    useEffect(() => {
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Auto-detect location on mount
    useEffect(() => {
        if (autoDetect && !initialLocation && !position) {
            detectLocation();
        }
    }, []);

    const detectLocation = () => {
        if (!navigator.geolocation) {
            console.warn('Geolocation not supported');
            return;
        }

        setIsDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setPosition([lat, lng]);
                // Initial update with coordinates, then reverseGeocode will update again with address
                onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                reverseGeocode(lat, lng);
                setIsDetecting(false);
            },
            (err) => {
                console.warn('Location detection failed:', err.message);
                setIsDetecting(false);
                // Fallback to a default if user denies permission? No, just let them pick manually.
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
            );
            const data = await res.json();
            if (data.display_name) {
                const addr = data.display_name;
                setLocationAddress(addr);
                onLocationSelect(lat, lng, addr);
            }
        } catch (err) {
            console.warn('Reverse geocoding failed:', err);
        }
    };

    const MapEvents = () => {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                setPosition([lat, lng]);
                onLocationSelect(lat, lng);
                reverseGeocode(lat, lng);
            },
        });
        return null;
    };

    const RecenterMap = ({ pos }: { pos: [number, number] }) => {
        const map = useMap();
        useEffect(() => {
            if (pos) map.setView(pos, 15);
        }, [pos]);
        return null;
    };

    return (
        <div className="space-y-2">
            <div className="h-[350px] w-full rounded-3xl overflow-hidden border border-black/5 relative shadow-inner">
                <MapContainer
                    center={position || [12.9716, 77.5946]}
                    zoom={position ? 15 : 13}
                    style={{ height: '100%', width: '100%' }}
                    className="z-0"
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <MapEvents />
                    {position && <Marker position={position} />}
                    {position && <RecenterMap pos={position} />}
                </MapContainer>

                {/* Auto-detect button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        detectLocation();
                    }}
                    disabled={isDetecting}
                    className="absolute top-3 right-3 z-[1000] bg-white shadow-lg rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-amber-600 hover:bg-amber-50 transition-all border border-gray-100 disabled:opacity-50"
                >
                    {isDetecting ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Detecting...
                        </>
                    ) : (
                        <>
                            <Navigation size={14} />
                            Auto Detect
                        </>
                    )}
                </button>

                {!position && !isDetecting && (
                    <div className="absolute inset-0 bg-[#FFFCF9]/40 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl border border-black/5 animate-pulse">
                            <MapPin size={24} className="text-[#D97168]" />
                        </div>
                        <p className="text-[10px] font-ui font-bold text-[#2A2A2A] tracking-[0.3em] uppercase">Click map or use Auto Detect</p>
                    </div>
                )}

                {isDetecting && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl border border-amber-200">
                            <Loader2 size={24} className="text-amber-500 animate-spin" />
                        </div>
                        <p className="text-[10px] font-bold text-amber-700 tracking-[0.3em] uppercase">Detecting your GPS location...</p>
                    </div>
                )}
            </div>

            {/* Location address display */}
            {position && (
                <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <MapPin size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Location Pinned</p>
                        <p className="text-xs text-emerald-600 truncate">
                            {locationAddress || `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
