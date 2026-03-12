import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    ArrowLeft,
    Loader2,
    Clock,
    Wallet,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE } from '../api';

// Decomposed sub-components and data
import { questions, profiles } from '../components/risk/riskData';
import QuizStep from '../components/risk/QuizStep';
import ResultsPanel from '../components/risk/ResultsPanel';

const RiskAssessment = () => {
    const { t } = useTranslation();
    const { completeRiskAssessment } = useUser();

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
                                    <QuizStep
                                        question={currentQuestion}
                                        step={step}
                                        answers={answers}
                                        onOptionSelect={handleOptionSelect}
                                    />
                                ) : (
                                    <div className="space-y-8 ml-12">
                                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 italic">
                                            "Investing is more about temperament than intellect."
                                        </h2>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Current Age</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                                                    <input
                                                        type="number"
                                                        placeholder="Your Age"
                                                        value={age}
                                                        onChange={e => setAge(e.target.value)}
                                                        className="w-full bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-2xl pl-12 pr-6 py-4 text-lg focus:outline-none focus:border-emerald-500 transition-all font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Annual Income (₹)</label>
                                                <div className="relative">
                                                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                                                    <input
                                                        type="number"
                                                        placeholder="Annual Income"
                                                        value={income}
                                                        onChange={e => setIncome(e.target.value)}
                                                        className="w-full bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-2xl pl-12 pr-6 py-4 text-lg focus:outline-none focus:border-emerald-500 transition-all font-bold"
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
                                                                ${goal === g ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-neon-emerald' : 'border-gray-100 dark:border-white/5 text-gray-500'}`}
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
                                        className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 disabled:opacity-30 font-bold px-4 py-2"
                                    >
                                        <ArrowLeft size={18} /> Prev Step
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        disabled={(step < questions.length && !answers[step]) || (step === questions.length && (!age || !income))}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-extrabold shadow-xl shadow-emerald-600/20 flex items-center gap-2 group transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0"
                                    >
                                        {step === questions.length ? (isLoadingAI ? "Mapping AI Neural..." : "Unlock My Strategy") : "Continue Phase"}
                                        {isLoadingAI ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />}
                                    </button>
                                </div>
                            </motion.div>

                            {/* Right: Preview Engine (5 cols) */}
                            <div className="lg:col-span-5 h-[500px] flex flex-col justify-center sticky top-24">
                                <div className="glass-panel p-8 rounded-[2rem] border-2 border-dashed border-emerald-500/20 relative overflow-hidden">
                                    <div className="absolute top-4 right-8 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60">Live Engine Analysis</span>
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
                                                <span className="text-xs font-bold text-emerald-600">{Math.min(20 + step * 10, 98)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-emerald-600"
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
                        <ResultsPanel
                            riskProfile={riskProfile}
                            goal={goal}
                            isLoadingAI={isLoadingAI}
                        />
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default RiskAssessment;
