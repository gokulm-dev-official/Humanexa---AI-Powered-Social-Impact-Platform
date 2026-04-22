import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
    Users,
    ShieldCheck,
    Activity,
    Database,
    CheckCircle2,
    Clock,
    TrendingUp,
    ChevronLeft,
    AlertTriangle,
    Zap,
    Cpu,
    Server,
    Search,
    Filter,
    ArrowRight,
    Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card } from '../components/design-system/Card';
import { Button } from '../components/design-system/Button';
import { Badge } from '../components/design-system/Badge';
import { Input } from '../components/design-system/Input';
import { cn } from '../utils/cn';

const AdminDashboardPage = () => {
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'health'>('users');

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [statsRes, usersRes, logsRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/users'),
                    api.get('/admin/audit-logs')
                ]);
                setStats(statsRes.data.data);
                setUsers(usersRes.data.data.users);
                setLogs(logsRes.data.data.logs);
            } catch (err) {
                console.error('Failed to fetch admin data');
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-dark-background text-white overflow-hidden">
            <div className="relative mb-8">
                <div className="w-32 h-32 rounded-3xl bg-sapphire/20 border border-sapphire/40 flex items-center justify-center animate-pulse">
                    <ShieldCheck size={48} className="text-sapphire" />
                </div>
                <div className="absolute inset-0 bg-sapphire/10 blur-3xl animate-pulse"></div>
            </div>
            <h2 className="text-xl font-bold uppercase tracking-[0.4em] mb-4">Initializing Oversight</h2>
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="w-full h-full bg-sapphire"
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 px-6 pb-32 bg-background relative overflow-hidden">
            {/* Atmospheric Elements */}
            <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-sapphire/5 blur-[150px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                    <div>
                        <Link to="/dashboard" className="inline-flex">
                            <Button variant="ghost" className="pl-0 gap-2 text-secondary-text hover:text-sapphire" size="sm">
                                <ChevronLeft size={16} /> Impact Terminal
                            </Button>
                        </Link>
                        <div className="flex items-center gap-6 mb-4">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-dark-background flex items-center justify-center text-sapphire shadow-2xl">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-serif font-black text-primary-text mb-1">Oversight Command</h1>
                                <p className="text-secondary-text/60 font-bold uppercase tracking-[0.2em] text-[10px]">Social Kind Protocol Governance</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-white/50 p-1.5 rounded-2xl border border-white/40 backdrop-blur-xl">
                        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Citizens" />
                        <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} label="Audit Logs" />
                        <TabButton active={activeTab === 'health'} onClick={() => setActiveTab('health')} label="System Health" />
                    </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                    <AdminStatCard label="Total Citizenry" value={stats?.totalUsers} icon={<Users />} trend="+4% this week" color="text-sapphire" bg="bg-sapphire/10" />
                    <AdminStatCard label="Impact Streams" value={stats?.totalRequests} icon={<Zap />} trend="+12% activity" color="text-purple-600" bg="bg-purple-500/10" />
                    <AdminStatCard label="Active Empaths" value={stats?.activeHelpers} icon={<Activity />} trend="Stable" color="text-emerald-500" bg="bg-emerald-500/10" />
                    <AdminStatCard label="Oversight Queue" value={stats?.pendingVerifications} icon={<Clock />} trend="Real-time" color="text-amber-400" bg="bg-amber-400/10" />
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'users' && (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-10"
                        >
                            <Card variant="default" className="p-0 overflow-hidden shadow-soft-xl border-sapphire/5">
                                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white/50">
                                    <div className="flex items-center gap-6">
                                        <h3 className="text-2xl font-serif font-bold text-primary-text uppercase tracking-tight">Identity Registry</h3>
                                        <div className="hidden md:block w-64 h-10">
                                            <Input placeholder="Search presence..." leftIcon={<Search size={14} />} className="bg-white/50" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button variant="ghost" size="icon" className="text-secondary-text/60"><Filter size={18} /></Button>
                                        <Badge variant="sapphire" className="px-4 py-2 text-[10px]">{users.length} TOTAL RECORDS</Badge>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-[10px] uppercase font-bold tracking-widest text-secondary-text/60">
                                                <th className="px-10 py-6">Identity Portal</th>
                                                <th className="px-10 py-6">Trust Sincerity</th>
                                                <th className="px-10 py-6">Protocol Rank</th>
                                                <th className="px-10 py-6">Arrival Date</th>
                                                <th className="px-10 py-6">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {users.map((u) => (
                                                <tr key={u._id} className="hover:bg-sapphire/5 transition-all group">
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-white flex items-center justify-center shrink-0 group-hover:bg-sapphire group-hover:text-white transition-all overflow-hidden shadow-sm">
                                                                {u.profile?.avatar ? (
                                                                    <img src={u.profile.avatar} className="w-full h-full object-cover" alt="Avatar" />
                                                                ) : (
                                                                    <span className="text-sm font-bold">{u.profile?.fullName?.substring(0, 1).toUpperCase()}</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-primary-text mb-0.5">{u.profile?.fullName}</p>
                                                                <p className="text-[10px] font-medium text-secondary-text/60 uppercase tracking-wide">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider",
                                                            u.verificationStatus?.idVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>
                                                            {u.verificationStatus?.idVerified ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                                            {u.verificationStatus?.idVerified ? 'IDENTITY VERIFIED' : 'PENDING AUDIT'}
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6 text-xs font-bold text-primary-text uppercase tracking-widest">
                                                        {u.creditScore?.rank || 'BRONZE'}
                                                    </td>
                                                    <td className="px-10 py-6 text-xs font-medium text-secondary-text/60 uppercase tracking-widest leading-none">
                                                        {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <Button size="icon" variant="ghost" className="rounded-xl hover:bg-dark-background hover:text-white">
                                                            <ArrowRight size={16} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {activeTab === 'logs' && (
                        <motion.div
                            key="logs"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-12"
                        >
                            <div className="lg:col-span-2 space-y-6">
                                {logs.map((log) => (
                                    <Card key={log._id} variant="default" className="flex gap-6 items-start group hover:border-sapphire/30 transition-all p-6">
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white shadow-sm",
                                            log.severity === 'high' ? 'bg-rose-50 text-rose-500' :
                                                log.severity === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-400'
                                        )}>
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div className="flex-grow space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Badge size="sm" variant="sapphire" className="text-[9px] px-2 py-0.5">
                                                    {log.action?.replace('_', ' ')}
                                                </Badge>
                                                <span className="text-[9px] font-bold text-secondary-text/40 uppercase tracking-widest">
                                                    {new Date(log.createdAt).toLocaleTimeString()} · SECURE NODE
                                                </span>
                                            </div>
                                            <p className="text-base font-bold text-primary-text leading-snug">
                                                {log.reason || 'System integrity protocol executed without stated rationale.'}
                                            </p>
                                            <div className="flex items-center gap-2 pt-3 border-t border-dashed border-gray-100 mt-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold">{log.performedBy?.profile?.fullName?.substring(0, 1) || 'N'}</div>
                                                <span className="text-[10px] font-bold text-secondary-text/60 uppercase tracking-widest">Executed by {log.performedBy?.profile?.fullName || 'Protocol Oracle'}</span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                            <div className="space-y-10">
                                <Card variant="default" className="bg-dark-background text-white overflow-hidden relative border-0 shadow-2xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-sapphire/20 blur-[60px] rounded-full"></div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                        <Database size={16} className="text-sapphire" /> Integrity Metrics
                                    </h4>
                                    <div className="space-y-8 relative z-10">
                                        <Metric label="Data Sincerity" value="99.99%" />
                                        <Metric label="Protocol Latency" value="12ms" />
                                        <Metric label="Encryption" value="AES-256" />
                                    </div>
                                    <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-3">Blockchain Sync</p>
                                        <div className="flex justify-center gap-2">
                                            {[1, 1, 1, 1, 0, 1].map((n, i) => (
                                                <div key={i} className={`w-1 h-5 rounded-full ${n ? 'bg-emerald-500' : 'bg-white/10'} animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'health' && (
                        <motion.div
                            key="health"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                        >
                            <HealthCard label="Neural Engine" icon={<Cpu />} status="Synchronized" load="12%" />
                            <HealthCard label="Impact Database" icon={<Database />} status="Optimized" load="45%" />
                            <HealthCard label="API Sockets" icon={<Server />} status="Connected" load="7%" />
                            <Card variant="glass" className="md:col-span-3 text-center bg-white/60 p-12">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-8 shadow-inner">
                                    <TrendingUp size={40} className="animate-pulse" />
                                </div>
                                <h3 className="text-3xl font-serif font-black text-primary-text mb-3 uppercase tracking-tighter">Protocol Heartbeat: Healthy</h3>
                                <p className="text-secondary-text/60 font-bold uppercase tracking-[0.2em] text-xs">All Social Kind verification nodes are operating within established trust bounds.</p>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

function TabButton({ active, onClick, label }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-8 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all duration-300",
                active ? "bg-white text-sapphire shadow-md transform scale-105" : "text-secondary-text/60 hover:text-primary-text hover:bg-white/50"
            )}
        >
            {label}
        </button>
    );
}

function Metric({ label, value }: any) {
    return (
        <div className="flex justify-between items-end border-b border-white/5 pb-2">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</span>
            <span className="text-lg font-black text-white">{value}</span>
        </div>
    );
}

function AdminStatCard({ label, value, icon, color, bg, trend }: any) {
    return (
        <Card variant="default" className="relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 p-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                <div className={cn("h-full transition-all duration-1000 w-[60%] group-hover:w-full", color.replace('text-', 'bg-'))}></div>
            </div>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", bg, color)}>
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <div>
                <p className="text-4xl font-serif font-black text-primary-text mb-1">{value || 0}</p>
                <div className="flex items-center justify-between">
                    <p className="text-[9px] font-bold text-secondary-text/40 uppercase tracking-widest">{label}</p>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">{trend}</span>
                </div>
            </div>
        </Card>
    );
}

function HealthCard({ label, icon, status, load }: any) {
    return (
        <Card variant="default" className="p-8">
            <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-sapphire shadow-inner">
                    {React.cloneElement(icon, { size: 28 })}
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    {status}
                </div>
            </div>
            <h4 className="text-lg font-bold text-primary-text mb-6 uppercase tracking-tight">{label}</h4>
            <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-secondary-text/40">
                    <span>Current Node Load</span>
                    <span>{load}</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-sapphire rounded-full" style={{ width: load }}></div>
                </div>
            </div>
        </Card>
    );
}

export default AdminDashboardPage;
