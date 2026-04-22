import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, Send, Clock, Camera, Award, User } from 'lucide-react';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../hooks/useAuth';

const RateHelperPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useNotifications();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();

    const helperId = searchParams.get('helperId') || '';
    const helperName = searchParams.get('name') || 'Helper';
    const requestId = searchParams.get('requestId') || '';
    const taskId = searchParams.get('taskId') || '';
    const completionTime = Number(searchParams.get('time')) || 0;
    const photoCount = Number(searchParams.get('photos')) || 0;

    const [scores, setScores] = useState({ punctuality: 0, photoQuality: 0, professionalism: 0, accuracy: 0 });
    const [comment, setComment] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const categories = [
        { key: 'punctuality', label: 'Punctuality', icon: Clock, hint: completionTime ? `Completed in ${completionTime} min` : 'Was the helper on time?' },
        { key: 'photoQuality', label: 'Photo Quality', icon: Camera, hint: photoCount ? `${photoCount} GPS-verified photos` : 'Quality of submitted photos' },
        { key: 'professionalism', label: 'Professionalism', icon: User, hint: 'Communication & behavior' },
        { key: 'accuracy', label: 'Accuracy', icon: Award, hint: 'How accurate was the verification?' },
    ];

    const allRated = Object.values(scores).every((s) => s > 0);
    const weightedScore = allRated ? Math.round((scores.punctuality * 0.25 + scores.photoQuality * 0.30 + scores.professionalism * 0.20 + scores.accuracy * 0.25) * 10) / 10 : 0;

    const handleSubmit = async () => {
        if (!allRated) { showToast('Please rate all categories', 'warning'); return; }
        setSubmitting(true);
        try {
            await api.post('/ratings/', {
                helperId,
                requestId: requestId || undefined,
                taskId: taskId || undefined,
                scores,
                comment: comment || undefined,
                isPublic,
                taskCompletionTime: completionTime || undefined,
                photoCount: photoCount || undefined,
                wasOnTime: true,
            });
            showToast('Rating submitted! Thank you! ⭐', 'success');
            navigate(-1);
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to submit rating', 'warning');
        }
        setSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/20 pt-20 pb-12 px-4">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><ChevronLeft size={18} /></button>
                    <h1 className="text-lg font-black text-gray-800">Rate Helper</h1>
                </div>

                {/* Helper info */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                        <User size={32} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-800">{helperName}</h2>
                        {allRated && (
                            <div className="flex items-center gap-1 mt-1">
                                <Star size={16} className="text-amber-500 fill-amber-500" />
                                <span className="text-lg font-black text-amber-600">{weightedScore}</span>
                                <span className="text-xs text-gray-400 ml-1">weighted score</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rating categories */}
                <div className="space-y-4">
                    {categories.map((cat) => (
                        <motion.div
                            key={cat.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-gray-200 p-5"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <cat.icon size={16} className="text-gray-500" />
                                <span className="text-sm font-black text-gray-700">{cat.label}</span>
                                <span className="text-xs text-gray-300 ml-auto">{cat.key === 'punctuality' ? '25%' : cat.key === 'photoQuality' ? '30%' : cat.key === 'professionalism' ? '20%' : '25%'}</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">{cat.hint}</p>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setScores((prev) => ({ ...prev, [cat.key]: star }))}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            size={36}
                                            className={`transition-colors ${
                                                star <= (scores as any)[cat.key]
                                                    ? 'text-amber-500 fill-amber-500'
                                                    : 'text-gray-200'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Weighted score preview */}
                {allRated && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-amber-50 to-amber-100/60 rounded-2xl border border-amber-200 p-5 text-center"
                    >
                        <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Weighted Score</p>
                        <p className="text-4xl font-black text-amber-600 mt-1">{weightedScore}</p>
                        <p className="text-xs text-amber-500 mt-1">
                            Punct({scores.punctuality})×0.25 + Photo({scores.photoQuality})×0.30 + Prof({scores.professionalism})×0.20 + Acc({scores.accuracy})×0.25
                        </p>
                    </motion.div>
                )}

                {/* Comment */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Comment (Optional)</h3>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value.substring(0, 500))}
                        placeholder="Share your experience with this helper..."
                        className="w-full h-24 rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none"
                    />
                    <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-4 h-4 accent-amber-600" />
                            <span className="text-sm text-gray-600">Make rating public</span>
                        </label>
                        <span className="text-xs text-gray-400">{comment.length}/500</span>
                    </div>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={!allRated || submitting}
                    className={`w-full h-14 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                        allRated && !submitting
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-xl shadow-amber-200/50 hover:-translate-y-0.5'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {submitting ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Rating</>}
                </button>
            </div>
        </div>
    );
};

export default RateHelperPage;
