import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Heart, Download, Calendar, ShieldCheck, Zap, 
    ChevronRight, ArrowUpRight, Search, Filter,
    CheckCircle2, Clock, Info, ExternalLink, Receipt
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/design-system/Button';
import { Card } from '../components/design-system/Card';

interface Transaction {
    _id: string;
    amount: number;
    type: 'donation' | 'payout' | 'escrow_lock' | 'escrow_release';
    donationType: 'ESCROW' | 'DIRECT';
    escrowStatus: string;
    status: string;
    createdAt: string;
    helpRequestId?: {
        _id: string;
        title: string;
        category: string;
        institutionId: {
            profile: {
                fullName: string;
            }
        }
    };
    metadata?: any;
    receiptId: string;
}

const DonationHistoryPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [donations, setDonations] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'escrow' | 'direct'>('all');

    useEffect(() => {
        fetchDonations();
    }, []);

    const fetchDonations = async () => {
        try {
            const res = await api.get('/help-requests/donation-history');
            const data = res.data?.data?.donations || res.data?.data;
            if (Array.isArray(data)) {
                setDonations(data);
            } else {
                setDonations([]);
            }
        } catch (err) {
            console.error('Error fetching donations:', err);
            setDonations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const generateReceipt = async (txId: string) => {
        try {
            const donation = donations.find(d => d._id === txId);
            if (!donation) throw new Error('Transaction not found in state');

            const res = await api.get(`/help-requests/receipt/${txId}`);
            const receipt = res.data?.data?.receipt || res.data?.data;
            
            const doc = new jsPDF();
            const pw = doc.internal.pageSize.getWidth();
            
            // Premium Header — Gold gradient bar
            doc.setFillColor(245, 158, 11);
            doc.rect(0, 0, pw, 50, 'F');
            doc.setFillColor(217, 119, 6);
            doc.rect(0, 45, pw, 5, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(26);
            doc.setFont('helvetica', 'bold');
            doc.text('SOCIAL KIND', 20, 22);
            doc.setFontSize(10);
            doc.text('OFFICIAL DONATION RECEIPT', 20, 32);
            doc.setFontSize(8);
            doc.text('Section 80G - Tax Deductible', 20, 40);

            // Receipt ID right-aligned
            doc.setFontSize(9);
            doc.text(`Receipt: ${receipt.receiptId || 'N/A'}`, pw - 20, 22, { align: 'right' });
            doc.text(`Date: ${receipt.date ? new Date(receipt.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString()}`, pw - 20, 30, { align: 'right' });

            let y = 65;
            const addSection = (title: string) => {
                doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(31, 41, 55);
                doc.text(title, 20, y); y += 2;
                doc.setDrawColor(245, 158, 11); doc.setLineWidth(0.5); doc.line(20, y, 80, y); y += 8;
            };
            const addRow = (label: string, value: string) => {
                doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
                doc.text(label, 25, y);
                doc.setFont('helvetica', 'bold'); doc.setTextColor(31, 41, 55);
                doc.text(String(value || 'N/A'), 90, y); y += 7;
            };

            addSection('DONOR DETAILS');
            addRow('Name', receipt.donor?.name || user?.profile?.fullName || 'Anonymous');
            addRow('Email', receipt.donor?.email || user?.email || '');
            addRow('Phone', receipt.donor?.phone || '');
            y += 4;

            addSection('DONATION DETAILS');
            addRow('Amount', `Rs. ${(receipt.amount || 0).toLocaleString('en-IN')}`);
            addRow('Type', receipt.donationType === 'ESCROW' ? 'Escrow Protected' : 'Direct Transfer');
            addRow('Status', receipt.status || 'Completed');
            addRow('Escrow Status', receipt.escrowStatus || 'N/A');
            y += 4;

            addSection('BENEFICIARY');
            addRow('Institution', receipt.institution?.name || donation.metadata?.institutionName || 'Humanexa Community');
            addRow('Purpose', receipt.request?.title || donation.metadata?.requestTitle || donation.metadata?.description || 'Citizen Response');
            addRow('Category', receipt.request?.category || 'Impact Contribution');
            y += 4;

            // Amount highlight box
            doc.setFillColor(255, 251, 235);
            doc.roundedRect(20, y, pw - 40, 35, 3, 3, 'F');
            doc.setDrawColor(245, 158, 11); doc.setLineWidth(0.3);
            doc.roundedRect(20, y, pw - 40, 35, 3, 3, 'S');
            doc.setFontSize(10); doc.setTextColor(107, 114, 128); doc.setFont('helvetica', 'normal');
            doc.text('TOTAL DONATION AMOUNT', pw / 2, y + 12, { align: 'center' });
            doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.setTextColor(217, 119, 6);
            doc.text(`Rs. ${(receipt.amount || 0).toLocaleString('en-IN')}`, pw / 2, y + 27, { align: 'center' });
            y += 45;

            // Tax info
            doc.setFontSize(9); doc.setTextColor(107, 114, 128); doc.setFont('helvetica', 'italic');
            doc.text('This donation is eligible for 100% tax deduction under Section 80G of the Income Tax Act, 1961.', pw / 2, y, { align: 'center' });
            y += 6;
            doc.text('This is a computer-generated receipt. No signature required.', pw / 2, y, { align: 'center' });

            // Footer
            doc.setFontSize(10); doc.setTextColor(245, 158, 11); doc.setFont('helvetica', 'bold');
            doc.text('Thank you for making a difference with Social Kind.', pw / 2, 280, { align: 'center' });
            doc.setFontSize(7); doc.setTextColor(156, 163, 175); doc.setFont('helvetica', 'normal');
            doc.text(`Reference: ${receipt.referenceId || receipt.receiptId || txId}`, pw / 2, 286, { align: 'center' });

            doc.save(`SocialKind_Receipt_${receipt.receiptId || donation.receiptId || txId}.pdf`);
        } catch (err) {
            console.error('Receipt generation failed:', err);
            alert('Failed to generate receipt. Please try again.');
        }
    };

    const filteredDonations = donations.filter(d => {
        const matchesSearch = d.helpRequestId?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             d.helpRequestId?.institutionId?.profile?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || 
                          (activeTab === 'escrow' && d.donationType === 'ESCROW') ||
                          (activeTab === 'direct' && d.donationType === 'DIRECT');
        return matchesSearch && matchesTab;
    });

    const totalDonated = donations
        .filter(d => d.type === 'donation' || d.type === 'escrow_lock')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const totalEarned = donations
        .filter(d => d.type === 'payout' || d.type === 'escrow_release')
        .reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 pt-28">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                {/* Hero Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 bg-gradient-to-br from-sapphire to-blue-700 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-200"
                    >
                        <div className="relative z-10">
                            <h1 className="text-4xl font-serif italic mb-2">Kindness Legacy</h1>
                            <p className="text-blue-100/70 text-sm font-medium uppercase tracking-[0.2em] mb-8">Citizen Donation Registry</p>
                            
                            <div className="flex items-end gap-12">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200/60 mb-1">Impact Contributions</p>
                                    <p className="text-5xl font-black tracking-tighter">₹{totalDonated.toLocaleString()}</p>
                                </div>
                                {totalEarned > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-200/60 mb-1">Impact Earnings</p>
                                        <p className="text-3xl font-black tracking-tighter">₹{totalEarned.toLocaleString()}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200/60 mb-1">Impact Tokens</p>
                                    <p className="text-3xl font-black tracking-tighter">+{Math.floor((totalDonated + totalEarned) / 10)}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Decorative elements */}
                        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-10 right-10 opacity-20">
                            <Heart size={200} fill="white" stroke="none" />
                        </div>
                    </motion.div>

                    <Card variant="glass" className="p-8 flex flex-col justify-between">
                        <div>
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                <ShieldCheck size={12} /> Sincerity Guard Active
                            </span>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Escrow Protection</h3>
                            <p className="text-sm text-slate-500 leading-relaxed italic">
                                "{donations.filter(d => d.donationType === 'ESCROW').length} of your donations are currently protected by our 7-day sincerity verification lock."
                            </p>
                        </div>
                        <Button variant="secondary" className="w-full h-14 mt-6">Protocol FAQ</Button>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-8">
                    <div className="flex bg-white p-1 rounded-2xl shadow-soft-sm border border-slate-100">
                        {['all', 'escrow', 'direct'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab ? 'bg-sapphire text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search projects..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 bg-white rounded-2xl pl-12 pr-4 text-sm font-medium border border-slate-100 focus:outline-none focus:ring-2 focus:ring-sapphire focus:border-transparent shadow-soft-sm"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    <AnimatePresence mode='popLayout'>
                        {filteredDonations.length > 0 ? filteredDonations.map((donation, idx) => (
                            <motion.div
                                key={donation._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-50 transition-all duration-500"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                                    {/* Project Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${
                                                ['payout', 'escrow_release'].includes(donation.type)
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : donation.donationType === 'ESCROW' 
                                                ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                                : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                            }`}>
                                                {donation.type === 'payout' || donation.type === 'escrow_release' ? 'Impact Reward' : `${donation.donationType} Transfer`}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                                                <Calendar size={12} /> {new Date(donation.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-900 leading-tight mb-1 group-hover:text-sapphire transition-colors underline-offset-4 decoration-sapphire/20">
                                            {donation.helpRequestId?.title || donation.metadata?.requestTitle || donation.metadata?.description || donation.metadata?.reason || 'Humanexa Impact Contribution'}
                                        </h4>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            {['payout', 'escrow_release'].includes(donation.type) 
                                                ? 'Credit Origin: Institutional Vault' 
                                                : `Beneficiary: ${donation.helpRequestId?.institutionId?.profile?.fullName || donation.metadata?.institutionName || 'Citizen Assistance'}`}
                                        </p>
                                    </div>

                                    {/* Status Section */}
                                    <div className="flex items-center gap-12 px-8 lg:border-x border-slate-50">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Status</p>
                                            <div className="flex items-center gap-2">
                                                {donation.donationType === 'ESCROW' ? (
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                                                        <Clock size={12} /> {donation.escrowStatus || 'LOCKED'}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                                        <CheckCircle2 size={12} /> TRANSFERRED
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Amount</p>
                                            <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{donation.amount.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3">
                                        <Button 
                                            variant="ghost" 
                                            className="w-12 h-12 p-0 rounded-2xl bg-slate-50 text-slate-400 hover:text-sapphire hover:bg-blue-50"
                                            onClick={() => generateReceipt(donation._id)}
                                            title="Download Receipt"
                                        >
                                            <Download size={20} />
                                        </Button>
                                        <Button 
                                            variant="secondary" 
                                            className="h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest group-hover:bg-slate-950 group-hover:text-white transition-all"
                                            onClick={() => navigate(`/live-impact?id=${donation.helpRequestId?._id}`)}
                                        >
                                            Impact Detail <ArrowUpRight size={14} className="ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Heart size={32} className="text-slate-200" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No contributions detected yet</h3>
                                <p className="text-sm text-slate-500">Your kindness registry is empty. Ready to make an impact?</p>
                                <Button variant="primary" className="mt-8 px-10 h-14 rounded-2xl" onClick={() => navigate('/dashboard')}>
                                    Start Discovery
                                </Button>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default DonationHistoryPage;
