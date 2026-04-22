import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Camera, CheckCircle2, AlertTriangle, Upload, ChevronLeft, MapPin, FileText } from 'lucide-react';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../hooks/useAuth';

const HelperCountdownPage: React.FC = () => {
    const navigate = useNavigate();
    const { taskId } = useParams();
    const { showToast } = useNotifications();
    const { user } = useAuth();

    const [task, setTask] = useState<any>(null);
    const [timeRemaining, setTimeRemaining] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');
    const [checklist, setChecklist] = useState({
        itemsVerified: false, quantitiesChecked: false, expiryDatesChecked: false, matchedWithBills: false, staffConfirmed: false,
    });

    const fetchTask = useCallback(async () => {
        try {
            const res = await api.get(`/tasks/${taskId}`);
            setTask(res.data.data.task);
            setTimeRemaining(res.data.data.timeRemaining);
        } catch { showToast('Failed to load task', 'warning'); }
        setLoading(false);
    }, [taskId, showToast]);

    useEffect(() => { fetchTask(); }, [fetchTask]);

    // Live countdown
    useEffect(() => {
        if (!task?.countdownDeadline) return;
        const interval = setInterval(() => {
            const msLeft = new Date(task.countdownDeadline).getTime() - Date.now();
            if (msLeft <= 0) {
                setTimeRemaining({ secondsLeft: 0, minutesLeft: 0, isExpired: true, percentUsed: 100 });
                clearInterval(interval);
                return;
            }
            const totalSecs = Math.floor(msLeft / 1000);
            setTimeRemaining({
                secondsLeft: totalSecs,
                minutesLeft: Math.floor(totalSecs / 60),
                isExpired: false,
                percentUsed: Math.round(((30 * 60 * 1000 - msLeft) / (30 * 60 * 1000)) * 100),
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [task?.countdownDeadline]);

    const uploadPhoto = async () => {
        try {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const res = await api.post(`/tasks/${taskId}/upload-photo`, {
                    photoUrl: `proof_photo_${Date.now()}`,
                    gpsLatitude: pos.coords.latitude,
                    gpsLongitude: pos.coords.longitude,
                    timestamp: new Date().toISOString(),
                    photoType: 'general',
                });
                setTask((prev: any) => ({ ...prev, proofPhotos: [...(prev.proofPhotos || []), {}] }));
                showToast(`Photo uploaded! ${res.data.data.photosUploaded}/5`, 'success');
                fetchTask();
            });
        } catch { showToast('Failed to upload photo', 'warning'); }
    };

    const submitTask = async () => {
        setSubmitting(true);
        try {
            await api.post(`/tasks/${taskId}/complete`, { checklist, notes });
            showToast('Task completed! Payment released! 🎉', 'success');
            navigate('/dashboard');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to submit', 'warning');
        }
        setSubmitting(false);
    };

    const mins = timeRemaining ? Math.floor(timeRemaining.secondsLeft / 60) : 0;
    const secs = timeRemaining ? timeRemaining.secondsLeft % 60 : 0;
    const timerColor = mins > 20 ? 'text-emerald-600' : mins > 10 ? 'text-amber-600' : 'text-red-600';
    const barColor = mins > 20 ? 'bg-emerald-500' : mins > 10 ? 'bg-amber-500' : 'bg-red-500';
    const photosCount = task?.proofPhotos?.length || 0;
    const allChecked = Object.values(checklist).every(Boolean);
    const canSubmit = photosCount >= 5 && allChecked && !timeRemaining?.isExpired;

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

    if (timeRemaining?.isExpired && task?.status !== 'COMPLETED_ON_TIME') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100/50 flex items-center justify-center px-4">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                        <AlertTriangle size={48} className="text-red-600" />
                    </div>
                    <h1 className="text-3xl font-black text-red-700">TIME EXPIRED</h1>
                    <div className="bg-white rounded-xl border border-red-200 p-5 text-left space-y-2 text-sm">
                        <p className="text-gray-600">⏰ Deadline: <strong>{task?.countdownDeadline ? new Date(task.countdownDeadline).toLocaleTimeString() : 'N/A'}</strong></p>
                        <p className="text-gray-600">❌ No payment will be issued</p>
                        <p className="text-gray-600">📉 Rating impact: -0.2 points</p>
                        <p className="text-gray-600">🔄 Task will be reassigned</p>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="w-full h-14 rounded-xl bg-red-500 text-white font-black uppercase tracking-widest">
                        Understood — Go to Dashboard
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pt-20 pb-12 px-4">
            <div className="max-w-lg mx-auto space-y-5">
                {/* Timer banner */}
                <div className={`rounded-2xl p-5 text-center ${mins > 20 ? 'bg-emerald-50 border border-emerald-200' : mins > 10 ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Time Remaining</p>
                    <p className={`text-5xl font-black font-mono ${timerColor}`}>
                        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                    </p>
                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div className={`h-full ${barColor} rounded-full`} animate={{ width: `${timeRemaining?.percentUsed || 0}%` }} transition={{ duration: 0.5 }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Started: {task?.countdownStartedAt ? new Date(task.countdownStartedAt).toLocaleTimeString() : '--'}</span>
                        <span>Deadline: {task?.countdownDeadline ? new Date(task.countdownDeadline).toLocaleTimeString() : '--'}</span>
                    </div>
                </div>

                {/* Header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-gray-100"><ChevronLeft size={18} /></button>
                    <div>
                        <h1 className="text-lg font-black text-gray-800">Verification Task</h1>
                        <p className="text-xs text-gray-400">Task ID: {task?.taskId}</p>
                    </div>
                </div>

                {/* Checklist */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Verification Checklist</h3>
                    {[
                        { key: 'itemsVerified', label: 'Items verified against request' },
                        { key: 'quantitiesChecked', label: 'Quantities checked' },
                        { key: 'expiryDatesChecked', label: 'Expiry dates checked' },
                        { key: 'matchedWithBills', label: 'Matched with bills/invoices' },
                        { key: 'staffConfirmed', label: 'Staff confirmed delivery' },
                    ].map((item) => (
                        <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={(checklist as any)[item.key]}
                                onChange={(e) => setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                                className="w-5 h-5 rounded border-2 border-gray-300 accent-emerald-600"
                            />
                            <span className={`text-sm ${(checklist as any)[item.key] ? 'text-emerald-700 font-bold' : 'text-gray-600'} group-hover:text-gray-900`}>
                                {item.label}
                            </span>
                        </label>
                    ))}
                </div>

                {/* Photos */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Proof Photos</h3>
                        <span className={`text-sm font-black ${photosCount >= 5 ? 'text-emerald-600' : 'text-amber-600'}`}>{photosCount} / 5</span>
                    </div>

                    {photosCount > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {Array.from({ length: photosCount }).map((_, i) => (
                                <div key={i} className="aspect-square rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                                    <CheckCircle2 size={24} className="text-emerald-500" />
                                </div>
                            ))}
                        </div>
                    )}

                    <button onClick={uploadPhoto} className="w-full h-12 rounded-xl bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors">
                        <Camera size={18} /> Take More Photos
                    </button>
                    {photosCount < 5 && <p className="text-xs text-amber-600 text-center font-bold">Need {5 - photosCount} more photo(s)</p>}
                </div>

                {/* Notes */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><FileText size={14} /> Verification Notes</h3>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value.substring(0, 500))}
                        placeholder="Optional: Add notes about the verification..."
                        className="w-full h-24 rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none"
                    />
                    <p className="text-xs text-gray-400 text-right">{notes.length}/500</p>
                </div>

                {/* Submit */}
                <button
                    onClick={submitTask}
                    disabled={!canSubmit || submitting}
                    className={`w-full h-16 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                        canSubmit && !submitting
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-xl shadow-emerald-200/50 hover:-translate-y-0.5'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {submitting ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : <><Upload size={18} /> Submit Verification Report</>}
                </button>

                {!canSubmit && !timeRemaining?.isExpired && (
                    <p className="text-xs text-center text-gray-400">
                        {photosCount < 5 ? `Need ${5 - photosCount} more photos. ` : ''}
                        {!allChecked ? 'Complete all checklist items.' : ''}
                    </p>
                )}
            </div>
        </div>
    );
};

export default HelperCountdownPage;
