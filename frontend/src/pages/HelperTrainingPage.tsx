import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, BookOpen, MapPin, Camera, MessageSquare, ClipboardCheck, GraduationCap, CheckCircle2, Play, Lock, Trophy, ChevronRight, XCircle } from 'lucide-react';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';

interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

const moduleQuestions: Record<string, QuizQuestion[]> = {
    module1_gps: [
        { question: 'What is the maximum allowed radius for facility photos?', options: ['100m', '50m', '200m', '500m'], correctIndex: 1 },
        { question: 'What timestamp tolerance is allowed?', options: ['1 minute', '2 minutes', '5 minutes', '10 minutes'], correctIndex: 1 },
        { question: 'When GPS accuracy is low, you should:', options: ['Ignore it', 'Move to open area', 'Turn off GPS', 'Use WiFi only'], correctIndex: 1 },
    ],
    module2_photos: [
        { question: 'Minimum number of proof photos required:', options: ['3', '5', '7', '10'], correctIndex: 1 },
        { question: 'All proof photos must include:', options: ['Filters', 'GPS metadata', 'Stickers', 'Text overlay'], correctIndex: 1 },
        { question: 'Minimum photo resolution required:', options: ['320x240', '640x480', '1920x1080', '4K'], correctIndex: 1 },
    ],
    module3_communication: [
        { question: 'When should you notify the donor?', options: ['Never', 'Only if issues', 'At every milestone', 'Only at completion'], correctIndex: 2 },
        { question: 'If items are unavailable, you should:', options: ['Skip them', 'Contact institution & donor', 'Find alternatives alone', 'Cancel task'], correctIndex: 1 },
        { question: 'Professional communication includes:', options: ['Slang', 'Clear updates', 'Emojis only', 'No contact'], correctIndex: 1 },
    ],
    module4_verification: [
        { question: 'What must be checked on delivered items?', options: ['Color only', 'Quantity & expiry dates', 'Brand only', 'Price only'], correctIndex: 1 },
        { question: 'Staff confirmation is:', options: ['Optional', 'Mandatory', 'Not needed', 'Only for large orders'], correctIndex: 1 },
        { question: 'Bills/invoices must be:', options: ['Ignored', 'Photographed and matched', 'Estimated', 'Discarded'], correctIndex: 1 },
    ],
    module5_exam: [
        { question: 'The 30-minute countdown starts when?', options: ['Task assigned', 'Arrival photo validated', 'First photo taken', 'You click start'], correctIndex: 1 },
        { question: 'What happens if the countdown expires?', options: ['Nothing', 'Warning only', 'No payment + rating penalty', 'Auto-extension'], correctIndex: 2 },
        { question: 'Escrow funds are released after:', options: ['Immediate', 'Proof + review period', 'Never', '24 hours'], correctIndex: 1 },
        { question: 'GPS validation checks photo\'s:', options: ['Color', 'Location & timestamp', 'File size', 'Filter'], correctIndex: 1 },
        { question: 'Elite tier requires minimum tasks:', options: ['10', '25', '50', '100'], correctIndex: 3 },
    ],
};

const HelperTrainingPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useNotifications();

    const [progress, setProgress] = useState<any>({});
    const [overallProgress, setOverallProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeModule, setActiveModule] = useState<string | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState(0);

    const modules = [
        { id: 'module1_gps', title: 'GPS Mastery', icon: MapPin, duration: '20 min', description: 'Learn GPS validation, accuracy, and troubleshooting', color: 'blue' },
        { id: 'module2_photos', title: 'Pro Photography', icon: Camera, duration: '30 min', description: 'Photo standards, composition, and metadata', color: 'emerald' },
        { id: 'module3_communication', title: 'Communication Skills', icon: MessageSquare, duration: '25 min', description: 'Professional donor & institution communication', color: 'amber' },
        { id: 'module4_verification', title: 'Advanced Verification', icon: ClipboardCheck, duration: '30 min', description: 'Checklist procedures and edge cases', color: 'purple' },
        { id: 'module5_exam', title: 'Final Certification Exam', icon: GraduationCap, duration: '15 min', description: 'Comprehensive exam (80% to pass)', color: 'red' },
    ];

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const res = await api.get('/certification/training/progress');
                setProgress(res.data.data.modules || {});
                setOverallProgress(res.data.data.overallProgress || 0);
            } catch { }
            setLoading(false);
        };
        fetchProgress();
    }, []);

    const startModule = (moduleId: string) => {
        setActiveModule(moduleId);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizScore(0);
    };

    const submitQuiz = async () => {
        if (!activeModule) return;
        const questions = moduleQuestions[activeModule] || [];
        let correct = 0;
        questions.forEach((q, idx) => {
            if (quizAnswers[idx] === q.correctIndex) correct++;
        });
        const score = Math.round((correct / questions.length) * 100);
        setQuizScore(score);
        setQuizSubmitted(true);

        try {
            const res = await api.post('/certification/training/submit', { moduleId: activeModule, score });
            if (res.data.data.passed) {
                showToast(`Module passed with ${score}%! 🎉`, 'success');
            } else {
                showToast(`Score: ${score}%. Need ${activeModule === 'module5_exam' ? '80' : '60'}% to pass. Try again!`, 'warning');
            }
            // Refresh progress
            const progRes = await api.get('/certification/training/progress');
            setProgress(progRes.data.data.modules || {});
            setOverallProgress(progRes.data.data.overallProgress || 0);
        } catch { showToast('Failed to submit quiz', 'warning'); }
    };

    const getColorClasses = (color: string) => ({
        bg: `bg-${color}-50`,
        text: `text-${color}-600`,
        border: `border-${color}-200`,
        gradient: color === 'blue' ? 'from-blue-500 to-blue-400' : color === 'emerald' ? 'from-emerald-500 to-emerald-400' : color === 'amber' ? 'from-amber-500 to-amber-400' : color === 'purple' ? 'from-purple-500 to-purple-400' : 'from-red-500 to-red-400',
    });

    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>);
    }

    // Active quiz view
    if (activeModule) {
        const questions = moduleQuestions[activeModule] || [];
        const mod = modules.find((m) => m.id === activeModule)!;
        const allAnswered = Object.keys(quizAnswers).length === questions.length;
        const passingScore = activeModule === 'module5_exam' ? 80 : 60;

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20 pt-20 pb-12 px-4">
                <div className="max-w-lg mx-auto space-y-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setActiveModule(null)} className="p-2 rounded-lg bg-gray-100"><ChevronLeft size={18} /></button>
                        <div>
                            <h1 className="text-lg font-black text-gray-800">{mod.title}</h1>
                            <p className="text-xs text-gray-400">{questions.length} questions · Pass: {passingScore}%</p>
                        </div>
                    </div>

                    {!quizSubmitted ? (
                        <div className="space-y-4">
                            {questions.map((q, qIdx) => (
                                <motion.div key={qIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qIdx * 0.05 }} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                                    <p className="text-sm font-bold text-gray-800">
                                        <span className="text-xs text-gray-400 mr-2">Q{qIdx + 1}.</span>
                                        {q.question}
                                    </p>
                                    <div className="space-y-2">
                                        {q.options.map((opt, oIdx) => (
                                            <button key={oIdx} onClick={() => setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))} className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border ${quizAnswers[qIdx] === oIdx ? 'bg-amber-50 border-amber-400 text-amber-800 font-bold' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'}`}>
                                                <span className="text-xs text-gray-400 mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}

                            <button onClick={submitQuiz} disabled={!allAnswered} className={`w-full h-14 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${allAnswered ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-xl shadow-amber-200/50' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                                Submit Answers
                            </button>
                        </div>
                    ) : (
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-5">
                            {/* Result */}
                            <div className={`rounded-2xl p-8 text-center ${quizScore >= passingScore ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                                <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${quizScore >= passingScore ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                    {quizScore >= passingScore ? <Trophy size={40} className="text-emerald-600" /> : <XCircle size={40} className="text-red-600" />}
                                </div>
                                <p className={`text-4xl font-black ${quizScore >= passingScore ? 'text-emerald-600' : 'text-red-600'}`}>{quizScore}%</p>
                                <p className={`text-lg font-bold mt-1 ${quizScore >= passingScore ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {quizScore >= passingScore ? 'MODULE PASSED! 🎉' : 'NOT PASSED'}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">Passing score: {passingScore}%</p>
                            </div>

                            {/* Answer review */}
                            <div className="space-y-3">
                                {questions.map((q, qIdx) => {
                                    const isCorrect = quizAnswers[qIdx] === q.correctIndex;
                                    return (
                                        <div key={qIdx} className={`rounded-xl p-4 border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                            <div className="flex items-start gap-2">
                                                {isCorrect ? <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" /> : <XCircle size={16} className="text-red-600 mt-0.5 shrink-0" />}
                                                <div>
                                                    <p className="text-sm font-bold text-gray-700">{q.question}</p>
                                                    {!isCorrect && <p className="text-xs text-emerald-600 mt-1">Correct: {q.options[q.correctIndex]}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3">
                                {quizScore < passingScore && (
                                    <button onClick={() => startModule(activeModule)} className="flex-1 h-12 rounded-xl bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2">Try Again</button>
                                )}
                                <button onClick={() => setActiveModule(null)} className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm flex items-center justify-center gap-2">Back to Modules</button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        );
    }

    // Module list view
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/20 pt-20 pb-12 px-4">
            <div className="max-w-lg mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><ChevronLeft size={18} /></button>
                    <div>
                        <h1 className="text-lg font-black text-gray-800">Training Program</h1>
                        <p className="text-xs text-gray-400">Complete all modules for Premium certification</p>
                    </div>
                </div>

                {/* Overall progress */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200 p-5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-amber-700 uppercase tracking-widest">Overall Progress</span>
                        <span className="text-lg font-black text-amber-600">{overallProgress}%</span>
                    </div>
                    <div className="h-3 bg-amber-200/50 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} transition={{ duration: 0.8 }} className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" />
                    </div>
                    <p className="text-xs text-amber-600 mt-2">{modules.filter((m) => (progress[m.id] as any)?.completed).length}/{modules.length} modules completed</p>
                </div>

                {/* Module cards */}
                <div className="space-y-3">
                    {modules.map((mod, idx) => {
                        const modProgress = progress[mod.id] as any;
                        const isCompleted = modProgress?.completed;
                        const score = modProgress?.score || 0;
                        const prevCompleted = idx === 0 || (progress[modules[idx - 1].id] as any)?.completed;
                        const isLocked = !prevCompleted;

                        return (
                            <motion.div key={mod.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className={`bg-white rounded-2xl border p-4 transition-all ${isCompleted ? 'border-emerald-200' : isLocked ? 'border-gray-200 opacity-60' : 'border-gray-200 hover:border-amber-300 hover:shadow-md cursor-pointer'}`} onClick={() => !isLocked && !isCompleted ? startModule(mod.id) : isCompleted ? startModule(mod.id) : null}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-emerald-100' : isLocked ? 'bg-gray-100' : 'bg-amber-100'}`}>
                                        {isCompleted ? <CheckCircle2 size={24} className="text-emerald-600" /> : isLocked ? <Lock size={24} className="text-gray-400" /> : <mod.icon size={24} className="text-amber-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-sm font-black ${isCompleted ? 'text-emerald-700' : isLocked ? 'text-gray-400' : 'text-gray-800'}`}>{mod.title}</h3>
                                            {mod.id === 'module5_exam' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">EXAM</span>}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">{mod.description}</p>
                                        <p className="text-xs text-gray-300 mt-0.5">{mod.duration}</p>
                                        {isCompleted && <p className="text-xs text-emerald-600 font-bold mt-1">Score: {score}%</p>}
                                    </div>
                                    {!isLocked && !isCompleted && <ChevronRight size={18} className="text-gray-300 shrink-0" />}
                                    {isCompleted && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold shrink-0">PASSED</span>}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default HelperTrainingPage;
