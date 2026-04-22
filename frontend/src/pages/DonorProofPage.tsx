import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Clock, CheckCircle2, XCircle, Shield, Star, MessageSquare, AlertTriangle, Eye } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const DonorProofPage: React.FC = () => {
    const navigate = useNavigate();
    const { requestId } = useParams();
    const { user } = useAuth();

    const [proofs, setProofs] = useState<any[]>([]);
    const [request, setRequest] = useState<any>(null);
    const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [proofRes, reqRes] = await Promise.all([
                    api.get(`/help-requests/${requestId}/proof-photos`),
                    api.get(`/help-requests/${requestId}`),
                ]);
                setProofs(proofRes.data.data.proofs || []);
                setRequest(reqRes.data.data.helpRequest);
            } catch { }
            setLoading(false);
        };
        fetchData();
    }, [requestId]);

    const allPhotos = proofs.flatMap((p: any) => (p.images || []).map((img: any, idx: number) => ({
        url: img.originalUrl || img.url || `photo_${idx}`,
        proof: p,
    })));

    const currentPhoto = allPhotos[currentPhotoIdx];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-amber-50/20">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/20 pt-20 pb-12 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><ChevronLeft size={18} /></button>
                    <div className="flex-1">
                        <h1 className="text-lg font-black text-gray-800">Proof Photos</h1>
                        <p className="text-xs text-gray-400">{request?.title || 'Verification'}</p>
                    </div>
                    <div className="bg-emerald-100 px-3 py-1 rounded-full">
                        <span className="text-xs font-bold text-emerald-700">{allPhotos.length} photos</span>
                    </div>
                </div>

                {/* Request info */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-gray-500">Request</p>
                    <p className="text-lg font-black text-gray-800">{request?.title || 'Loading...'}</p>
                    <p className="text-xs text-gray-400 mt-1">Institution: {(request?.donorId as any)?.profile?.fullName || 'N/A'}</p>
                </div>

                {/* Photo Carousel */}
                {allPhotos.length > 0 ? (
                    <div className="space-y-4">
                        <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-[4/3]">
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center text-white">
                                    <Eye size={48} className="mx-auto mb-2 opacity-40" />
                                    <p className="text-sm opacity-60">{currentPhoto?.url}</p>
                                    <p className="text-xs opacity-40 mt-1">GPS-Verified Photo {currentPhotoIdx + 1}</p>
                                </div>
                            </div>
                            {/* Navigation arrows */}
                            {currentPhotoIdx > 0 && (
                                <button onClick={() => setCurrentPhotoIdx((p) => p - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60">
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            {currentPhotoIdx < allPhotos.length - 1 && (
                                <button onClick={() => setCurrentPhotoIdx((p) => p + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60">
                                    <ChevronRight size={20} />
                                </button>
                            )}
                            {/* Counter */}
                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1">
                                <span className="text-sm text-white font-bold">{currentPhotoIdx + 1} / {allPhotos.length}</span>
                            </div>
                        </div>

                        {/* Thumbnail strip */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {allPhotos.map((_, idx) => (
                                <button key={idx} onClick={() => setCurrentPhotoIdx(idx)} className={`w-14 h-14 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold transition-all ${idx === currentPhotoIdx ? 'ring-2 ring-amber-500 bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-amber-50 rounded-2xl border border-amber-200 p-8 text-center">
                        <AlertTriangle size={40} className="text-amber-500 mx-auto mb-3" />
                        <h3 className="font-bold text-amber-800">No proof photos yet</h3>
                        <p className="text-sm text-amber-600 mt-1">The helper hasn't uploaded proof photos yet.</p>
                    </div>
                )}

                {/* Verification status from proofs */}
                {proofs.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Verification Status</h3>
                        {proofs.map((proof: any, idx: number) => (
                            <div key={idx} className={`rounded-xl p-4 border ${proof.verificationStatus === 'passed' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {proof.verificationStatus === 'passed' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Clock size={18} className="text-amber-600" />}
                                    <span className={`text-sm font-bold ${proof.verificationStatus === 'passed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {proof.verificationStatus === 'passed' ? 'Verification Passed' : 'Under Review'}
                                    </span>
                                </div>
                                {proof.aiAnalysis && (
                                    <div className="text-xs text-gray-500 space-y-0.5">
                                        <p>Confidence: {proof.aiAnalysis.overallConfidence}%</p>
                                        <p>Photos: {proof.images?.length || 0}</p>
                                        {proof.uploadMetadata?.gpsCoordinates && <p>📍 GPS verified</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Verified by */}
                {proofs[0]?.uploadedBy && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Verified By</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Shield size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{proofs[0].uploadedBy?.profile?.fullName || 'Helper'}</p>
                                <div className="flex items-center gap-1">
                                    <Star size={12} className="text-amber-500 fill-amber-500" />
                                    <span className="text-xs text-gray-500">{proofs[0].uploadedBy?.helperProfile?.ratings?.overall || 'N/A'} rating</span>
                                    <span className="text-xs text-gray-300 mx-1">|</span>
                                    <span className="text-xs text-gray-500">{proofs[0].uploadedBy?.helperProfile?.tier || 'NONE'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Review actions (for escrow donors) */}
                <div className="space-y-3">
                    <button onClick={() => navigate('/dashboard')} className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-emerald-200/50">
                        <CheckCircle2 size={18} /> Approve Proof
                    </button>
                    <div className="flex gap-3">
                        <button className="flex-1 h-11 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center gap-2 border border-blue-200 hover:bg-blue-100">
                            <MessageSquare size={14} /> Ask Question
                        </button>
                        <button className="flex-1 h-11 rounded-xl bg-red-50 text-red-700 font-bold text-sm flex items-center justify-center gap-2 border border-red-200 hover:bg-red-100">
                            <AlertTriangle size={14} /> Raise Concern
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonorProofPage;
