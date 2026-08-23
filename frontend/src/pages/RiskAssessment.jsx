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
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { API_BASE, apiCall } from '../api';

// Decomposed sub-components and data
import { questions, profiles } from '../components/risk/riskData';
import QuizStep from '../components/risk/QuizStep';
import ResultsPanel from '../components/risk/ResultsPanel';

const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
        </g>
    );
};

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
    const [activeIndex, setActiveIndex] = useState(-1);

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
            // 1. Save to Profile (Database Persistence)
            const profilePayload = {
                risk_score: totalScore,
                risk_profile: profile.name,
                investment_goal: goal,
                age: parseInt(age),
                income: parseInt(income)
            };
            
            await apiCall('/profile/save/', {
                method: 'POST',
                body: JSON.stringify(profilePayload)
            });

            // 2. Get AI Recommendations
            const recommendPayload = {
                Age: parseInt(age) || 25,
                Income: parseInt(income) || 700000,
                Risk_Tolerance: riskValue,
                Investment_Goal: goal
            };
            const res = await apiCall('/recommend/', {
                method: 'POST',
                body: JSON.stringify(recommendPayload)
            });
            const data = await res.json();
            if (data.Recommended_Stocks) {
                localStorage.setItem('ai_insights_data', JSON.stringify(data));
            }
        } catch (e) {
            console.error("Risk Assessment Persistence/AI Error", e);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const currentQuestion = questions[step];

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
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
                                    <h1 className="text-4xl font-extrabold text-notion-text leading-tight">
                                        {step < questions.length ? t('risk_assessment_title') : t('investor_profile')}
                                    </h1>
                                    <p className="text-notion-muted mt-2 text-lg">
                                        {t('step_of', { current: step + 1, total: questions.length + 1 })}
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
                                    <div className="space-y-6 ml-12">
                                        <h2 className="text-xl font-bold text-notion-text italic">
                                            "{t('investing_quote')}"
                                        </h2>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-notion-muted">{t('current_age')}</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-notion-emerald" />
                                                    <input
                                                        type="number"
                                                        placeholder={t('your_age')}
                                                        value={age}
                                                        onChange={e => setAge(e.target.value)}
                                                        className="w-full bg-notion-hover border-[0.5px] border-notion-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:bg-notion-bg focus:border-notion-text transition-all duration-200 font-bold text-notion-text"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-notion-muted">{t('annual_income')}</label>
                                                <div className="relative">
                                                    <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-notion-emerald" />
                                                    <input
                                                        type="number"
                                                        placeholder={t('annual_income_placeholder')}
                                                        value={income}
                                                        onChange={e => setIncome(e.target.value)}
                                                        className="w-full bg-notion-hover border-[0.5px] border-notion-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:bg-notion-bg focus:border-notion-text transition-all duration-200 font-bold text-notion-text"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-notion-muted">{t('primary_investment_objective')}</label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {['Wealth', 'Tax', 'Income'].map((g) => (
                                                        <button
                                                            key={g}
                                                            onClick={() => setGoal(g)}
                                                            className={`py-2.5 rounded-lg border-[0.5px] font-bold text-xs transition-all duration-200
                                                                ${goal === g ? 'border-notion-text bg-notion-text text-notion-bg' : 'border-notion-border bg-notion-hover text-notion-muted hover:text-notion-text'}`}
                                                        >
                                                            {t(`${g.toLowerCase()}_generation`)}
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
                                        className="flex items-center gap-1.5 text-notion-muted hover:text-notion-text disabled:opacity-30 font-semibold px-4 py-2 text-xs transition-colors duration-200"
                                    >
                                        <ArrowLeft size={16} /> {t('prev_step')}
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        disabled={(step < questions.length && !answers[step]) || (step === questions.length && (!age || !income))}
                                        className="stark-btn-primary !px-8 !py-3 rounded-lg font-bold flex items-center gap-2 group hover:scale-[1.02] transition-transform duration-200 disabled:opacity-50 disabled:pointer-events-none text-xs"
                                    >
                                        {step === questions.length ? (isLoadingAI ? t('mapping_ai_neural') : t('unlock_my_strategy')) : t('continue_phase')}
                                        {isLoadingAI ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />}
                                    </button>
                                </div>
                            </motion.div>

                            {/* Right: Preview Engine (5 cols) */}
                            <div className="lg:col-span-5 h-[500px] flex flex-col justify-center sticky top-24">
                                <div className="apple-glass apple-card-glow p-8 rounded-3xl relative overflow-hidden border border-notion-border/50 shadow-2xl">
                                    {/* Ambient Glow */}
                                    <div className="absolute top-[-20%] right-[-20%] w-[140%] h-[140%] bg-gradient-radial from-notion-emerald/5 to-transparent blur-[60px] -z-10 pointer-events-none" />

                                    <div className="absolute top-6 right-8 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-notion-emerald animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-notion-emerald bg-notion-emerald-bg px-2 py-0.5 rounded-full">{t('live_engine_analysis')}</span>
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
                                                        activeIndex={activeIndex}
                                                        activeShape={renderActiveShape}
                                                        onMouseEnter={(_, index) => setActiveIndex(index)}
                                                        onMouseLeave={() => setActiveIndex(-1)}
                                                    >
                                                        {draftAllocation.map((entry, idx) => (
                                                            <Cell key={idx} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                                                <span className="text-[10px] uppercase font-bold text-notion-muted">
                                                    {activeIndex !== -1 ? draftAllocation[activeIndex].name : t('draft_profile')}
                                                </span>
                                                <span className="text-2xl font-black text-notion-text mt-1">
                                                    {activeIndex !== -1 
                                                        ? `${draftAllocation[activeIndex].value}%` 
                                                        : (Object.keys(answers).length > 0 ? t('analyzing') : t('awaiting'))}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full mt-8 space-y-3">
                                            <div className="flex justify-between items-center px-4">
                                                <span className="text-xs font-bold text-notion-muted">{t('system_accuracy')}</span>
                                                <span className="text-xs font-bold text-notion-emerald">{Math.min(20 + step * 10, 98)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-notion-hover rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-notion-emerald"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(20 + step * 10, 98)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-center text-notion-muted leading-relaxed pt-2">
                                                {t('data_points_collected', { current: Object.keys(answers).length })} <br />
                                                {t('neural_network_status')}
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
