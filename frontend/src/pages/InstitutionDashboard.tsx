import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, FileText, PlusCircle, Wallet, MessageSquare,
    Users, BarChart3, User, Settings, HelpCircle, Bell, Search,
    ChevronRight, Eye, Share2, Pencil, Clock, TrendingUp, PieChart,
    Star, ArrowUpRight, Building2, LogOut, X, Check,
    Filter, Heart, IndianRupee, Shield, Zap, MessageCircle, MapPin
} from 'lucide-react';
import { cn } from '../utils/cn';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import LocationPicker from '../components/LocationPicker';
import { Camera, Trash2, UserPlus } from 'lucide-react';

// Helper to format time ago
const timeAgo = (date: any) => {
    if (!date) return 'just now';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
};

const EmptyState = ({ navigate }: { navigate: any }) => (
    <div className="p-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-6">
            <PlusCircle size={48} />
        </div>
        <h3 className="text-2xl font-black text-primary-text mb-2">Deploy Your First Signal</h3>
        <p className="text-secondary-text/60 text-sm max-w-sm mx-auto mb-8">
            You haven't broadcasted any needs yet. Our donor network is waiting to support your initiatives.
        </p>
        <button
            onClick={() => navigate('/create-request')}
            className="px-8 h-14 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black rounded-2xl shadow-xl shadow-amber-500/20 hover:-translate-y-1 transition-all uppercase tracking-widest text-xs"
        >
            Broadcast New Need
        </button>
    </div>
);

const InstitutionDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useNotifications();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [requestFilter, setRequestFilter] = useState('all');
    const [messageFilter, setMessageFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [stats, setStats] = useState<any>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [donors, setDonors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Member management state
    const [members, setMembers] = useState<any[]>([]);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberAge, setNewMemberAge] = useState('');
    const [newMemberPhotoFile, setNewMemberPhotoFile] = useState<File | null>(null);
    const [newMemberPhotoPreview, setNewMemberPhotoPreview] = useState('');
    const [addingMember, setAddingMember] = useState(false);
    const memberPhotoRef = React.useRef<HTMLInputElement>(null);

    const institutionName = user?.profile?.fullName || 'Ananda Ashramam';

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, reqsRes, msgsRes, donorsRes] = await Promise.all([
                api.get('/institution/stats'),
                api.get('/institution/my-requests'),
                api.get('/institution/messages').catch(() => ({ data: { status: 'success', data: { messages: [] } } })),
                api.get('/institution/donors').catch(() => ({ data: { status: 'success', data: { donors: [] } } }))
            ]);

            if (statsRes.data.status === 'success') {
                setStats(statsRes.data.data);
            }

            if (reqsRes.data.status === 'success') {
                const fetchedRequests = Array.isArray(reqsRes.data.data.requests)
                    ? reqsRes.data.data.requests
                    : [];
                setRequests(fetchedRequests);
            }

            if (msgsRes.data.status === 'success') {
                setMessages(Array.isArray(msgsRes.data.data.messages) ? msgsRes.data.data.messages : []);
            }

            if (donorsRes.data.status === 'success') {
                setDonors(Array.isArray(donorsRes.data.data.donors) ? donorsRes.data.data.donors : []);
            }
        } catch (err) {
            console.error('Failed to load institution intelligence', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch members
    useEffect(() => {
        if (user) {
            setMembers((user as any).institutionMembers || []);
        }
    }, [user]);

    const handleMemberPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setNewMemberPhotoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setNewMemberPhotoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleAddMember = async () => {
        if (!newMemberName.trim()) { showToast('Name is required', 'warning'); return; }
        setAddingMember(true);
        try {
            let photoUrl = '';
            // Upload photo if selected
            if (newMemberPhotoFile) {
                const formData = new FormData();
                formData.append('image', newMemberPhotoFile);
                const uploadRes = await api.post('/upload/image', formData);
                photoUrl = uploadRes.data?.data?.url || '';
            }

            const res = await api.post('/auth/institution/members', {
                name: newMemberName,
                age: newMemberAge ? Number(newMemberAge) : undefined,
                photo: photoUrl || undefined,
            });
            if (res.data?.data?.members) {
                setMembers(res.data.data.members);
            }
            setNewMemberName('');
            setNewMemberAge('');
            setNewMemberPhotoFile(null);
            setNewMemberPhotoPreview('');
            if (memberPhotoRef.current) memberPhotoRef.current.value = '';
            showToast('Member added successfully!', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to add member', 'error');
        } finally {
            setAddingMember(false);
        }
    };

    const handleDeleteMember = async (memberId: string) => {
        try {
            const res = await api.delete(`/auth/institution/members/${memberId}`);
            if (res.data?.data?.members) {
                setMembers(res.data.data.members);
            }
            showToast('Member removed', 'success');
        } catch (err: any) {
            showToast('Failed to remove member', 'error');
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'funding': return { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400', label: 'FUNDING' };
            case 'funded': return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400', label: 'FUNDED' };
            case 'urgent': return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400', label: 'URGENT' };
            case 'open': return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400', label: 'OPEN' };
            case 'completed': return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400', label: 'COMPLETED' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: status.toUpperCase() };
        }
    };

    const filteredRequests = requests.filter(r => {
        const matchesFilter = requestFilter === 'all' || r.status === requestFilter;
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || 
            (r.title?.toLowerCase().includes(query) ||
             r.requestType?.toLowerCase().includes(query) ||
             r.description?.toLowerCase().includes(query) ||
             r.status?.toLowerCase().includes(query) ||
             r.location?.address?.toLowerCase().includes(query) ||
             r._id?.toLowerCase().includes(query));
        return matchesFilter && matchesSearch;
    });

    const filteredDonors = donors.filter(d => {
        const query = searchQuery.toLowerCase();
        return !searchQuery || 
            (d.name?.toLowerCase().includes(query) || 
             d.email?.toLowerCase().includes(query) ||
             d.id?.toLowerCase().includes(query) ||
             d.rank?.toLowerCase().includes(query));
    });

    const filteredMessages = messages.filter(m => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || 
            (m.senderName?.toLowerCase().includes(query) ||
             m.message?.toLowerCase().includes(query) ||
             m.request?.toLowerCase().includes(query) ||
             m.badge?.toLowerCase().includes(query));
        const matchesFilter = messageFilter === 'unread' ? m.unread : true;
        return matchesSearch && matchesFilter;
    });

    const sidebarItems = [
        {
            section: 'MAIN',
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
                { icon: FileText, label: 'My Requests', key: 'requests' },
                { icon: PlusCircle, label: 'New Signal', key: 'create' },
            ]
        },
        {
            section: 'FINANCIAL',
            items: [
                { icon: Shield, label: 'Funds & Escrow', key: 'escrow' },
            ]
        },
        {
            section: 'ENGAGEMENT',
            items: [
                { icon: MessageSquare, label: 'Conversations', key: 'messages', count: messages.filter(m => m.unread).length },
                { icon: Users, label: 'Members', key: 'members' },
                { icon: Users, label: 'Donor Network', key: 'donors' },
                { icon: MapPin, label: 'Live Map', key: 'map' },
                { icon: TrendingUp, label: 'Analytics', key: 'analytics' },
            ]
        },
        {
            section: 'ACCOUNT',
            items: [
                { icon: Building2, label: 'Profile', key: 'profile' },
                { icon: Settings, label: 'Settings', key: 'settings' },
                { icon: HelpCircle, label: 'Support', key: 'help' },
            ]
        }
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-amber-700 uppercase tracking-widest animate-pulse">Syncing Intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAF9] flex">
            {/* SIDEBAR */}
            <aside className="w-[260px] bg-white border-r border-gray-100 fixed top-0 left-0 bottom-0 z-40 flex flex-col">
                {/* Logo */}
                <div className="h-[72px] flex items-center gap-3 px-6 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center p-0.5">
                        <img src="/src/assets/logo_splash.png" alt="Logo" className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div>
                        <span className="font-serif text-base font-black text-primary-text block leading-tight">Humanexa</span>
                        <span className="text-[8px] font-bold text-amber-600 uppercase tracking-[0.15em]">Institution Portal</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-6">
                    {sidebarItems.map((group) => (
                        <div key={group.section} className="mb-6">
                            <p className="text-[9px] font-black text-secondary-text/30 uppercase tracking-[0.25em] px-3 mb-3">{group.section}</p>
                            <ul className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.key;
                                    return (
                                        <li key={item.key}>
                                            <button
                                                onClick={() => {
                                                    if (item.key === 'create') navigate('/create-request');
                                                    else if (item.key === 'profile') navigate('/profile');
                                                    else if (item.key === 'messages') navigate('/live-impact');
                                                    else if (item.key === 'settings') showToast('Settings page coming soon', 'info');
                                                    else if (item.key === 'help') showToast('Contact support: support@humanexa.org', 'info');
                                                    else setActiveTab(item.key);
                                                }}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                                                    isActive
                                                        ? "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 shadow-sm border border-amber-100"
                                                        : "text-secondary-text hover:bg-gray-50 hover:text-primary-text"
                                                )}
                                            >
                                                <Icon size={18} className={isActive ? "text-amber-600" : ""} />
                                                <span className="flex-1 text-left">{item.label}</span>
                                                {item.count !== undefined && item.count > 0 && (
                                                    <span className="min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                                        {item.count}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Sidebar footer */}
                <div className="p-4 border-t border-gray-50">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Star size={14} className="text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Trust Score</span>
                        </div>
                        <p className="text-2xl font-black text-amber-700">4.9<span className="text-sm font-bold text-amber-500">/5.0</span></p>
                        <p className="text-[10px] text-amber-600/70 font-bold mt-1">Top 5% of institutions</p>
                    </div>
                </div>
            </aside>

            {/* MAIN AREA */}
            <div className="flex-1 ml-[260px]">
                {/* HEADER */}
                <header className="h-[72px] bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30 flex items-center justify-between px-8">
                    <div className="flex items-center gap-4 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text/30" />
                            <input
                                type="text"
                                placeholder="Search requests, donors, messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <button
                            onClick={() => navigate('/live-impact')}
                            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-secondary-text/40 hover:text-amber-600 hover:bg-amber-50 transition-all"
                        >
                            <Bell size={20} />
                            {messages.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                                    {messages.length}
                                </span>
                            )}
                        </button>

                        <div className="h-8 w-px bg-gray-100" />

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center gap-3 group"
                            >
                                <div className="text-right">
                                    <p className="text-xs font-black text-primary-text uppercase tracking-wide">{institutionName}</p>
                                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">⭐ Trust: 4.9</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-amber-200 shadow-sm group-hover:scale-110 transition-transform bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                                    <Building2 size={20} className="text-amber-600" />
                                </div>
                            </button>

                            <AnimatePresence>
                                {showProfileDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50"
                                        >
                                            <div className="p-4 border-b border-gray-50 bg-gradient-to-r from-amber-50 to-yellow-50">
                                                <p className="font-bold text-primary-text text-sm">{institutionName}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Star size={12} className="text-amber-500 fill-amber-500" />
                                                    <span className="text-xs text-amber-600 font-bold">Trust Score: 4.9</span>
                                                </div>
                                            </div>
                                            <div className="py-2">
                                                {[
                                                    { icon: Building2, label: 'My Profile', emoji: '🏛️', action: () => navigate('/profile') },
                                                    { icon: FileText, label: 'My Requests', emoji: '📊', action: () => setActiveTab('requests') },
                                                    { icon: MessageSquare, label: 'My Chats', emoji: '💬', action: () => navigate('/live-impact') },
                                                    { icon: Settings, label: 'Settings', emoji: '⚙️', action: () => showToast('Settings page coming soon', 'info') },
                                                    { icon: BarChart3, label: 'Analytics', emoji: '📈', action: () => setActiveTab('analytics') },
                                                    { icon: HelpCircle, label: 'Support', emoji: '📞', action: () => showToast('Contact support: support@humanexa.org', 'info') },
                                                ].map((item) => (
                                                    <button
                                                        key={item.label}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-text hover:bg-gray-50 hover:text-primary-text transition-colors"
                                                        onClick={() => { setShowProfileDropdown(false); item.action(); }}
                                                    >
                                                        <span>{item.emoji}</span>
                                                        <span className="font-medium">{item.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="border-t border-gray-100 py-2">
                                                <button
                                                    onClick={() => {
                                                        setShowProfileDropdown(false);
                                                        setShowLogoutModal(true);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <span>🚪</span>
                                                    <span className="font-bold">Logout</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* MAIN CONTENT */}
                <main className="max-w-[1200px] mx-auto p-8 space-y-8">
                    {activeTab === 'dashboard' && (
                        <>
                            {/* WELCOME HERO */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 rounded-3xl p-8 text-white relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
                                <div className="relative z-10">
                                    <h1 className="text-3xl font-serif font-black mb-2">
                                        {getGreeting()}, {institutionName}! 🏛️
                                    </h1>
                                    <p className="text-white/70 text-base mb-6">Here's your fundraising overview</p>
                                    <div className="flex gap-3 flex-wrap">
                                        <button
                                            onClick={() => navigate('/create-request')}
                                            className="h-11 px-6 bg-white text-amber-700 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2"
                                        >
                                            <PlusCircle size={16} />
                                            Create New Request
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveTab('requests');
                                                showToast('Select a request to upload proof of impact.', 'info');
                                            }}
                                            className="h-11 px-6 bg-white/20 backdrop-blur text-white font-bold rounded-xl hover:bg-white/30 transition-all text-sm flex items-center gap-2 border border-white/20"
                                        >
                                            <Eye size={16} />
                                            Upload Proof
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('messages')}
                                            className="h-11 px-6 bg-white/20 backdrop-blur text-white font-bold rounded-xl hover:bg-white/30 transition-all text-sm flex items-center gap-2 border border-white/20"
                                        >
                                            <MessageSquare size={16} />
                                            Messages
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* KEY METRICS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                {[
                                    {
                                        label: 'TOTAL RAISED',
                                        value: stats ? `₹${stats.totalRaised.toLocaleString()}` : '₹0',
                                        detail: `Goal: ₹${(stats?.totalRaised * 1.2 || 100000).toLocaleString()}`,
                                        sub: '↑ +0%',
                                        progress: stats ? Math.min(100, (stats.totalRaised / (stats.totalRaised * 1.2 || 100000)) * 100) : 0,
                                        action: 'Breakdown',
                                        color: 'amber',
                                        icon: <IndianRupee size={20} />,
                                    },
                                    {
                                        label: 'ACTIVE REQUESTS',
                                        value: stats ? `${stats.activeRequests} campaigns` : '0 campaigns',
                                        detail: null,
                                        sub: null,
                                        progress: null,
                                        action: 'Manage',
                                        color: 'emerald',
                                        icon: <FileText size={20} />,
                                        dots: [
                                            { color: 'bg-emerald-400', label: stats ? `${requests.filter(r => r.status === 'funded').length} Funded` : '0 Funded' },
                                            { color: 'bg-amber-400', label: stats ? `${requests.filter(r => r.status === 'funding').length} Funding` : '0 Funding' },
                                            { color: 'bg-red-400', label: stats ? `${requests.filter(r => r.status === 'urgent').length} Urgent` : '0 Urgent' },
                                        ]
                                    },
                                    {
                                        label: 'IN ESCROW',
                                        value: stats ? `₹${stats.inEscrow.toLocaleString()}` : '₹0',
                                        detail: stats ? `${requests.filter(r => r.escrow?.status === 'held').length} held` : '0 held',
                                        sub: null,
                                        progress: null,
                                        action: 'Track',
                                        color: 'blue',
                                        icon: <Shield size={20} />,
                                    },
                                    {
                                        label: 'TRUST SCORE',
                                        value: stats ? `${stats.trustScore}/5.0` : '4.9/5.0',
                                        detail: 'Top 5%',
                                        sub: null,
                                        progress: null,
                                        action: 'Details',
                                        color: 'purple',
                                        icon: <Star size={20} />,
                                        stars: true,
                                    },
                                ].map((metric, i) => (
                                    <motion.div
                                        key={metric.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        onClick={() => {
                                            if (metric.label === 'TOTAL RAISED') setActiveTab('analytics');
                                            if (metric.label === 'ACTIVE REQUESTS') { setRequestFilter('all'); document.getElementById('requests-section')?.scrollIntoView({ behavior: 'smooth' }); }
                                            if (metric.label === 'IN ESCROW') setActiveTab('escrow');
                                            if (metric.label === 'TRUST SCORE') navigate('/profile');
                                        }}
                                        className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-amber-50/50 transition-colors" />
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[9px] font-black text-secondary-text/40 uppercase tracking-[0.2em]">{metric.label}</span>
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                                    metric.color === 'amber' ? 'bg-amber-50 text-amber-500' :
                                                        metric.color === 'emerald' ? 'bg-emerald-50 text-emerald-500' :
                                                            metric.color === 'blue' ? 'bg-blue-50 text-blue-500' :
                                                                'bg-purple-50 text-purple-500'
                                                )}>
                                                    {metric.icon}
                                                </div>
                                            </div>
                                            <p className="text-2xl font-black text-primary-text mb-1">
                                                {metric.stars && <span className="text-amber-500">⭐ </span>}
                                                {metric.value}
                                            </p>
                                            {metric.progress !== null && (
                                                <div className="w-full h-2 bg-gray-100 rounded-full mt-2 mb-1 overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-1000"
                                                        style={{ width: `${metric.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                            {metric.detail && <p className="text-xs text-secondary-text/60 font-medium">{metric.detail}</p>}
                                            {metric.sub && <p className="text-xs font-bold text-emerald-500 mt-1">{metric.sub}</p>}
                                            {(metric as any).dots && (
                                                <div className="space-y-1 mt-2">
                                                    {(metric as any).dots.map((dot: any) => (
                                                        <div key={dot.label} className="flex items-center gap-2">
                                                            <div className={cn("w-2 h-2 rounded-full", dot.color)} />
                                                            <span className="text-xs text-secondary-text/60">{dot.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <button
                                                className="mt-3 text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group-hover:gap-2 transition-all"
                                            >
                                                {metric.action} <ChevronRight size={12} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* ACTIVE REQUESTS */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                                id="requests-section"
                            >
                                <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h2 className="text-lg font-black text-primary-text flex items-center gap-2">
                                            📋 MY ACTIVE REQUESTS ({filteredRequests.length})
                                        </h2>
                                        <p className="text-sm text-secondary-text/60 mt-1">Manage your ongoing fundraising campaigns</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex bg-gray-50 rounded-xl p-1 gap-1">
                                            {['all', 'funding', 'funded', 'urgent'].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => setRequestFilter(f)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                                                        requestFilter === f
                                                            ? "bg-white shadow-sm text-amber-700"
                                                            : "text-secondary-text/40 hover:text-secondary-text"
                                                    )}
                                                >
                                                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => navigate('/create-request')}
                                            className="h-9 px-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-bold rounded-lg text-xs shadow hover:shadow-md transition-all flex items-center gap-1.5"
                                        >
                                            <PlusCircle size={14} />
                                            New Request
                                        </button>
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-50">
                                    {(activeTab === 'dashboard' ? filteredRequests.slice(0, 3) : filteredRequests).length > 0 ? (activeTab === 'dashboard' ? filteredRequests.slice(0, 3) : filteredRequests).map((req: any, idx: number) => {
                                        const status = getStatusBadge(req.status);
                                        const goal = req.amount?.value || 10000;
                                        const raised = req.amountRaised || 0;
                                        const progress = Math.min(100, Math.round((raised / goal) * 100));
                                        return (
                                            <motion.div
                                                key={req._id || idx}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="p-6 flex gap-5 hover:bg-amber-50/20 transition-colors group"
                                            >
                                                {/* Image */}
                                                <div className="w-[120px] h-[120px] rounded-xl overflow-hidden flex-shrink-0 relative">
                                                    <img src={req.image || "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&h=300&fit=crop"} alt={req.title} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => navigate('/create-request')}
                                                        className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-lg text-secondary-text hover:text-amber-600 transition-colors shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider", status.bg, status.text)}>
                                                                    {status.label}
                                                                </span>
                                                                <span className="text-[10px] text-secondary-text/30 font-bold">• {req.requestType?.toUpperCase() || 'GENERAL'}</span>
                                                            </div>
                                                            <h3 className="font-bold text-primary-text mb-1 truncate group-hover:text-amber-700 transition-colors">{req.title}</h3>
                                                            <p className="text-xs text-secondary-text/60 line-clamp-1 mb-1">
                                                                #{req._id?.substring(0, 8) || 'N/A'} • Created: {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Today'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Progress */}
                                                    <div className="mt-3">
                                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full transition-all duration-1000",
                                                                    req.status === 'funded' ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                                                                        req.status === 'urgent' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                                                                            'bg-gradient-to-r from-amber-400 to-yellow-500'
                                                                )}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between mt-1.5">
                                                            <span className="text-xs font-bold text-primary-text">
                                                                ₹{raised.toLocaleString()} <span className="text-secondary-text/40 font-medium">/ ₹{goal.toLocaleString()}</span>
                                                            </span>
                                                            <span className="text-xs font-bold text-primary-text">{progress}%</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-2 text-xs text-secondary-text/60">
                                                            <span className="flex items-center gap-1"><Heart size={12} /> {req.donors || 0} donors</span>
                                                            {(req.daysLeft || 0) > 0 && (
                                                                <span className="flex items-center gap-1"><Clock size={12} /> {req.daysLeft} days left</span>
                                                            )}
                                                            <span className="flex items-center gap-1"><Eye size={12} /> {(req.views || 0).toLocaleString()} views</span>
                                                            <span className="flex items-center gap-1"><Share2 size={12} /> {req.shares || 0} shares</span>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => { showToast(`Viewing analytics for ${req.title}`, 'info'); }}
                                                            className="h-8 px-3 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <BarChart3 size={12} /> Analytics
                                                        </button>
                                                        <button
                                                            onClick={() => navigate('/create-request')}
                                                            className="h-8 px-3 text-xs font-bold text-secondary-text bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <Pencil size={12} /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const shareUrl = `${window.location.origin}/dashboard?donate=${req._id}`;
                                                                navigator.clipboard.writeText(shareUrl);
                                                                showToast('Share link copied to clipboard! 🔗', 'success');
                                                            }}
                                                            className="h-8 px-3 text-xs font-bold text-secondary-text bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <Share2 size={12} /> Share
                                                        </button>
                                                        <button
                                                            onClick={() => navigate('/live-impact')}
                                                            className="h-8 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <MessageCircle size={12} /> Message Donors
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    }) : (
                                        <EmptyState navigate={navigate} />
                                    )}
                                    {activeTab === 'dashboard' && filteredRequests.length > 3 && (
                                        <div className="p-4 bg-gray-50/30 text-center border-t border-gray-50">
                                            <button
                                                onClick={() => setActiveTab('requests')}
                                                className="text-xs font-bold text-amber-600 hover:text-amber-700 uppercase tracking-widest flex items-center gap-1 mx-auto"
                                            >
                                                View All Requests ({filteredRequests.length}) <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* RECENT MESSAGES */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                            >
                                <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h2 className="text-lg font-black text-primary-text flex items-center gap-2">
                                            💬 RECENT MESSAGES {messages.length > 0 && <span className="text-sm font-bold text-amber-500">({messages.length})</span>}
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex bg-gray-50 rounded-xl p-1 gap-1">
                                            {['all', 'unread'].map((f: string) => (
                                                <button
                                                    key={f}
                                                    onClick={() => setMessageFilter(f)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                                                        messageFilter === f
                                                            ? "bg-white shadow-sm text-amber-700"
                                                            : "text-secondary-text/40 hover:text-secondary-text"
                                                    )}
                                                >
                                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => navigate('/live-impact')}
                                            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                                        >
                                            View All <ArrowUpRight size={12} />
                                        </button>
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-50">
                                    {filteredMessages.length > 0 ? filteredMessages.map((msg: any, idx: number) => (
                                        <motion.div
                                            key={msg.id || idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + idx * 0.1 }}
                                            className={cn(
                                                "p-5 flex gap-4 cursor-pointer hover:bg-amber-50/30 transition-colors",
                                                msg.unread ? "bg-amber-50/20" : ""
                                            )}
                                            onClick={() => navigate(`/live-impact?chatId=${msg.chatId}`)}
                                        >
                                            <img src={msg.senderAvatar} alt={msg.senderName} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-primary-text">{msg.senderName}</span>
                                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{msg.badge}</span>
                                                        {msg.donation !== 'N/A' && <span className="text-[10px] text-secondary-text/40">• {msg.donation}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-secondary-text/30 font-medium">{timeAgo(msg.time)}</span>
                                                        {msg.unread && (
                                                            <span className="w-2 h-2 bg-amber-500 rounded-full" />
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-secondary-text/40 font-medium mb-1">Request: {msg.request}</p>
                                                <p className="text-sm text-secondary-text line-clamp-2">{msg.message}</p>
                                                <div className="flex items-center gap-2 mt-3">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/live-impact?chatId=${msg.chatId}`); }}
                                                        className="h-7 px-3 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <div className="p-12 text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <MessageSquare size={28} className="text-gray-300" />
                                            </div>
                                            <p className="text-sm font-bold text-secondary-text/40">No messages yet</p>
                                            <p className="text-xs text-secondary-text/30 mt-1">Messages from donors will appear here</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}

                    {activeTab === 'requests' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-primary-text tracking-tight uppercase">📋 MY SIGNAL HISTORY ({requests.length})</h2>
                                <button
                                    onClick={() => navigate('/create-request')}
                                    className="px-6 h-12 bg-amber-500 text-white font-black rounded-xl shadow-lg shadow-amber-500/20 hover:-translate-y-1 transition-all uppercase tracking-widest text-[10px]"
                                >
                                    Deploy New Signal
                                </button>
                            </div>
                            
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4 bg-gray-50/30">
                                    <div className="flex bg-gray-50 rounded-xl p-1 gap-1">
                                        {['all', 'funding', 'funded', 'urgent'].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setRequestFilter(f)}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all",
                                                    requestFilter === f
                                                        ? "bg-white shadow-sm text-amber-700 border border-amber-100"
                                                        : "text-secondary-text/40 hover:text-secondary-text"
                                                )}
                                            >
                                                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="text-[10px] font-bold text-secondary-text/30 uppercase tracking-[0.2em]">Showing {filteredRequests.length} Signals</div>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {filteredRequests.length > 0 ? filteredRequests.map((req: any, idx: number) => {
                                        const status = getStatusBadge(req.status);
                                        const goal = req.amount?.value || 10000;
                                        const raised = req.amountRaised || 0;
                                        const progress = Math.min(100, Math.round((raised / goal) * 100));
                                        return (
                                            <motion.div
                                                key={req._id || idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-6 flex gap-6 hover:bg-gray-50 transition-colors group"
                                            >
                                                <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 relative">
                                                    <img src={req.image || "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&h=200&fit=crop"} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="font-bold text-primary-text text-lg mb-1">{req.title}</h3>
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn("px-2 py-0.5 rounded-[4px] text-[8px] font-black tracking-[0.15em] uppercase", status.bg, status.text)}>{status.label}</span>
                                                                <span className="text-[10px] font-bold text-secondary-text/30 uppercase tracking-widest">• {req.requestType}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-black text-primary-text">₹{raised.toLocaleString()}</p>
                                                            <p className="text-[10px] font-bold text-secondary-text/30 uppercase tracking-widest">Goal: ₹{goal.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                                                        <div 
                                                            className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                                                            style={{ width: `${progress}%` }} 
                                                        />
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-xs text-secondary-text/60 line-clamp-1 flex-1 mr-8">{req.description}</p>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => navigate('/live-impact')} className="h-8 px-4 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-secondary-text hover:bg-amber-50 hover:border-amber-200 transition-all">Analytics</button>
                                                            <button onClick={() => navigate('/create-request')} className="h-8 px-4 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">View</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    }) : (
                                        <div className="p-20 text-center bg-gray-50">
                                            <p className="text-secondary-text/40 font-bold uppercase tracking-widest text-xs">No signals found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'donors' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-primary-text">🤝 DONOR NETWORK</h2>
                                <button
                                    onClick={() => setActiveTab('dashboard')}
                                    className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                                >
                                    <ChevronRight size={16} className="rotate-180" /> Back to Dashboard
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredDonors.map((donor, idx) => (
                                    <motion.div
                                        key={donor.id || idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <img
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${donor.name}`}
                                                className="w-12 h-12 rounded-xl bg-amber-50"
                                                alt=""
                                            />
                                            <div>
                                                <h3 className="font-bold text-primary-text">{donor.name}</h3>
                                                <p className="text-xs text-secondary-text/60">{donor.rank}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50 mb-4">
                                            <div>
                                                <p className="text-[10px] text-secondary-text/40 font-black uppercase tracking-wider">Contributions</p>
                                                <p className="text-sm font-bold text-primary-text">{donor.contributedRequests} Requests</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-secondary-text/40 font-black uppercase tracking-wider">Total Helps</p>
                                                <p className="text-sm font-bold text-primary-text">{donor.totalHelps}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => navigate('/live-impact')}
                                            className="w-full h-10 bg-gray-50 text-secondary-text font-bold text-xs rounded-xl hover:bg-amber-50 hover:text-amber-700 transition-all border border-transparent hover:border-amber-100"
                                        >
                                            Message Donor
                                        </button>
                                    </motion.div>
                                ))}
                                {donors.length === 0 && (
                                    <div className="col-span-full p-20 text-center bg-gray-50 rounded-3xl">
                                        <p className="text-secondary-text/40 font-bold">No donors found in your network yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'escrow' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-primary-text">🛡️ FUNDS & ESCROW WALLET</h2>
                                <button
                                    onClick={() => setActiveTab('dashboard')}
                                    className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                                >
                                    <ChevronRight size={16} className="rotate-180" /> Back to Dashboard
                                </button>
                            </div>
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />
                                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-secondary-text/40 uppercase tracking-[0.2em] mb-2">Current Escrow Balance</p>
                                        <h3 className="text-4xl font-black text-emerald-600 mb-2">₹{stats?.inEscrow?.toLocaleString() || 0}</h3>
                                        <p className="text-sm text-secondary-text/60">Funds held securely for in-progress operations</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button className="h-12 px-8 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/20 transition-all">Withdrawal Setup</button>
                                        <button className="h-12 px-8 bg-gray-50 text-secondary-text font-bold rounded-2xl hover:bg-gray-100 transition-all">Transaction History</button>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-50">
                                    <h3 className="font-bold text-primary-text">Escrow Transactions</h3>
                                </div>
                                <div className="p-32 text-center">
                                    <p className="text-secondary-text/40 font-bold uppercase tracking-widest text-xs">No active escrow holds</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'map' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-primary-text">🗺️ LIVE IMPACT MAP</h2>
                                <button
                                    onClick={() => setActiveTab('dashboard')}
                                    className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                                >
                                    <ChevronRight size={16} className="rotate-180" /> Back to Dashboard
                                </button>
                            </div>
                            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm h-[600px] overflow-hidden">
                                <LocationPicker 
                                    onLocationSelect={() => {}} 
                                    autoDetect={false}
                                />
                                <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                                    {requests.map((r: any) => (
                                        <div 
                                            key={r._id} 
                                            className="min-w-[200px] p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:border-amber-200"
                                            onClick={() => showToast(`Panned to ${r.title}`, 'info')}
                                        >
                                            <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">{r.status}</p>
                                            <p className="text-xs font-bold text-primary-text truncate">{r.title}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-primary-text">📊 GROWTH ANALYTICS</h2>
                                <button
                                    onClick={() => setActiveTab('dashboard')}
                                    className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                                >
                                    <ChevronRight size={16} className="rotate-180" /> Back to Dashboard
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-8 rounded-3xl border border-gray-100 min-h-[400px] flex items-center justify-center">
                                    <div className="text-center">
                                        <TrendingUp size={48} className="mx-auto text-amber-200 mb-4" />
                                        <p className="text-secondary-text/40 font-bold">Fundraising Velocity Chart</p>
                                        <p className="text-[10px] text-secondary-text/30 mt-1 uppercase tracking-widest">Generating insights...</p>
                                    </div>
                                </div>
                                <div className="bg-white p-8 rounded-3xl border border-gray-100 min-h-[400px] flex items-center justify-center">
                                    <div className="text-center">
                                        <PieChart size={48} className="mx-auto text-emerald-200 mb-4" />
                                        <p className="text-secondary-text/40 font-bold">Donation Category Breakdown</p>
                                        <p className="text-[10px] text-secondary-text/30 mt-1 uppercase tracking-widest">Analyzing contributions...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-primary-text tracking-tight">👥 MANAGE MEMBERS</h2>
                                    <p className="text-sm text-secondary-text/60 mt-1">Add, view, and manage people in your institution</p>
                                </div>
                                <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl">{members.length} Total Members</span>
                            </div>

                            {/* Add Member Form */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
                            >
                                <h3 className="text-sm font-black text-primary-text uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <UserPlus size={16} className="text-amber-500" />
                                    Add New Member
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-secondary-text/50 uppercase tracking-widest mb-1 block">Full Name *</label>
                                        <input
                                            type="text"
                                            value={newMemberName}
                                            onChange={e => setNewMemberName(e.target.value)}
                                            placeholder="Enter name"
                                            className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-secondary-text/50 uppercase tracking-widest mb-1 block">Age</label>
                                        <input
                                            type="number"
                                            value={newMemberAge}
                                            onChange={e => setNewMemberAge(e.target.value)}
                                            placeholder="Age"
                                            className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-secondary-text/50 uppercase tracking-widest mb-1 block">Photo</label>
                                        <div className="flex items-center gap-3">
                                            <div
                                                onClick={() => memberPhotoRef.current?.click()}
                                                className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all overflow-hidden shrink-0"
                                            >
                                                {newMemberPhotoPreview ? (
                                                    <img src={newMemberPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Camera size={18} className="text-secondary-text/30" />
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => memberPhotoRef.current?.click()}
                                                className="flex-1 h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium text-secondary-text/50 hover:border-amber-400 hover:text-amber-600 transition-all text-left truncate"
                                            >
                                                {newMemberPhotoFile ? newMemberPhotoFile.name : 'Upload photo...'}
                                            </button>
                                            <input
                                                type="file"
                                                ref={memberPhotoRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleMemberPhotoSelect}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            onClick={handleAddMember}
                                            disabled={addingMember || !newMemberName.trim()}
                                            className="w-full h-11 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {addingMember ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <UserPlus size={16} />
                                                    Add Member
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Members Grid */}
                            {members.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {members.map((member: any, i: number) => (
                                        <motion.div
                                            key={member._id || i}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                                        >
                                            <div className="p-5 flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center overflow-hidden shrink-0">
                                                    {member.photo ? (
                                                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Users size={24} className="text-amber-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[15px] font-bold text-primary-text truncate">{member.name}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {member.age && (
                                                            <span className="text-[11px] text-secondary-text/60 font-medium">Age: {member.age}</span>
                                                        )}
                                                        <span className="text-[10px] text-secondary-text/30 font-medium">
                                                            Added: {member.addedAt ? new Date(member.addedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Today'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteMember(member._id)}
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-secondary-text/20 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-300 mx-auto mb-4">
                                        <Users size={36} />
                                    </div>
                                    <h3 className="text-lg font-black text-primary-text mb-1">No Members Yet</h3>
                                    <p className="text-sm text-secondary-text/40">Add your first member using the form above</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* LOGOUT MODAL */}
            <AnimatePresence>
                {showLogoutModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                            onClick={() => setShowLogoutModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-white rounded-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] z-50 p-8 text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <LogOut size={28} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-primary-text mb-2">Logout Confirmation</h3>
                            <p className="text-secondary-text text-sm mb-8">Are you sure you want to logout?</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 h-12 border border-gray-200 rounded-xl font-bold text-secondary-text hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 h-12 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg hover:shadow-red-500/30 transition-all"
                                >
                                    Yes, Logout
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InstitutionDashboard;
