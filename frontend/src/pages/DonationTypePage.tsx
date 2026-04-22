import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import {
    ChevronLeft, Shield, Zap, CheckCircle2, AlertTriangle,
    Lock, Clock, Eye, ArrowRight, X, Download, Mail,
    FileText, Star, Info, ChevronDown, ChevronUp, CreditCard
} from 'lucide-react';
import MockPaymentModal from '../components/MockPaymentModal';

// Receipt PDF generation
import jsPDF from 'jspdf';

type DonationType = 'ESCROW' | 'DIRECT';

const DonationTypePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showToast } = useNotifications();

    const requestId = searchParams.get('requestId') || '';
    const amount = Number(searchParams.get('amount')) || 0;

    const [request, setRequest] = useState<any>(null);
    const [selectedType, setSelectedType] = useState<DonationType>('ESCROW');
    const [isLoading, setIsLoading] = useState(true);
    const [isDonating, setIsDonating] = useState(false);
    const [showComparison, setShowComparison] = useState(false);

    // Confirmation checkboxes
    const [confirmEscrow, setConfirmEscrow] = useState(false);
    const [confirmDirect1, setConfirmDirect1] = useState(false);
    const [confirmDirect2, setConfirmDirect2] = useState(false);
    const [confirmDirect3, setConfirmDirect3] = useState(false);

    // Success state
    const [donationSuccess, setDonationSuccess] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => {
        if (!requestId) {
            navigate('/dashboard');
            return;
        }
        fetchRequest();
    }, [requestId]);

    const fetchRequest = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/help-requests/${requestId}`);
            if (res.data?.data?.helpRequest) {
                setRequest(res.data.data.helpRequest);
            } else {
                showToast('Request not found', 'warning');
                navigate('/dashboard');
            }
        } catch {
            showToast('Failed to load request', 'warning');
            navigate('/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    const isConfirmed = selectedType === 'ESCROW'
        ? confirmEscrow
        : (confirmDirect1 && confirmDirect2 && confirmDirect3);

    const handleDonate = async () => {
        if (isDonating) return;
        setIsDonating(true);
        try {
            const res = await api.post(`/help-requests/${requestId}/donate`, {
                amount,
                donationType: selectedType,
            });
            if (res.data.status === 'success') {
                setReceiptData(res.data.data.receiptData);
                setDonationSuccess(true);
                showToast(`Successfully donated ₹${amount.toLocaleString()}! 🎉`, 'success');
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Donation failed', 'warning');
        } finally {
            setIsDonating(false);
            setShowPaymentModal(false);
        }
    };

    const generateReceiptPDF = () => {
        if (!receiptData) return;
        const doc = new jsPDF();
        const pw = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(245, 158, 11);
        doc.rect(0, 0, pw, 50, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('DONATION RECEIPT', pw / 2, 22, { align: 'center' });
        doc.setFontSize(10);
        doc.text('Official Tax Deductible Receipt', pw / 2, 32, { align: 'center' });
        doc.setFontSize(9);
        doc.text('Social Kind - Making India Better', pw / 2, 42, { align: 'center' });

        // Body
        doc.setTextColor(31, 41, 55);
        let y = 64;

        const addSection = (title: string) => {
            doc.setFillColor(249, 250, 251);
            doc.rect(14, y - 4, pw - 28, 10, 'F');
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(31, 41, 55);
            doc.text(title, 18, y + 3);
            y += 14;
        };

        const addRow = (label: string, value: string) => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(107, 114, 128);
            doc.text(label, 18, y);
            doc.setTextColor(31, 41, 55);
            doc.setFont('helvetica', 'bold');
            doc.text(value, 90, y);
            y += 7;
        };

        addSection('RECEIPT DETAILS');
        addRow('Receipt Number', receiptData.receiptId || 'N/A');
        addRow('Receipt Date', new Date(receiptData.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
        addRow('Transaction Status', 'SUCCESS');
        y += 4;

        addSection('DONOR INFORMATION');
        addRow('Name', receiptData.donorName || 'Anonymous');
        addRow('Email', receiptData.donorEmail || 'N/A');
        y += 4;

        addSection('RECIPIENT INFORMATION');
        addRow('Institution', receiptData.institutionName || 'N/A');
        y += 4;

        addSection('DONATION DETAILS');
        addRow('Purpose', receiptData.requestTitle || 'N/A');
        addRow('Category', (receiptData.requestCategory || 'General').charAt(0).toUpperCase() + (receiptData.requestCategory || 'general').slice(1));
        addRow('Donation Type', receiptData.donationType === 'ESCROW' ? 'Escrow Protected' : 'Direct Instant');
        y += 4;

        addSection('FINANCIAL BREAKDOWN');
        addRow('Donation Amount', `Rs. ${Number(receiptData.amount).toLocaleString('en-IN')}`);
        addRow('Platform Fee', 'Rs. 0 (Waived)');
        doc.setDrawColor(209, 213, 219);
        doc.line(18, y - 2, pw - 18, y - 2);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(245, 158, 11);
        doc.text('TOTAL PAID', 18, y + 5);
        doc.text(`Rs. ${Number(receiptData.amount).toLocaleString('en-IN')}`, 90, y + 5);
        y += 16;

        if (receiptData.donationType === 'ESCROW') {
            addSection('ESCROW INFORMATION');
            addRow('Escrow Status', 'LOCKED');
            addRow('Proof Required', 'Yes (GPS-verified)');
            addRow('Review Period', '7 days');
            addRow('Refund Eligible', 'Yes (if proof unsatisfactory)');
            y += 4;
        }

        addSection('TAX INFORMATION');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text('This donation is eligible for tax deduction under Section 80G', 18, y);
        y += 6;
        doc.text('of the Income Tax Act, 1961. Please retain this receipt for tax filing.', 18, y);
        y += 12;

        // Footer
        doc.setDrawColor(209, 213, 219);
        doc.line(14, y, pw - 14, y);
        y += 8;
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.setFont('helvetica', 'italic');
        doc.text('Generated by Social Kind Platform', pw / 2, y, { align: 'center' });
        doc.text('This is a computer-generated receipt and does not require a signature', pw / 2, y + 5, { align: 'center' });

        doc.save(`SocialKind_Receipt_${receiptData.receiptId || 'receipt'}.pdf`);
    };

    // ── SUCCESS SCREEN ──
    if (donationSuccess && receiptData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 pt-24 pb-12 px-4">
                <div className="max-w-lg mx-auto">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center space-y-6"
                    >
                        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                            <CheckCircle2 size={48} className="text-emerald-600" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900">Donation Successful!</h1>
                        <p className="text-gray-500 text-sm">
                            Your {selectedType === 'ESCROW' ? 'escrow protected' : 'direct'} donation of{' '}
                            <span className="font-bold text-gray-800">₹{amount.toLocaleString()}</span>{' '}
                            has been processed.
                        </p>

                        {selectedType === 'ESCROW' && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-2">
                                <p className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                                    <Lock size={14} /> Escrow Protected
                                </p>
                                <ul className="text-xs text-emerald-700 space-y-1">
                                    <li>• Your funds are locked securely</li>
                                    <li>• Institution must upload GPS-verified proof</li>
                                    <li>• 7-day review period after proof submission</li>
                                    <li>• 100% refundable if unsatisfied</li>
                                </ul>
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-gray-200 p-5 text-left space-y-3">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Receipt Details</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">Receipt ID</span><span className="font-bold text-gray-800">{receiptData.receiptId}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-gray-800">₹{Number(receiptData.amount).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-bold text-gray-800">{receiptData.donationType === 'ESCROW' ? '🔒 Escrow' : '⚡ Direct'}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Institution</span><span className="font-bold text-gray-800">{receiptData.institutionName}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Purpose</span><span className="font-bold text-gray-800 text-right max-w-[60%] truncate">{receiptData.requestTitle}</span></div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={generateReceiptPDF}
                                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-200 hover:shadow-xl transition-all"
                            >
                                <Download size={16} /> Download Receipt
                            </button>
                        </div>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full h-11 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50/20 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-bold text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // ── COMPARISON TABLE DATA ──
    const comparisonRows = [
        { feature: 'Money goes to', escrow: 'Secure escrow vault', direct: 'Institution directly', escrowGood: true, directGood: false },
        { feature: 'Safety', escrow: '✅ Very High', direct: '⚠️ Trust-based', escrowGood: true, directGood: false },
        { feature: 'Proof', escrow: '✅ Mandatory GPS-verified', direct: '⚠️ Optional', escrowGood: true, directGood: false },
        { feature: 'Refund if issues', escrow: '✅ Yes (100%)', direct: '❌ No', escrowGood: true, directGood: false },
        { feature: 'Review period', escrow: '✅ 7 days', direct: '❌ None', escrowGood: true, directGood: false },
        { feature: 'Processing time', escrow: '⚠️ 2-3 days', direct: '✅ Immediate', escrowGood: false, directGood: true },
        { feature: 'Transparency', escrow: '✅ Complete', direct: '⚠️ Limited', escrowGood: true, directGood: false },
    ];

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-amber-50/20 overflow-y-auto" style={{ paddingTop: '96px' }}>
            <div className="max-w-3xl mx-auto space-y-6 px-4 pb-16">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                        <ChevronLeft size={18} /> Back
                    </button>
                    <h1 className="text-lg font-black text-gray-800">Choose Donation Type</h1>
                    <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>

                {/* Donation Summary */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-sm text-gray-500">You're donating</p>
                    <p className="text-3xl font-black text-amber-600 mt-1">₹{amount.toLocaleString()}</p>
                    <p className="text-sm font-bold text-gray-800 mt-2">{request?.title || 'Donation'}</p>
                    <p className="text-xs text-gray-400">{request?.donorId?.profile?.fullName || 'Institution'}</p>
                </div>

                {/* Section Title */}
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-black text-gray-800">HOW WOULD YOU LIKE TO DONATE?</h2>
                    <p className="text-sm text-gray-500">Choose your preferred donation method:</p>
                </div>

                {/* ── OPTION 1: ESCROW ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    onClick={() => { setSelectedType('ESCROW'); setConfirmDirect1(false); setConfirmDirect2(false); setConfirmDirect3(false); }}
                    className={`cursor-pointer rounded-2xl p-5 transition-all border-[3px] ${
                        selectedType === 'ESCROW'
                            ? 'border-amber-400 bg-amber-50/60 shadow-xl shadow-amber-100/50'
                            : 'border-gray-200 bg-white hover:border-amber-200'
                    }`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedType === 'ESCROW' ? 'border-amber-500 bg-amber-500' : 'border-gray-300'}`}>
                            {selectedType === 'ESCROW' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                            <Shield size={18} className="text-amber-600" />
                            <h3 className="text-base font-black text-amber-700">🔒 ESCROW PROTECTED</h3>
                        </div>
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest bg-amber-100 px-2 py-0.5 rounded-md">Recommended</span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">Your money is locked securely. Released only after GPS-verified proof.</p>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {[
                            'Secure escrow vault',
                            'GPS-verified proof required',
                            '100% refundable',
                            'Full transparency',
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                <span className="text-xs text-gray-600">{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                        <p className="text-[11px] text-blue-700">
                            <span className="font-bold">💡</span> Best for first-time donors and large amounts
                        </p>
                    </div>
                </motion.div>

                {/* ── OPTION 2: DIRECT ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    onClick={() => { setSelectedType('DIRECT'); setConfirmEscrow(false); }}
                    className={`cursor-pointer rounded-2xl p-5 transition-all border-2 ${
                        selectedType === 'DIRECT'
                            ? 'border-orange-400 bg-orange-50/60 shadow-xl shadow-orange-100/50'
                            : 'border-gray-200 bg-white hover:border-orange-200'
                    }`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedType === 'DIRECT' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                            {selectedType === 'DIRECT' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                            <Zap size={18} className="text-orange-600" />
                            <h3 className="text-base font-black text-orange-700">⚡ DIRECT INSTANT</h3>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">Money goes directly to institution. Faster but trust-based.</p>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {[
                            'Instant transfer',
                            'No escrow delay',
                            'Simpler process',
                            'Trust-based',
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                <span className="text-xs text-gray-600">{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-orange-50 rounded-lg px-3 py-2 border border-orange-100">
                        <p className="text-[11px] text-orange-700">
                            <span className="font-bold">⚠️</span> No refund policy. Best for trusted institutions.
                        </p>
                    </div>
                </motion.div>

                {/* ── COMPARISON TABLE ── */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button
                        onClick={() => setShowComparison(!showComparison)}
                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-sm font-black text-gray-700 uppercase tracking-widest">Comparison Table</span>
                        {showComparison ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </button>
                    <AnimatePresence>
                        {showComparison && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="text-left px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-widest">Feature</th>
                                            <th className="text-center px-4 py-3 text-xs font-black text-amber-600 uppercase tracking-widest">🔒 Escrow</th>
                                            <th className="text-center px-4 py-3 text-xs font-black text-orange-600 uppercase tracking-widest">⚡ Direct</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comparisonRows.map((row, i) => (
                                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                                <td className="px-5 py-3 text-gray-700 font-medium">{row.feature}</td>
                                                <td className={`px-4 py-3 text-center text-xs font-bold ${row.escrowGood ? 'text-emerald-600' : 'text-amber-600'}`}>{row.escrow}</td>
                                                <td className={`px-4 py-3 text-center text-xs font-bold ${row.directGood ? 'text-emerald-600' : 'text-amber-600'}`}>{row.direct}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── SELECTION SUMMARY ── */}
                <div className={`rounded-xl p-5 ${
                    selectedType === 'ESCROW'
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-orange-50 border border-orange-200'
                }`}>
                    <h3 className="text-sm font-black mb-3 flex items-center gap-2">
                        {selectedType === 'ESCROW' ? (
                            <><Lock size={14} className="text-emerald-700" /> <span className="text-emerald-800">You selected: ESCROW PROTECTED DONATION</span></>
                        ) : (
                            <><Zap size={14} className="text-orange-700" /> <span className="text-orange-800">You selected: DIRECT INSTANT DONATION</span></>
                        )}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">Your ₹{amount.toLocaleString()} will be:</p>
                    {selectedType === 'ESCROW' ? (
                        <ul className="text-xs text-emerald-700 space-y-1">
                            <li>• Locked in secure escrow vault immediately</li>
                            <li>• Released only after GPS-verified proof</li>
                            <li>• Fully refundable if unsatisfied</li>
                        </ul>
                    ) : (
                        <>
                            <ul className="text-xs text-orange-700 space-y-1">
                                <li>• Sent directly to institution's account</li>
                                <li>• Available for immediate use</li>
                                <li>• No escrow protection applied</li>
                            </ul>
                            <p className="text-xs text-orange-600 font-bold mt-2 flex items-center gap-1">
                                <AlertTriangle size={12} /> This donation cannot be refunded
                            </p>
                        </>
                    )}
                </div>

                {/* ── CONFIRMATION CHECKBOXES ── */}
                <div className="space-y-3">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Confirmation Required</p>
                    {selectedType === 'ESCROW' ? (
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={confirmEscrow}
                                onChange={e => setConfirmEscrow(e.target.checked)}
                                className="w-5 h-5 rounded border-2 border-gray-300 accent-amber-600 mt-0.5"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                                I understand my donation is protected by escrow and will be released after verified proof
                            </span>
                        </label>
                    ) : (
                        <>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" checked={confirmDirect1} onChange={e => setConfirmDirect1(e.target.checked)} className="w-5 h-5 rounded border-2 border-gray-300 accent-orange-600 mt-0.5" />
                                <span className="text-sm text-gray-700">I understand this is a direct donation without escrow protection</span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" checked={confirmDirect2} onChange={e => setConfirmDirect2(e.target.checked)} className="w-5 h-5 rounded border-2 border-gray-300 accent-orange-600 mt-0.5" />
                                <span className="text-sm text-gray-700">I understand proof upload is optional for the institution</span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" checked={confirmDirect3} onChange={e => setConfirmDirect3(e.target.checked)} className="w-5 h-5 rounded border-2 border-gray-300 accent-orange-600 mt-0.5" />
                                <span className="text-sm text-gray-700">I understand I cannot request a refund for this donation</span>
                            </label>
                        </>
                    )}
                </div>

                {/* ── ACTION BUTTONS ── */}
                <div className="flex gap-4 pt-2 pb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-1 h-14 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <ChevronLeft size={16} /> Back
                    </button>
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        disabled={!isConfirmed || isDonating}
                        className={`flex-[2] h-14 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                            isConfirmed && !isDonating
                                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-xl shadow-amber-200/50 hover:shadow-2xl hover:-translate-y-0.5'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {isDonating ? (
                            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                        ) : (
                            <>Confirm & Pay <ArrowRight size={16} /></>
                        )}
                    </button>
                </div>

                <MockPaymentModal 
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={(type) => {
                        setSelectedType(type);
                        handleDonate();
                    }}
                    amount={amount}
                />
            </div>
        </div>
    );
};

export default DonationTypePage;
