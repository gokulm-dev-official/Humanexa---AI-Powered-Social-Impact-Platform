import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { getMe } from '../features/auth/authSlice';

const ADMIN_EMAIL = 'gokulpersonal64@gmail.com';
const ADMIN_PASSWORD = 'gokul1234';

const AdminLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            setError('Invalid admin credentials. Access denied.');
            return;
        }

        setLoading(true);
        try {
            // Try login first
            let token = '';
            try {
                const res = await api.post('/auth/login', { email, password });
                token = res.data?.token || '';
            } catch {
                // User doesn't exist, register as admin
                try {
                    const regRes = await api.post('/auth/register', {
                        email: ADMIN_EMAIL,
                        password: ADMIN_PASSWORD,
                        fullName: 'Platform Admin',
                        role: 'admin',
                        phoneNumber: '0000000000',
                    });
                    token = regRes.data?.token || '';
                } catch (regErr: any) {
                    // Already exists with different password? Try login again
                    try {
                        const retryRes = await api.post('/auth/login', { email, password });
                        token = retryRes.data?.token || '';
                    } catch {
                        setError('Admin account setup failed. Contact support.');
                        setLoading(false);
                        return;
                    }
                }
            }

            if (token) {
                localStorage.setItem('token', token);
                // Set admin auth flag for route protection
                localStorage.setItem('adminAuth', 'true');
                await dispatch(getMe());
                // Small delay to let auth state propagate
                setTimeout(() => navigate('/admin/escrow'), 300);
            } else {
                setError('Failed to obtain auth token.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-red-600/5 blur-[150px] rounded-full" />
                <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[150px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-500/20"
                    >
                        <Shield size={28} className="text-white" />
                    </motion.div>
                    <h1 className="text-[28px] font-bold text-white tracking-tight">Admin Console</h1>
                    <p className="text-[13px] text-white/30 mt-2 tracking-wide">Authorized personnel only • Escrow management</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Admin Email</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter admin email"
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white text-[14px] font-medium placeholder:text-white/15 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Password</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 text-white text-[14px] font-medium placeholder:text-white/15 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                        >
                            <AlertCircle size={14} className="text-red-400 shrink-0" />
                            <p className="text-[12px] text-red-400 font-medium">{error}</p>
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 text-white text-[14px] font-bold rounded-xl hover:from-red-500 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Shield size={16} />
                                Access Admin Console
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-[11px] text-white/15 mt-8">
                    Protected by AES-256 encryption • Humanexa Platform
                </p>
            </motion.div>
        </div>
    );
};

export default AdminLoginPage;
