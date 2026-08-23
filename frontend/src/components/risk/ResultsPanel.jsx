import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Displays the risk assessment results with profile classification,
 * strategy overview, allocation bars, and navigation to dashboard.
 */
const ResultsPanel = ({ riskProfile, goal, isLoadingAI }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-5xl mx-auto py-12"
        >
            <div className="text-center mb-12">
                <span className="px-4 py-1.5 rounded-full bg-notion-emerald-bg text-notion-emerald text-xs font-black uppercase tracking-widest border border-notion-emerald/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">{t('analysis_complete')}</span>
                <h1 className="text-5xl font-black text-notion-text mt-4 tracking-tight apple-display">{t('your_investor_dna')}</h1>
                <p className="text-notion-muted mt-2 text-xl font-medium">{t('mapped_mindset')}</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 apple-glass apple-card-glow p-12 rounded-[3rem] border border-notion-border/50 relative overflow-hidden shadow-2xl">
                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-gradient-radial from-notion-emerald/5 to-transparent blur-[80px] -z-10 pointer-events-none" />

                <div className="space-y-10 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className={`p-6 rounded-3xl bg-opacity-10 apple-glass border border-notion-border/50 shadow-sm`} style={{ backgroundColor: riskProfile.color ? riskProfile.color + '20' : 'transparent' }}>
                            <riskProfile.icon size={48} style={{ color: riskProfile.color }} />
                        </div>
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-notion-muted mb-1">{t('primary_classification')}</h2>
                            <div className="text-4xl font-black apple-display" style={{ color: riskProfile.color }}>{riskProfile.label}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-notion-text">{t('strategy_overview')}</h3>
                        <p className="text-notion-muted text-lg leading-relaxed font-medium">
                            {t(riskProfile.descriptionKey)}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl apple-glass border border-notion-border/50 hover:border-notion-emerald/30 transition-colors">
                            <div className="text-[10px] font-bold text-notion-muted uppercase tracking-wider mb-1">{t('risk_level')}</div>
                            <div className="font-bold text-notion-text">{t('moderate_high')}</div>
                        </div>
                        <div className="p-5 rounded-2xl apple-glass border border-notion-border/50 hover:border-notion-emerald/30 transition-colors">
                            <div className="text-[10px] font-bold text-notion-muted uppercase tracking-wider mb-1">{t('volatility_class')}</div>
                            <div className="font-bold text-notion-text">{t('volatility_class_value')}</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 relative z-10">
                    <div className="apple-glass rounded-[2rem] p-8 border border-notion-border/50 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                        <h3 className="text-lg font-bold text-notion-text mb-6 flex items-center justify-between relative z-10">
                            {t('ai_proposed_allocation')}
                            <span className="text-[10px] font-bold text-notion-emerald bg-notion-emerald-bg px-2.5 py-1 rounded-full uppercase tracking-wider">{t('optimized_for', { goal })}</span>
                        </h3>
                        <div className="space-y-5 relative z-10">
                            {riskProfile.allocation.map((item, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-notion-text">{item.name}</span>
                                        <span className="text-notion-text bg-notion-hover px-2 py-0.5 rounded border border-notion-border">{item.value}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-notion-bg border border-notion-border/50 rounded-full overflow-hidden shadow-inner">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: item.color }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.value}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/dashboard')}
                        disabled={isLoadingAI}
                        className="w-full stark-btn-primary py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
                    >
                        {isLoadingAI ? t('finalizing_ai_logic') : t('go_to_dashboard')}
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ResultsPanel;
