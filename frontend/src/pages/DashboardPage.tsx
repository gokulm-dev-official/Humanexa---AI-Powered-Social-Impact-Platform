import React, { useEffect, useState, useMemo, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import {
    Target,
    Award,
    ShieldCheck,
    Zap,
    ArrowRight,
    TrendingUp,
    Heart,
    Star,
    Sparkles,
    ChevronRight,
    MapPin,
    Clock,
    Trophy,
    Activity,
    Eye,
    CheckCircle2,
    AlertCircle,
    X,
    IndianRupee,
    Send,
    Camera,
    Receipt,
    UserCheck,
    ArrowUpRight,
    Search,
    Plus,
    Download,
    FileText,
    Calendar,
    Lock,
    Zap as ZapIcon,
    Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

// Design System Components
import { Button } from '../components/design-system/Button';
import { Card } from '../components/design-system/Card';
import { Badge } from '../components/design-system/Badge';
import { useNotifications } from '../context/NotificationContext';

const appleSpring = { type: 'spring', damping: 26, stiffness: 300 };
const appleEase = [0.25, 0.1, 0.25, 1] as const;

const DashboardPage = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useNotifications();
    const [leaderboard, setLeaderboard] = useState<any>({ dailyDonors: [], dailyHelpers: [] });
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [broadcasts, setBroadcasts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Donation history state
    const [donationHistory, setDonationHistory] = useState<any[]>([]);
    const [totalDonated, setTotalDonated] = useState(0);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);

    // Donation modal state
    const [showDonateModal, setShowDonateModal] = useState(false);
    const [selectedBroadcast, setSelectedBroadcast] = useState<any>(null);
    const [donationAmount, setDonationAmount] = useState('');
    const [isDonating, setIsDonating] = useState(false);

    useEffect(() => {
        refreshUser();
        fetchDashboardData();
        fetchDonationHistory();

        // Auto-register helper location so they appear in emergency searches
        if (user?.role === 'helper' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    api.post('/emergency/helper/location/update', {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                    }).catch(() => {});
                    console.log('Helper location auto-registered:', pos.coords.latitude, pos.coords.longitude);
                },
                () => console.warn('Could not get helper location for auto-registration'),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        }
    }, []);

    // Handle ?donate=<requestId> from notification clicks
    useEffect(() => {
        const donateId = searchParams.get('donate');
        if (donateId && broadcasts.length > 0) {
            const target = broadcasts.find((b: any) => b._id === donateId);
            if (target) {
                openDonateModal(target);
                setSearchParams({});
            }
        } else if (donateId && !isLoading) {
            api.get(`/help-requests/${donateId}`).then(res => {
                if (res.data?.data?.helpRequest) {
                    openDonateModal(res.data.data.helpRequest);
                    setSearchParams({});
                }
            }).catch(() => {
                showToast('Request not found or no longer active', 'warning');
                setSearchParams({});
            });
        }
    }, [broadcasts, isLoading, searchParams]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const [leaderboardRes, myRequestsRes, broadcastsRes] = await Promise.all([
                api.get('/admin/leaderboard'),
                api.get('/help-requests/my'),
                api.get('/help-requests/broadcasts')
            ]);

            if (leaderboardRes.data?.data) setLeaderboard(leaderboardRes.data.data);
            if (myRequestsRes.data?.data?.requests) setMyRequests(myRequestsRes.data.data.requests);
            if (broadcastsRes.data?.data?.requests) setBroadcasts(broadcastsRes.data.data.requests);
        } catch (err) {
            console.error('Failed to fetch dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDonationHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await api.get('/impact-chat/donation-history');
            if (res.data?.data) {
                setDonationHistory(res.data.data.donations || []);
                setTotalDonated(res.data.data.totalDonated || 0);
            }
        } catch (err) {
            console.error('Failed to fetch donation history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const downloadReceipt = useCallback(async (donation: any) => {
        setDownloadingReceipt(donation._id);
        try {
            const receiptDiv = document.createElement('div');
            receiptDiv.style.position = 'fixed';
            receiptDiv.style.top = '-10000px';
            receiptDiv.style.width = '800px';
            receiptDiv.style.padding = '48px';
            receiptDiv.style.backgroundColor = '#ffffff';
            receiptDiv.style.fontFamily = 'Inter, system-ui, sans-serif';
            receiptDiv.innerHTML = `
                <div style="border: 2px solid #E5E7EB; border-radius: 16px; padding: 40px; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px;">
                        <div>
                            <h1 style="font-size: 28px; font-weight: 900; color: #1a1a1a; margin: 0 0 4px 0; letter-spacing: -0.5px;">HUMANEXA</h1>
                            <p style="font-size: 11px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 3px; margin: 0;">Donation Receipt</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 11px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0;">Receipt ID</p>
                            <p style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0; font-family: monospace;">${donation.receiptId}</p>
                        </div>
                    </div>
                    <div style="height: 1px; background: #E5E7EB; margin: 24px 0;"></div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                        <div>
                            <p style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px 0;">Donor</p>
                            <p style="font-size: 16px; font-weight: 700; color: #1a1a1a; margin: 0;">${donation.donorName || user?.profile?.fullName || 'Donor'}</p>
                        </div>
                        <div>
                            <p style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px 0;">Beneficiary</p>
                            <p style="font-size: 16px; font-weight: 700; color: #1a1a1a; margin: 0;">${donation.beneficiaryName || 'Citizen'}</p>
                        </div>
                        <div>
                            <p style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px 0;">Date</p>
                            <p style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0;">${new Date(donation.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div>
                            <p style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px 0;">Donation Type</p>
                            <p style="font-size: 14px; font-weight: 600; color: ${donation.donationType === 'ESCROW' ? '#059669' : '#D97706'}; margin: 0;">${donation.donationType === 'ESCROW' ? '🔒 Escrow Protected' : '⚡ Direct Transfer'}</p>
                        </div>
                    </div>
                    <div style="background: linear-gradient(135deg, #1E40AF, #3B82F6); border-radius: 16px; padding: 28px; text-align: center; margin: 24px 0;">
                        <p style="font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 3px; margin: 0 0 8px 0;">Amount Donated</p>
                        <p style="font-size: 42px; font-weight: 900; color: #ffffff; margin: 0;">₹${donation.amount.toLocaleString('en-IN')}</p>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                        <div style="background: #F9FAFB; border-radius: 12px; padding: 16px;">
                            <p style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0;">Reference ID</p>
                            <p style="font-size: 12px; font-weight: 600; color: #374151; margin: 0; font-family: monospace; word-break: break-all;">${donation.referenceId}</p>
                        </div>
                        <div style="background: #F9FAFB; border-radius: 12px; padding: 16px;">
                            <p style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0;">Status</p>
                            <p style="font-size: 14px; font-weight: 700; color: ${donation.status === 'completed' ? '#059669' : '#DC2626'}; margin: 0;">${donation.status === 'completed' ? '✅ Completed' : '↩️ Refunded'}</p>
                        </div>
                    </div>
                    <div style="height: 1px; background: #E5E7EB; margin: 24px 0;"></div>
                    <p style="font-size: 10px; color: #9CA3AF; text-align: center; margin: 0;">This is an auto-generated receipt from Humanexa Platform. Transaction verified on blockchain.</p>
                </div>
            `;
            document.body.appendChild(receiptDiv);
            const canvas = await html2canvas(receiptDiv, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
            pdf.save(`Humanexa_Receipt_${donation.receiptId}.pdf`);
            document.body.removeChild(receiptDiv);
            showToast('Receipt downloaded successfully!', 'success');
        } catch (err) {
            console.error('Receipt download failed:', err);
            showToast('Failed to generate receipt', 'error');
        } finally {
            setDownloadingReceipt(null);
        }
    }, [user]);

    const openDonateModal = (bc: any) => {
        setSelectedBroadcast(bc);
        setDonationAmount('');
        setShowDonateModal(true);
    };

    const handleDonate = () => {
        if (!selectedBroadcast || !donationAmount || Number(donationAmount) <= 0) {
            showToast('Please enter a valid amount', 'warning');
            return;
        }

        // Redirect to the new donation type selection page
        navigate(`/donate?requestId=${selectedBroadcast._id}&amount=${donationAmount}`);
        setShowDonateModal(false);
    };

    // ─── Stats Configuration ───
    const stats = [
        {
            label: 'Total Contributions',
            value: user?.statistics?.totalHelps || 0,
            icon: <Heart size={20} />,
            color: 'text-accent',
            bg: 'bg-accent/8',
            description: 'People you\'ve helped'
        },
        {
            label: 'Trust Score',
            value: user?.creditScore?.totalPoints || 0,
            icon: <ShieldCheck size={20} />,
            color: 'text-success',
            bg: 'bg-success/8',
            description: 'Your credibility rating'
        },
        {
            label: 'Lives Impacted',
            value: user?.statistics?.livesTouched || 0,
            icon: <Target size={20} />,
            color: 'text-warning',
            bg: 'bg-warning/8',
            description: 'Direct impact made'
        },
        {
            label: 'Current Rank',
            value: user?.creditScore?.rank || 'Bronze',
            icon: <Trophy size={20} />,
            color: 'text-amber-500',
            bg: 'bg-amber-500/8',
            description: 'Community standing'
        },
    ];

    // ─── Request Status Mapping ───
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'open': return { label: 'Open', color: 'bg-accent/10 text-accent', icon: <Activity size={12} /> };
            case 'funding': return { label: 'Funding', color: 'bg-warning/10 text-warning-600', icon: <TrendingUp size={12} /> };
            case 'funded': return { label: 'Fully Funded', color: 'bg-success/10 text-success-600', icon: <CheckCircle2 size={12} /> };
            case 'assigned': return { label: 'In Progress', color: 'bg-warning/10 text-warning-600', icon: <Clock size={12} /> };
            case 'proof_submitted': return { label: 'Proof Received', color: 'bg-purple-100 text-purple-700', icon: <Eye size={12} /> };
            case 'completed': return { label: 'Completed', color: 'bg-success/10 text-success-600', icon: <CheckCircle2 size={12} /> };
            case 'cancelled': return { label: 'Cancelled', color: 'bg-black/[0.04] text-secondary-text', icon: <AlertCircle size={12} /> };
            default: return { label: status, color: 'bg-black/[0.04] text-secondary-text', icon: <Activity size={12} /> };
        }
    };

    const quickAmounts = [100, 500, 1000, 2500, 5000];

    // ─── Quick Action Items ───
    const donorActions = [
        { label: 'Donation History', desc: 'View receipts & tax docs', icon: <Receipt size={20} />, color: 'text-amber-600', bg: 'bg-amber-500/8', hover: 'hover:border-amber-200', path: '/donation-history' },
        { label: 'Discover Nearby', desc: 'Find people who need help', icon: <MapPin size={20} />, color: 'text-accent', bg: 'bg-accent/8', hover: 'hover:border-accent/20', path: '/discovery' },
        { label: 'Blood Donation', desc: 'Request or donate blood', icon: <Heart size={20} />, color: 'text-red-500', bg: 'bg-red-500/8', hover: 'hover:border-red-200', path: '/blood-donation' },
        { label: 'Institutions', desc: 'Support verified organizations', icon: <Building2 size={20} />, color: 'text-purple-600', bg: 'bg-purple-500/8', hover: 'hover:border-purple-200', path: '/institutions' },
        { label: 'Live Impact Feed', desc: 'See verified proof photos', icon: <Eye size={20} />, color: 'text-success', bg: 'bg-success/8', hover: 'hover:border-success/20', path: '/live-impact' },
    ];

    const helperActions = [
        { label: 'Photo Verification', desc: 'Submit GPS-verified proof', icon: <Camera size={20} />, color: 'text-accent', bg: 'bg-accent/8', hover: 'hover:border-accent/20', path: '/helper/verify' },
        { label: 'Blood Donation', desc: 'Request or donate blood', icon: <Heart size={20} />, color: 'text-red-500', bg: 'bg-red-500/8', hover: 'hover:border-red-200', path: '/blood-donation' },
        { label: 'Institutions', desc: 'Support verified organizations', icon: <Building2 size={20} />, color: 'text-purple-600', bg: 'bg-purple-500/8', hover: 'hover:border-purple-200', path: '/institutions' },
        { label: 'Impact Dashboard', desc: 'Track your contributions', icon: <Activity size={20} />, color: 'text-amber-500', bg: 'bg-amber-500/8', hover: 'hover:border-amber-200', path: '/live-impact' },
        { label: 'My Profile', desc: 'Ratings & public reviews', icon: <UserCheck size={20} />, color: 'text-success', bg: 'bg-success/8', hover: 'hover:border-success/20', path: `/helper/profile/${user?._id}` },
    ];

    const actions = user?.role === 'helper' ? helperActions : donorActions;

    return (
        <div className="min-h-screen bg-background pt-20 pb-16 px-5 lg:px-8 relative overflow-hidden">
            {/* ─── Atmospheric Background ─── */}
            <div className="orb-blue w-[600px] h-[600px] top-[-200px] right-[-200px]" />
            <div className="orb-green w-[500px] h-[500px] bottom-[-200px] left-[-200px]" />

            <div className="max-w-6xl mx-auto relative z-10">

                {/* ═══════════════════════════════════════════
                    HEADER SECTION
                ═══════════════════════════════════════════ */}
                <motion.header
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: appleEase }}
                    className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                >
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                            {user?.verificationStatus?.idVerified && (
                                <Badge variant="success" dot>Verified Account</Badge>
                            )}
                            {!user?.verificationStatus?.idVerified && (
                                <Badge variant="neutral" dot>ID #{user?._id?.slice(-6).toUpperCase()}</Badge>
                            )}
                        </div>
                        <h1 className="text-[36px] md:text-[42px] font-bold text-primary-text tracking-tight leading-[1.1]">
                            Welcome back, {user?.profile?.fullName?.split(' ')[0] || 'there'}
                        </h1>
                        <p className="text-[15px] text-secondary-text max-w-md leading-relaxed">
                            Here's what's happening with your impact today. Every contribution matters.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/profile')}
                        >
                            View Profile
                        </Button>
                        <Button
                            variant="primary"
                            leftIcon={<Plus size={16} />}
                            onClick={() => navigate('/create-request')}
                        >
                            New Request
                        </Button>
                    </div>
                </motion.header>

                {/* ═══════════════════════════════════════════
                    EMERGENCY ALERT
                ═══════════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5, ease: appleEase }}
                    className="mb-8"
                >
                    <button
                        onClick={() => navigate(user?.role === 'helper' ? '/helper/emergency' : '/emergency')}
                        className="w-full md:w-auto group"
                    >
                        <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-danger/[0.06] border border-danger/10 hover:bg-danger/[0.1] hover:border-danger/20 transition-all duration-300 ease-apple">
                            <div className="relative flex-shrink-0">
                                <div className="w-2 h-2 rounded-full bg-danger animate-gentle-pulse" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-[14px] font-semibold text-danger">Emergency Signal</p>
                                <p className="text-[12px] text-danger/60">
                                    {user?.role === 'helper' ? 'View nearby emergency alerts' : 'Send help request to nearby helpers'}
                                </p>
                            </div>
                            <ChevronRight size={16} className="text-danger/40 group-hover:translate-x-0.5 transition-transform duration-200" />
                        </div>
                    </button>
                </motion.div>

                {/* ═══════════════════════════════════════════
                    STATS GRID
                ═══════════════════════════════════════════ */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 + i * 0.06, duration: 0.5, ease: appleEase }}
                        >
                            <div className="stat-card">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.bg, stat.color)}>
                                    {stat.icon}
                                </div>
                                <h3 className="text-[28px] font-bold text-primary-text tracking-tight leading-none mb-1">
                                    {stat.value}
                                </h3>
                                <p className="text-[13px] font-medium text-primary-text/80 mb-0.5">{stat.label}</p>
                                <p className="text-[11px] text-secondary-text">{stat.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ═══════════════════════════════════════════
                    QUICK ACTIONS
                ═══════════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5, ease: appleEase }}
                    className="mb-10"
                >
                    <div className="flex items-center justify-between mb-4 px-0.5">
                        <h2 className="text-[20px] font-semibold text-primary-text">Quick Actions</h2>
                        <Badge variant="accent" size="sm">
                            {user?.role === 'helper' ? 'Helper' : 'Donor'} Tools
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {actions.map((action, i) => (
                            <button
                                key={action.label}
                                onClick={() => navigate(action.path)}
                                className={cn(
                                    "group relative p-5 rounded-2xl bg-white border border-black/[0.04] transition-all duration-300 ease-apple text-left",
                                    action.hover,
                                    "hover:shadow-soft-md hover:-translate-y-[1px]"
                                )}
                            >
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 transition-transform duration-300 ease-apple group-hover:scale-105", action.bg, action.color)}>
                                    {action.icon}
                                </div>
                                <h4 className="text-[14px] font-semibold text-primary-text mb-0.5">{action.label}</h4>
                                <p className="text-[12px] text-secondary-text leading-relaxed">{action.desc}</p>
                                <ArrowUpRight
                                    size={14}
                                    className="absolute top-5 right-5 text-secondary-text/20 group-hover:text-secondary-text/50 transition-all duration-200"
                                />
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* ═══════════════════════════════════════════
                    MAIN CONTENT AREA
                ═══════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ─── Left Column: Active Requests ─── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Section Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-[20px] font-semibold text-primary-text">Your Requests</h2>
                                <p className="text-[13px] text-secondary-text mt-0.5">Track and manage your active help requests</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => fetchDashboardData()}>
                                Refresh
                            </Button>
                        </div>

                        {/* Request Cards */}
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-20 w-full bg-black/[0.03] animate-pulse rounded-2xl" />
                                    ))}
                                </div>
                            ) : myRequests.length > 0 ? (
                                <div className="space-y-3">
                                    {myRequests.map((req, i) => {
                                        const status = getStatusInfo(req.status);
                                        return (
                                            <motion.div
                                                key={req._id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.04, duration: 0.4, ease: appleEase }}
                                            >
                                                <Card className="hover:shadow-soft-md transition-all duration-300 ease-apple group cursor-pointer bg-white">
                                                    <div className="p-5 flex items-center gap-5">
                                                        {/* Type Icon */}
                                                        <div className="w-11 h-11 rounded-xl bg-black/[0.03] flex items-center justify-center shrink-0">
                                                            {req.requestType === 'food' && <Heart size={20} className="text-success" />}
                                                            {req.requestType === 'medicine' && <Activity size={20} className="text-accent" />}
                                                            {req.requestType === 'emergency' && <AlertCircle size={20} className="text-danger" />}
                                                            {!['food', 'medicine', 'emergency'].includes(req.requestType) && <Target size={20} className="text-secondary-text" />}
                                                        </div>

                                                        {/* Details */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2.5 mb-1">
                                                                <h4 className="text-[14px] font-semibold text-primary-text truncate">{req.title}</h4>
                                                                <span className={cn("px-2 py-[2px] rounded-full text-[10px] font-medium flex items-center gap-1 shrink-0", status.color)}>
                                                                    {status.icon}
                                                                    {status.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-[12px] text-secondary-text truncate mb-1.5">{req.description}</p>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[11px] text-secondary-text/60 flex items-center gap-1">
                                                                    <MapPin size={10} /> {req.location?.address?.split(',')[0] || 'No location'}
                                                                </span>
                                                                <span className="text-[11px] text-secondary-text/60 flex items-center gap-1">
                                                                    <Clock size={10} /> {new Date(req.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Amount & Action */}
                                                        <div className="text-right shrink-0">
                                                            <div className="text-[18px] font-bold text-primary-text">₹{req.amount.value}</div>
                                                            <div className="text-[11px] text-secondary-text mt-0.5">Amount</div>
                                                        </div>

                                                        <button
                                                            className="w-9 h-9 rounded-full bg-black/[0.03] flex items-center justify-center shrink-0 hover:bg-accent/10 hover:text-accent transition-all duration-200"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (['proof_submitted', 'completed'].includes(req.status)) {
                                                                    navigate(`/proof/${req._id}`);
                                                                } else {
                                                                    navigate('/live-impact');
                                                                }
                                                            }}
                                                        >
                                                            {['proof_submitted', 'completed'].includes(req.status) ? <Camera size={15} /> : <Eye size={15} />}
                                                        </button>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <Card className="p-10 text-center border-dashed border-2 border-black/[0.06] bg-white/60" hoverEffect={false}>
                                    <div className="max-w-xs mx-auto space-y-4">
                                        <div className="w-12 h-12 rounded-2xl bg-black/[0.03] flex items-center justify-center mx-auto">
                                            <Zap size={22} className="text-secondary-text/40" />
                                        </div>
                                        <div>
                                            <h4 className="text-[16px] font-semibold text-primary-text mb-1">No Active Requests</h4>
                                            <p className="text-[13px] text-secondary-text leading-relaxed">
                                                Create your first request to start making an impact in your community.
                                            </p>
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="md"
                                            leftIcon={<Plus size={16} />}
                                            onClick={() => navigate('/create-request')}
                                            className="mx-auto"
                                        >
                                            Create Request
                                        </Button>
                                    </div>
                                </Card>
                            )}
                        </AnimatePresence>

                        {/* ─── Active Fundraisers ─── */}
                        <div className="pt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-[20px] font-semibold text-primary-text">Active Fundraisers</h2>
                                    <p className="text-[13px] text-secondary-text mt-0.5">Support verified causes in your community</p>
                                </div>
                                {broadcasts.length > 0 && (
                                    <Badge variant="warning" dot>{broadcasts.length} Active</Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {broadcasts.length > 0 ? broadcasts.map((bc, i) => {
                                    const progress = Math.min(100, ((bc.amountRaised || 0) / bc.amount.value) * 100);
                                    return (
                                        <motion.div
                                            key={bc._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.06, duration: 0.4, ease: appleEase }}
                                        >
                                            <Card className="bg-white hover:shadow-soft-md transition-all duration-300 ease-apple">
                                                <div className="p-5 space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-accent/8 flex items-center justify-center text-accent">
                                                                <Sparkles size={14} />
                                                            </div>
                                                            <span className="text-[12px] font-medium text-secondary-text">
                                                                {bc.donorId?.profile?.fullName || 'Organization'}
                                                            </span>
                                                        </div>
                                                        <Badge variant="warning" size="sm">Funding</Badge>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-[14px] font-semibold text-primary-text mb-1 line-clamp-1">{bc.title}</h4>
                                                        <p className="text-[12px] text-secondary-text line-clamp-2 leading-relaxed">{bc.description}</p>
                                                    </div>

                                                    {/* Progress */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-[11px] font-medium">
                                                            <span className="text-secondary-text">₹{(bc.amountRaised || 0).toLocaleString()} raised</span>
                                                            <span className="text-primary-text">₹{bc.amount.value.toLocaleString()} goal</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${progress}%` }}
                                                                transition={{ duration: 1, ease: appleEase, delay: 0.3 }}
                                                                className="h-full bg-accent rounded-full"
                                                            />
                                                        </div>
                                                        <p className="text-[11px] text-secondary-text text-center">{Math.round(progress)}% funded</p>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        className="w-full"
                                                        leftIcon={<Heart size={14} />}
                                                        onClick={() => openDonateModal(bc)}
                                                    >
                                                        Contribute Now
                                                    </Button>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                }) : (
                                    <div className="col-span-2 p-10 text-center bg-black/[0.015] rounded-2xl border border-dashed border-black/[0.06]">
                                        <p className="text-[13px] text-secondary-text">No active fundraisers at the moment</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─── Donation History Section ─── */}
                        <div className="pt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-[20px] font-semibold text-primary-text">Donation History</h2>
                                    <p className="text-[13px] text-secondary-text mt-0.5">All your contributions with downloadable receipts</p>
                                </div>
                                {donationHistory.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Badge variant="success" dot>{donationHistory.length} Donations</Badge>
                                        <Badge variant="sapphire">₹{totalDonated.toLocaleString()}</Badge>
                                    </div>
                                )}
                            </div>

                            {historyLoading ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : donationHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {donationHistory.map((donation, i) => (
                                        <motion.div
                                            key={donation._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04, duration: 0.4, ease: appleEase }}
                                        >
                                            <Card className="bg-white hover:shadow-soft-md transition-all duration-300">
                                                <div className="p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                                                donation.donationType === 'ESCROW'
                                                                    ? "bg-emerald-50 text-emerald-600"
                                                                    : "bg-amber-50 text-amber-600"
                                                            )}>
                                                                {donation.donationType === 'ESCROW' ? <Lock size={18} /> : <ZapIcon size={18} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-[14px] font-semibold text-primary-text">
                                                                    ₹{donation.amount.toLocaleString('en-IN')}
                                                                </p>
                                                                <p className="text-[11px] text-secondary-text">
                                                                    To: {donation.beneficiaryName}
                                                                    {donation.splitMode && <span className="text-purple-600 font-bold ml-1">• Split</span>}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant={donation.status === 'completed' ? 'success' : 'danger'}
                                                                size="sm"
                                                            >
                                                                {donation.status === 'completed' ? 'Completed' : 'Refunded'}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4 text-[11px] text-secondary-text">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={11} />
                                                                {new Date(donation.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </span>
                                                            <span className={cn(
                                                                "flex items-center gap-1 font-medium",
                                                                donation.donationType === 'ESCROW' ? "text-emerald-600" : "text-amber-600"
                                                            )}>
                                                                {donation.donationType === 'ESCROW' ? <Lock size={10} /> : <ZapIcon size={10} />}
                                                                {donation.donationType}
                                                            </span>
                                                            <span className="font-mono text-[10px] text-secondary-text/60">
                                                                {donation.receiptId}
                                                            </span>
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="h-8 px-3 text-[11px]"
                                                            leftIcon={downloadingReceipt === donation._id
                                                                ? <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                                                : <Download size={12} />
                                                            }
                                                            onClick={() => downloadReceipt(donation)}
                                                            disabled={downloadingReceipt === donation._id}
                                                        >
                                                            {downloadingReceipt === donation._id ? 'Generating...' : 'Receipt'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <Card className="bg-white">
                                    <div className="p-10 text-center">
                                        <div className="w-14 h-14 bg-black/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Receipt size={24} className="text-secondary-text/40" />
                                        </div>
                                        <h4 className="text-[16px] font-semibold text-primary-text mb-1">No Donations Yet</h4>
                                        <p className="text-[13px] text-secondary-text">Your donation history will appear here after your first contribution</p>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="mt-4"
                                            leftIcon={<Heart size={14} />}
                                            onClick={() => navigate('/live-impact')}
                                        >
                                            Make Your First Donation
                                        </Button>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* ─── Live Impact Banner ─── */}
                        <div className="pt-4">
                            <div className="relative group rounded-2xl overflow-hidden bg-surface-dark h-[200px] flex items-center px-8 cursor-pointer"
                                onClick={() => navigate('/live-impact')}
                            >
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-30 group-hover:scale-105 transition-transform duration-[2s] ease-apple" />
                                <div className="absolute inset-0 bg-gradient-to-r from-surface-dark via-surface-dark/80 to-transparent" />
                                <div className="relative z-10 max-w-sm space-y-3">
                                    <h2 className="text-[24px] font-bold text-white tracking-tight leading-tight">
                                        See Your<br />Impact Live
                                    </h2>
                                    <p className="text-[13px] text-white/50 leading-relaxed">
                                        View real-time verified proof of every donation making a difference.
                                    </p>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="bg-white/10 border-white/10 text-white hover:bg-white/20"
                                        rightIcon={<ArrowRight size={14} />}
                                    >
                                        Explore
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Right Column: Leaderboard & Progress ─── */}
                    <div className="space-y-6">

                        {/* Top Contributors */}
                        <Card className="overflow-hidden border-none bg-surface-dark text-white" hoverEffect={false}>
                            <div className="p-6 relative">
                                <div className="absolute top-4 right-4 opacity-[0.06]">
                                    <Star size={60} strokeWidth={1} />
                                </div>
                                <h3 className="text-[18px] font-semibold tracking-tight mb-1">Top Contributors</h3>
                                <p className="text-[12px] text-white/40 mb-6">This week's most active members</p>

                                <div className="space-y-4">
                                    {leaderboard.dailyDonors.slice(0, 5).map((node: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center text-[12px] font-semibold text-white/60">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-medium text-white/90 truncate max-w-[140px]">
                                                        {node.fullName || 'Anonymous'}
                                                    </p>
                                                    <p className="text-[10px] text-white/30">
                                                        Level {Math.floor(node.totalDonation / 1000) + 1}
                                                    </p>
                                                </div>
                                            </div>
                                            <Sparkles size={12} className="text-amber-400/40 group-hover:text-amber-400 transition-colors duration-200" />
                                        </div>
                                    ))}
                                    {leaderboard.dailyDonors.length === 0 && (
                                        <p className="text-[12px] text-white/30 text-center py-4">No contributors yet this week</p>
                                    )}
                                </div>

                                <button
                                    onClick={() => navigate('/certificates')}
                                    className="w-full mt-6 h-9 rounded-xl bg-white/8 border border-white/8 text-[13px] font-medium text-white/70 hover:bg-white/12 hover:text-white transition-all duration-200 ease-apple"
                                >
                                    View All Contributors
                                </button>
                            </div>
                        </Card>

                        {/* Next Milestone */}
                        <Card className="bg-white" hoverEffect={false}>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="w-10 h-10 bg-amber-500/8 rounded-xl flex items-center justify-center text-amber-500">
                                        <Award size={20} />
                                    </div>
                                    <Badge variant="warning" size="sm">Next Milestone</Badge>
                                </div>
                                <h3 className="text-[17px] font-semibold text-primary-text mb-1">Legacy Contributor</h3>
                                <p className="text-[13px] text-secondary-text leading-relaxed mb-5">
                                    Complete 10 verified donations to earn the Legacy Contributor badge.
                                </p>
                                <div className="space-y-2">
                                    <div className="w-full h-2 bg-black/[0.04] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (user?.statistics?.totalHelps || 0) * 10)}%` }}
                                            transition={{ duration: 1.2, ease: appleEase }}
                                            className="h-full bg-accent rounded-full"
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-secondary-text">
                                        <span>{user?.statistics?.totalHelps || 0} of 10 completed</span>
                                        <span>{Math.min(100, (user?.statistics?.totalHelps || 0) * 10)}%</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════
                DONATION MODAL
            ═══════════════════════════════════════════ */}
            <AnimatePresence>
                {showDonateModal && selectedBroadcast && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowDonateModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={appleSpring}
                            className="w-[440px] max-w-full bg-white rounded-2xl shadow-soft-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-accent to-blue-500 p-5 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                <button
                                    onClick={() => setShowDonateModal(false)}
                                    className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                                <div className="relative z-10">
                                    <Heart size={18} className="mb-2 text-white/80" />
                                    <h3 className="text-[17px] font-semibold mb-0.5">Contribute to this cause</h3>
                                    <p className="text-white/60 text-[13px]">{selectedBroadcast.donorId?.profile?.fullName || 'Organization'}</p>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 space-y-5">
                                <div>
                                    <h4 className="text-[15px] font-semibold text-primary-text mb-1">{selectedBroadcast.title}</h4>
                                    <p className="text-[13px] text-secondary-text line-clamp-2 leading-relaxed">{selectedBroadcast.description}</p>
                                </div>

                                {/* Progress */}
                                <div className="bg-black/[0.02] rounded-xl p-3.5 space-y-2">
                                    <div className="flex justify-between text-[12px] font-medium">
                                        <span className="text-secondary-text">Raised: <span className="text-accent">₹{(selectedBroadcast.amountRaised || 0).toLocaleString()}</span></span>
                                        <span className="text-secondary-text">Goal: <span className="text-primary-text">₹{selectedBroadcast.amount?.value?.toLocaleString()}</span></span>
                                    </div>
                                    <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                                        <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((selectedBroadcast.amountRaised || 0) / (selectedBroadcast.amount?.value || 1)) * 100)}%` }} />
                                    </div>
                                    <p className="text-[11px] text-secondary-text text-center">
                                        {Math.round(((selectedBroadcast.amountRaised || 0) / (selectedBroadcast.amount?.value || 1)) * 100)}% funded
                                    </p>
                                </div>

                                {/* Quick Amount */}
                                <div>
                                    <label className="text-[12px] font-medium text-secondary-text mb-2 block">Quick select</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {quickAmounts.map(amt => (
                                            <button
                                                key={amt}
                                                onClick={() => setDonationAmount(String(amt))}
                                                className={cn(
                                                    "h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-200 ease-apple border",
                                                    donationAmount === String(amt)
                                                        ? "bg-accent text-white border-accent shadow-sm"
                                                        : "bg-white text-primary-text border-black/[0.08] hover:border-accent/30"
                                                )}
                                            >
                                                ₹{amt.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Amount */}
                                <div>
                                    <label className="text-[12px] font-medium text-secondary-text mb-2 block">Custom amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-medium text-secondary-text/50">₹</span>
                                        <input
                                            type="number"
                                            value={donationAmount}
                                            onChange={(e) => setDonationAmount(e.target.value)}
                                            placeholder="Enter amount"
                                            className="input-field pl-8 text-[15px] font-medium"
                                        />
                                    </div>
                                </div>

                                {/* CTA */}
                                <button
                                    onClick={handleDonate}
                                    disabled={isDonating || !donationAmount || Number(donationAmount) <= 0}
                                    className={cn(
                                        "w-full h-11 rounded-xl font-medium text-[14px] transition-all duration-300 ease-apple flex items-center justify-center gap-2",
                                        isDonating || !donationAmount || Number(donationAmount) <= 0
                                            ? "bg-black/[0.06] text-secondary-text cursor-not-allowed"
                                            : "bg-accent text-white shadow-sm hover:shadow-md hover:bg-accent-hover active:scale-[0.98]"
                                    )}
                                >
                                    {isDonating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <IndianRupee size={16} />
                                            {donationAmount ? `Donate ₹${Number(donationAmount).toLocaleString()}` : 'Enter an amount to donate'}
                                        </>
                                    )}
                                </button>

                                <p className="text-[11px] text-center text-secondary-text">
                                    Secured by Social Kind Trust Protocol • Verified Organization
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardPage;
