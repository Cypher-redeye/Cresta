import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    AlertTriangle,
    Loader2,
    TrendingUp,
    Shield,
    Zap,
    Clock,
    Wallet,
    Info,
    Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE } from '../api';

const RiskAssessment = () => {
    const { t } = useTranslation();
    const { completeRiskAssessment } = useUser();
    const navigate = useNavigate();

    const questions = [
        {
            id: 1,
            question: "What is your primary investment goal?",
            description: "Knowing your 'Why' helps us determine the 'How'.",
            options: [
                { text: "Preserving Capital (Keep what I have safe)", score: 1 },
                { text: "Stable Income (Regular payouts)", score: 2 },
                { text: "Balanced Growth (Mix of safety and growth)", score: 3 },
                { text: "Maximizing Wealth (High growth focus)", score: 4 }
            ]
        },
        {
            id: 2,
            question: "How long do you plan to hold your investments?",
            description: "Time in the market beats timing the market.",
            options: [
                { text: "Less than 2 years (Short term)", score: 1 },
                { text: "2 to 5 years (Medium term)", score: 2 },
                { text: "5 to 10 years (Long term)", score: 3 },
                { text: "More than 10 years (Strategic)", score: 4 }
            ]
        },
        {
            id: 3,
            question: "If your portfolio dropped 10% in a month, how would you react?",
            description: "Your emotional reaction to loss defines your risk tolerance.",
            options: [
                { text: "Sell everything immediately to stop losses", score: 1 },
                { text: "Sell a portion to reduce exposure", score: 2 },
                { text: "Hold and wait for recovery", score: 3 },
                { text: "Buy more at a 'discounted' price", score: 4 }
            ]
        },
        {
            id: 4,
            question: "How would you describe your investment experience?",
            description: "Familiarity with market cycles reduces panic.",
            options: [
                { text: "Beginner (Just starting out)", score: 1 },
                { text: "Intermediate (I have some individual stocks)", score: 2 },
                { text: "Advanced (I understand technicals and macro)", score: 3 },
                { text: "Professional (Trading for years)", score: 4 }
            ]
        },
        {
            id: 5,
            question: "What is your annual income and stability?",
            description: "Steady income allows for higher risk-taking.",
            options: [
                { text: "Fixed/Retired (Need safety above all)", score: 1 },
                { text: "Moderate (Stable but limited surplus)", score: 2 },
                { text: "High (Good surplus after expenses)", score: 3 },
                { text: "Very High & Growing (Significant surplus)", score: 4 }
            ]
        },
        {
            id: 6,
            question: "How much of your savings are you investing now?",
            description: "Exposure management is key to survival.",
            options: [
                { text: "Less than 10% (Just testing the waters)", score: 1 },
                { text: "10% to 30% (Standard allocation)", score: 2 },
                { text: "30% to 60% (Serious wealth building)", score: 3 },
                { text: "More than 60% (High conviction)", score: 4 }
            ]
        },
        {
            id: 7,
            question: "Do you have dependable sources of financial backup?",
            description: "Safety nets provide the courage to stay invested.",
            options: [
                { text: "No, this is my primary savings pool", score: 1 },
                { text: "I have a small emergency fund", score: 2 },
                { text: "Yes, I have insurance and emergency funds", score: 3 },
                { text: "I have multiple assets and safety nets", score: 4 }
            ]
        },
        {
            id: 8,
            question: "What is your stance on inflation vs. market risk?",
            description: "Choosing between certain decay or potential volatility.",
            options: [
                { text: "I prefer 100% safety, even if I lose value to inflation", score: 1 },
                { text: "I want to beat inflation with minimal risk", score: 2 },
                { text: "I am okay with volatility to beat inflation significantly", score: 3 },
                { text: "I want maximum returns and can handle high volatility", score: 4 }
            ]
        }
    ];

    const profiles = {
        conservative: {
            id: 'conservative',
            label: "Conservative",
            icon: Shield,
            color: '#10B981',
            description: "You prioritize capital preservation over growth. Typically suited for long-term safety or short horizons.",
            allocation: [
                { name: 'Fixed Income', value: 60, color: '#10B981' },
                { name: 'Corporate Debt', value: 20, color: '#3B82F6' },
                { name: 'Blue Chips', value: 15, color: '#F59E0B' },
                { name: 'Cash/Gold', value: 5, color: '#FCD34D' }
            ]
        },
        balanced: {
            id: 'balanced',
            label: "Balanced",
            icon: Zap,
            color: '#F59E0B',
            description: "A moderate approach seeking reasonable growth while accepting moderate market fluctuations.",
            allocation: [
                { name: 'Large Cap', value: 40, color: '#3B82F6' },
                { name: 'Mid Cap', value: 20, color: '#8B5CF6' },
                { name: 'Debt/Bonds', value: 30, color: '#10B981' },
                { name: 'Gold/ETF', value: 10, color: '#FCD34D' }
            ]
        },
        aggressive: {
            id: 'aggressive',
            label: "Aggressive",
            icon: TrendingUp,
            color: '#EC4899',
            description: "You seek maximum wealth creation and are comfortable with high volatility and market dips.",
            allocation: [
                { name: 'Small Cap', value: 30, color: '#EC4899' },
                { name: 'Mid Cap', value: 30, color: '#8B5CF6' },
                { name: 'Large Cap', value: 30, color: '#3B82F6' },
                { name: 'Sector/Speculative', value: 10, color: '#06B6D4' }
            ]
        }
    };

    const TOTAL_STEPS = questions.length + 2; // Questions + Profile Details + Results
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [age, setAge] = useState('');
    const [income, setIncome] = useState('');
    const [goal, setGoal] = useState('Wealth');
    const [showResult, setShowResult] = useState(false);
    const [riskProfile, setRiskProfile] = useState(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    // Calculate dynamic "Draft Allocation" preview
    const draftAllocation = useMemo(() => {
        const scoresArr = Object.values(answers);
        if (scoresArr.length === 0) return profiles.balanced.allocation;

        const avgScore = scoresArr.reduce((a, b) => a + b, 0) / scoresArr.length;
        if (avgScore <= 1.5) return profiles.conservative.allocation;
        if (avgScore >= 3.0) return profiles.aggressive.allocation;
        return profiles.balanced.allocation;
    }, [answers]);

    const handleOptionSelect = (score) => {
        setAnswers({ ...answers, [step]: score });
        // Auto-advance for better UX on questions
        setTimeout(() => {
            if (step < questions.length - 1) setStep(step + 1);
        }, 300);
    };

    const handleNext = () => {
        if (step < TOTAL_STEPS - 2) {
            setStep(step + 1);
        } else {
            calculateResult();
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const calculateResult = async () => {
        const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
        let profile = profiles.balanced;
        let riskValue = 3;

        // Mapping 8-32 score to 1-5 Risk Tolerance for AI
        // 8-12 -> 1, 13-18 -> 2, 19-24 -> 3, 25-28 -> 4, 29-32 -> 5
        if (totalScore <= 12) { profile = profiles.conservative; riskValue = 1; }
        else if (totalScore <= 18) { profile = profiles.conservative; riskValue = 2; }
        else if (totalScore <= 24) { profile = profiles.balanced; riskValue = 3; }
        else if (totalScore <= 28) { profile = profiles.aggressive; riskValue = 4; }
        else { profile = profiles.aggressive; riskValue = 5; }

        setRiskProfile(profile);
        setShowResult(true);
        completeRiskAssessment();
        setIsLoadingAI(true);

        try {
            const payload = {
                Age: parseInt(age) || 25,
                Income: parseInt(income) || 700000,
                Risk_Tolerance: riskValue,
                Investment_Goal: goal
            };
            const res = await fetch(`${API_BASE}/recommend/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.Recommended_Stocks) {
                localStorage.setItem('ai_insights_data', JSON.stringify(data));
            }
        } catch (e) {
            console.error("AI Insights Error", e);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const currentQuestion = questions[step];

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <AnimatePresence mode="wait">
                    {!showResult ? (
                        <div className="grid lg:grid-cols-12 gap-12 items-center min-h-[70vh]">
                            {/* Left: Questionnaire (7 cols) */}
                            <motion.div
                                key={`content-${step}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="lg:col-span-7 space-y-8"
                            >
                                <div>
                                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                                        {step < questions.length ? "Risk Assessment" : "Investor Profile"}
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                                        Step {step + 1} of {questions.length + 1}
                                    </p>
                                </div>

                                {step < questions.length ? (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-start gap-4">
                                                <span className="w-8 h-8 rounded-full bg-cyan-600/10 text-cyan-600 flex items-center justify-center text-sm shrink-0 mt-1">
                                                    {step + 1}
                                                </span>
                                                {currentQuestion.question}
                                            </h2>
                                            <p className="text-gray-500 dark:text-gray-400 ml-12 text-sm italic italic flex items-center gap-2">
                                                <Info className="w-3 h-3" /> {currentQuestion.description}
                                            </p>
                                        </div>

                                        <div className="grid gap-4 ml-12">
                                            {currentQuestion.options.map((option, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleOptionSelect(option.score)}
                                                    className={`group p-5 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden
                                                        ${answers[step] === option.score
                                                            ? 'border-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/10'
                                                            : 'border-gray-200 dark:border-white/5 hover:border-cyan-500/40 bg-white/50 dark:bg-fintech-card/30'}`}
                                                >
                                                    <div className="flex justify-between items-center relative z-10">
                                                        <span className={`font-semibold text-lg ${answers[step] === option.score ? 'text-cyan-600 dark:text-neon-cyan' : 'text-gray-700 dark:text-gray-300'}`}>
                                                            {option.text}
                                                        </span>
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                                            ${answers[step] === option.score ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-gray-300 dark:border-white/10'}`}>
                                                            {answers[step] === option.score && <Check className="w-4 h-4" />}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 ml-12">
                                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 italic">
                                            "Investing is more about temperament than intellect."
                                        </h2>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Current Age</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
                                                    <input
                                                        type="number"
                                                        placeholder="Your Age"
                                                        value={age}
                                                        onChange={e => setAge(e.target.value)}
                                                        className="w-full bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-2xl pl-12 pr-6 py-4 text-lg focus:outline-none focus:border-cyan-500 transition-all font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Annual Income (₹)</label>
                                                <div className="relative">
                                                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
                                                    <input
                                                        type="number"
                                                        placeholder="Annual Income"
                                                        value={income}
                                                        onChange={e => setIncome(e.target.value)}
                                                        className="w-full bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-2xl pl-12 pr-6 py-4 text-lg focus:outline-none focus:border-cyan-500 transition-all font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Primary Investment Objective</label>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {['Wealth', 'Tax', 'Income'].map((g) => (
                                                        <button
                                                            key={g}
                                                            onClick={() => setGoal(g)}
                                                            className={`py-4 rounded-2xl border-2 font-bold transition-all
                                                                ${goal === g ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-neon-cyan' : 'border-gray-100 dark:border-white/5 text-gray-500'}`}
                                                        >
                                                            {g} Generation
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-10 ml-12 flex justify-between items-center">
                                    <button
                                        onClick={handleBack}
                                        disabled={step === 0}
                                        className="flex items-center gap-2 text-gray-500 hover:text-cyan-600 disabled:opacity-30 font-bold px-4 py-2"
                                    >
                                        <ArrowLeft size={18} /> Prev Step
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        disabled={(step < questions.length && !answers[step]) || (step === questions.length && (!age || !income))}
                                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-10 py-4 rounded-2xl font-extrabold shadow-xl shadow-cyan-600/20 flex items-center gap-2 group transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0"
                                    >
                                        {step === questions.length ? (isLoadingAI ? "Mapping AI Neural..." : "Unlock My Strategy") : "Continue Phase"}
                                        {isLoadingAI ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />}
                                    </button>
                                </div>
                            </motion.div>

                            {/* Right: Preview Engine (5 cols) */}
                            <div className="lg:col-span-5 h-[500px] flex flex-col justify-center sticky top-24">
                                <div className="glass-panel p-8 rounded-[2rem] border-2 border-dashed border-cyan-500/20 relative overflow-hidden">
                                    <div className="absolute top-4 right-8 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600/60">Live Engine Analysis</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <div className="w-64 h-64 relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={draftAllocation}
                                                        cx="50%" cy="50%"
                                                        innerRadius={70}
                                                        outerRadius={100}
                                                        paddingAngle={8}
                                                        dataKey="value"
                                                        stroke="none"
                                                    >
                                                        {draftAllocation.map((entry, idx) => (
                                                            <Cell key={idx} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-[10px] uppercase font-bold text-gray-500">Draft Profile</span>
                                                <span className="text-2xl font-black text-gray-800 dark:text-white">
                                                    {Object.keys(answers).length > 0 ? "Analyzing" : "Awaiting"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full mt-8 space-y-3">
                                            <div className="flex justify-between items-center px-4">
                                                <span className="text-xs font-bold text-gray-500">System Accuracy</span>
                                                <span className="text-xs font-bold text-cyan-600">{Math.min(20 + step * 10, 98)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-cyan-600"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(20 + step * 10, 98)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-center text-gray-400 leading-relaxed pt-2">
                                                Current data points collected: {Object.keys(answers).length} of 8. <br />
                                                Neural network status: Optimization Active.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-5xl mx-auto py-12"
                        >
                            <div className="text-center mb-12">
                                <span className="px-4 py-1.5 rounded-full bg-cyan-600/10 text-cyan-600 text-xs font-black uppercase tracking-widest border border-cyan-600/20">Analysis Complete</span>
                                <h1 className="text-5xl font-black text-gray-900 dark:text-white mt-4 tracking-tight">Your Investor DNA</h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 text-xl">We've mapped your mindset to our core strategies.</p>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-12 bg-white/50 dark:bg-fintech-card/30 p-12 rounded-[3rem] border-2 border-gray-100 dark:border-white/5 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
                                <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-600/20 blur-[120px] rounded-full"></div>
                                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/20 blur-[120px] rounded-full"></div>

                                <div className="space-y-10 relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className={`p-6 rounded-3xl bg-opacity-10`} style={{ backgroundColor: riskProfile.color }}>
                                            <riskProfile.icon size={48} style={{ color: riskProfile.color }} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Primary Classification</h2>
                                            <div className="text-4xl font-black" style={{ color: riskProfile.color }}>{riskProfile.label}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Strategy Overview</h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                                            {riskProfile.description}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-white/40 dark:bg-black/20 border border-gray-100 dark:border-white/5">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Risk Level</div>
                                            <div className="font-bold text-gray-800 dark:text-white">Moderate-High</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/40 dark:bg-black/20 border border-gray-100 dark:border-white/5">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Volatility Class</div>
                                            <div className="font-bold text-gray-800 dark:text-white">II (Structural)</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8 relative z-10">
                                    <div className="bg-white/60 dark:bg-black/30 rounded-[2rem] p-8 border border-white/20 shadow-xl">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center justify-between">
                                            AI-Proposed Allocation
                                            <span className="text-[10px] font-normal text-gray-400 italic">Optimized for {goal}</span>
                                        </h3>
                                        <div className="space-y-4">
                                            {riskProfile.allocation.map((item, idx) => (
                                                <div key={idx} className="space-y-1.5">
                                                    <div className="flex justify-between items-center text-sm font-bold">
                                                        <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                                                        <span className="text-gray-900 dark:text-white">{item.value}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full"
                                                            style={{ backgroundColor: item.color }}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${item.value}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        disabled={isLoadingAI}
                                        className="w-full bg-gray-900 dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-2xl disabled:opacity-50"
                                    >
                                        {isLoadingAI ? "Finalizing AI Logic..." : "Go to Dashboard"}
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default RiskAssessment;
