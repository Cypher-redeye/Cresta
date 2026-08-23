import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, BarChart3, Newspaper, Shield, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PredictiveChart from './PredictiveChart';
import InlineLoadingScreen from '../common/InlineLoadingScreen';
import { useLenis } from 'lenis/react';
import StockLogo from '../common/StockLogo';
import Logo from '../common/Logo';
import { useUser } from '../../context/UserContext';

const AIInsights = ({ delay, isLoading = false }) => {
    const [insights, setInsights] = useState([]);
    const [drawerStock, setDrawerStock] = useState(null);
    const [chartTicker, setChartTicker] = useState(null);
    const { t } = useTranslation();
    const lenis = useLenis();
    const { hasCompletedRiskAssessment } = useUser();

    // Lock background scrolling and stop Lenis smooth scroll when modal is open
    useEffect(() => {
        if (!drawerStock) return;

        // Stop Lenis global smooth scroll
        lenis?.stop();

        const mainEl = document.getElementById('dashboard-main');
        const layoutWrapper = mainEl?.closest('.flex-1.flex.flex-col');

        if (mainEl) mainEl.style.overflow = 'hidden';
        if (layoutWrapper) layoutWrapper.style.overflow = 'hidden';

        return () => {
            lenis?.start();
            if (mainEl) mainEl.style.overflow = '';
            if (layoutWrapper) layoutWrapper.style.overflow = '';
        };
    }, [drawerStock, lenis]);

    useEffect(() => {
        const loadInsights = () => {
            const localData = localStorage.getItem('ai_insights_data');
            if (localData) {
                try {
                    const data = JSON.parse(localData);
                    if (data.Recommended_Stocks && data.Recommended_Stocks.length > 0) {
                        const userClass = data.Assigned_Class || 'Moderate';
                        const newInsights = data.Recommended_Stocks.map((rec, index) => ({
                            id: `ai-rec-${index}`,
                            ticker: rec.Ticker,
                            name: rec.Name || rec.Ticker.replace('.NS', ''),
                            price: rec.Price || 0,
                            sector: rec.Sector || 'Market',
                            confidence: rec.Confidence || 70,
                            reasoning: rec.Reasoning || '',
                            headlines: rec.Headlines || [],
                            userClass: userClass,
                            xai: rec.xai || null,
                        }));
                        setInsights(newInsights);
                    }
                } catch (e) {
                    console.error("Error formatting insights", e);
                }
            } else {
                setInsights([]);
            }
        };

        loadInsights();

        // Listen for async updates (e.g. after login auto-fetch)
        const handleUpdate = () => loadInsights();
        window.addEventListener('ai_insights_updated', handleUpdate);
        return () => window.removeEventListener('ai_insights_updated', handleUpdate);
    }, []);

    const openDrawer = (stock) => {
        setDrawerStock(stock);
        setChartTicker(null);
    };

    const getConfidenceColor = (c) => {
        if (c >= 75) return 'text-notion-emerald bg-notion-emerald-bg border-notion-emerald/30';
        if (c >= 55) return 'text-notion-emerald bg-notion-emerald-bg border-notion-emerald/30';
        return 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
    };

    const getConfidenceLabel = (c) => {
        if (c >= 75) return t('strong_match');
        if (c >= 55) return t('good_match');
        return t('worth_watching');
    };

    const getSentimentDot = (s) => {
        if (s === 'positive') return '🟢';
        if (s === 'negative') return '🔴';
        return '🟡';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay }}
            className="apple-glass apple-card-glow p-6 md:p-8 rounded-3xl w-full flex flex-col shadow-lg border border-notion-border/50 relative overflow-hidden"
        >
            <style>
                {`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                `}
            </style>
            
            {/* Ambient Background Glow for the widget */}
            <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] bg-gradient-radial from-notion-emerald/5 to-transparent blur-[60px] -z-10 pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-xl font-extrabold text-notion-text flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-notion-emerald opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-notion-emerald shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    </span>
                    {t('ai_stock_advisor')}
                    <span className="text-xs font-bold text-notion-emerald bg-notion-emerald-bg px-2 py-0.5 rounded-full ml-2">({insights.length} {t('picks')})</span>
                </h3>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar relative z-10">
                <AnimatePresence mode='popLayout'>
                    {isLoading ? (
                        <div className="w-full flex items-center justify-center">
                            <InlineLoadingScreen text="Loading Insights..." subtext="Analyzing your portfolio" />
                        </div>
                    ) : insights.length === 0 ? (
                        hasCompletedRiskAssessment ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-40 w-full text-center border border-notion-border/50 rounded-2xl bg-notion-hover/30 apple-glass"
                            >
                                <div className="mb-4">
                                    <Logo width={48} height={48} animateDrawing={true} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                </div>
                                <p className="text-notion-text font-bold text-sm">Aggregating AI Insights...</p>
                                <p className="text-xs text-notion-muted mt-1 font-medium">Analyzing market sentiment and risk factors</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-40 w-full text-center border border-dashed border-notion-border rounded-2xl bg-notion-hover/30"
                            >
                                <AlertTriangle className="text-amber-500 mb-3" size={28} />
                                <p className="text-notion-text font-bold text-sm">{t('setup_required')}</p>
                                <p className="text-xs text-notion-muted mt-1 font-medium">{t('complete_risk_for_ai')}</p>
                            </motion.div>
                        )
                    ) : (
                        insights.map((stock) => (
                            <motion.div
                                key={stock.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="rounded-2xl apple-glass border border-notion-border/50 overflow-hidden transition-all duration-300 min-w-[280px] md:min-w-[320px] shrink-0 group hover:shadow-lg hover:border-notion-emerald/30 relative"
                            >
                                {/* Stock Header */}
                                <button
                                    onClick={() => openDrawer(stock)}
                                    className="w-full p-5 flex items-center gap-4 hover:bg-notion-hover/40 transition-all text-left relative overflow-hidden z-10 h-full"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-notion-emerald/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                    
                                    <div className="relative shrink-0">
                                        <div className="absolute inset-0 bg-notion-emerald/20 blur-md rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <StockLogo ticker={stock.ticker} name={stock.name} size={48} className="relative z-10 border border-notion-border/50 shadow-sm" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col items-start gap-1">
                                            <h4 className="font-extrabold text-notion-text text-[15px] leading-tight break-words pr-2">{stock.name}</h4>
                                            <span className={`w-fit mt-1 shrink-0 text-[10px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border ${getConfidenceColor(stock.confidence)} whitespace-nowrap`}>
                                                {getConfidenceLabel(stock.confidence)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2.5">
                                            <span className="text-sm font-bold text-notion-text tracking-tight">₹{stock.price.toLocaleString()}</span>
                                            <span className="w-1 h-1 rounded-full bg-notion-border"></span>
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-notion-muted">{stock.sector}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="p-2 rounded-full bg-notion-card border border-notion-border/80 transition-all duration-300 shadow-sm group-hover:translate-x-1 group-hover:bg-notion-emerald group-hover:text-white group-hover:border-notion-emerald">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                        </div>
                                    </div>
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* AI Insights Modal */}
            {createPortal(
            <AnimatePresence>
                {drawerStock && (
                    <>
                        {/* Drawer Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] cursor-pointer"
                            onClick={() => setDrawerStock(null)}
                        />
                        {/* Full Screen Modal Panel (Bottom Sheet on Mobile) */}
                        <motion.div
                            id="ai-modal-panel"
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 md:bottom-auto md:inset-6 lg:inset-8 max-w-7xl mx-auto bg-notion-card border border-notion-border rounded-t-3xl md:rounded-3xl z-[80] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-2xl flex flex-col overflow-hidden max-h-[90vh] md:max-h-[100vh]"
                        >
                            {/* Mobile Drag Handle */}
                            <div className="w-full flex justify-center pt-4 pb-2 md:hidden shrink-0 bg-notion-bg/50">
                                <div className="w-12 h-1.5 bg-notion-border rounded-full" />
                            </div>
                            
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between p-4 md:p-6 border-b border-notion-border bg-notion-bg/50 shrink-0">
                                <div className="flex items-center gap-4">
                                    <StockLogo ticker={drawerStock.ticker} name={drawerStock.name} size={48} className="shrink-0" />
                                    <div>
                                        <h3 className="text-xl font-bold text-notion-text tracking-tight leading-tight">{drawerStock.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm font-mono text-notion-muted">{drawerStock.ticker}</span>
                                            <span className="w-1 h-1 rounded-full bg-notion-border"></span>
                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getConfidenceColor(drawerStock.confidence)}`}>
                                                {getConfidenceLabel(drawerStock.confidence)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDrawerStock(null)}
                                    className="p-2 rounded-full hover:bg-notion-hover text-notion-muted hover:text-notion-text transition-colors self-start shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div id="ai-modal-content" data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 lg:p-8 custom-scrollbar" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                    <div className="lg:col-span-2 space-y-8 flex flex-col justify-start">
                                        {/* XAI: Sentiment Meter + Score Breakdown */}
                                {drawerStock.xai && (
                                    <div className="bg-notion-bg/50 dark:bg-black/20 rounded-2xl p-5 md:p-6 border border-notion-border/50 shadow-inner space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h5 className="text-xs font-bold uppercase tracking-widest text-notion-text flex items-center gap-2">
                                                <BarChart3 size={16} className="text-purple-500" /> {t('ai_score_breakdown')}
                                            </h5>
                                            <div className="flex items-center gap-3 text-[10px] md:text-xs text-notion-muted font-medium bg-notion-hover px-3 py-1.5 rounded-lg border border-notion-border">
                                                <span>β = {drawerStock.xai.beta}</span>
                                                <span className="text-notion-border">•</span>
                                                <span>Conf: {(drawerStock.xai.sentiment_confidence * 100).toFixed(0)}%</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Sentiment Meter */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-sm font-semibold">
                                                    <span className="text-red-400">{t('bearish')}</span>
                                                    <span className="text-xs px-3 py-1 rounded-full bg-notion-card border border-notion-border shadow-sm" style={{ color: drawerStock.xai.sentiment_score > 0.1 ? '#10b981' : drawerStock.xai.sentiment_score < -0.1 ? '#ef4444' : '#eab308' }}>
                                                        {drawerStock.xai.sentiment_score > 0 ? '+' : ''}{drawerStock.xai.sentiment_score.toFixed(2)}
                                                    </span>
                                                    <span className="text-emerald-400">{t('bullish')}</span>
                                                </div>
                                                <div className="w-full h-3 bg-notion-bg border border-notion-border/50 rounded-full relative overflow-hidden shadow-inner">
                                                    <div className="absolute inset-0 flex opacity-80">
                                                        <div className="w-1/2 bg-gradient-to-r from-red-500 to-yellow-500"></div>
                                                        <div className="w-1/2 bg-gradient-to-r from-yellow-500 to-emerald-500"></div>
                                                    </div>
                                                    <div
                                                        className="absolute top-0 w-3 h-3 rounded-full bg-white border-2 border-notion-card shadow-md transition-all duration-500"
                                                        style={{ left: `${Math.max(2, Math.min(96, (drawerStock.xai.sentiment_score + 1) * 50))}%`, transform: 'translateX(-50%)' }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Score Bars */}
                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    { label: t('sentiment'), pts: drawerStock.xai.sentiment_pts, max: 40, color: 'bg-emerald-500' },
                                                    { label: t('risk_fit'), pts: drawerStock.xai.risk_fit_pts, max: 40, color: 'bg-purple-500' },
                                                    { label: t('valuation'), pts: drawerStock.xai.valuation_pts, max: 20, color: 'bg-amber-500' },
                                                ].map((bar) => (
                                                    <div key={bar.label} className={`${bar.label === t('sentiment') ? 'col-span-2' : 'col-span-1'} space-y-2 bg-notion-card/50 p-4 rounded-xl border border-notion-border/30`}>
                                                        <div className="flex justify-between text-xs font-semibold">
                                                            <span className="text-notion-muted">{bar.label}</span>
                                                            <span className="text-notion-text">{bar.pts.toFixed(0)}<span className="text-notion-muted font-medium text-[10px]">/{bar.max}</span></span>
                                                        </div>
                                                        <div className="w-full h-2 bg-notion-bg border border-notion-border/50 rounded-full overflow-hidden shadow-inner">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${(bar.pts / bar.max) * 100}%` }}
                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                className={`h-full rounded-full ${bar.color}`}
                                                            ></motion.div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Why AI recommends this */}
                                <div className="bg-gradient-to-br from-notion-emerald-bg/50 to-transparent rounded-2xl p-5 md:p-6 border border-notion-emerald/20 shadow-sm relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-notion-emerald/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <h5 className="text-xs font-bold uppercase tracking-widest text-notion-emerald flex items-center gap-2 mb-4 relative z-10">
                                        <Shield size={16} /> {t('why_recommend')}
                                    </h5>
                                    <p className="text-[15px] text-notion-text leading-relaxed relative z-10">
                                        <span className="text-notion-muted">{t('based_on_risk_prefix')}</span> <span className="font-bold text-notion-emerald">{t(`profile_${drawerStock.userClass.toLowerCase()}`, drawerStock.userClass)}</span> <span className="text-notion-muted">{t('based_on_risk_suffix')}</span> {drawerStock.reasoning.charAt(0).toLowerCase() + drawerStock.reasoning.slice(1)}
                                    </p>
                                </div>

                                    </div>
                                    <div className="lg:col-span-3 flex flex-col gap-8">
                                        {/* Predictive Chart */}
                                        <div className="rounded-2xl overflow-hidden border border-notion-border/50 bg-black/20 flex flex-col h-[400px] shrink-0">
                                            <PredictiveChart symbol={drawerStock.ticker} />
                                        </div>

                                        {/* News Headlines */}
                                        {drawerStock.headlines && drawerStock.headlines.length > 0 && (
                                            <div className="bg-notion-bg/50 dark:bg-black/20 rounded-2xl p-5 md:p-6 border border-notion-border/50 shadow-inner">
                                                <h5 className="text-xs font-bold uppercase tracking-widest text-notion-text flex items-center gap-2 mb-5">
                                                    <Newspaper size={16} className="text-blue-500" /> {t('latest_news')}
                                                </h5>
                                                <div className="space-y-3">
                                                    {drawerStock.headlines.map((hl, i) => (
                                                        <div key={i} className="flex items-start gap-3 group/news hover:bg-notion-card p-3 -mx-3 rounded-xl transition-colors cursor-default border border-transparent hover:border-notion-border/50">
                                                            <span className={`shrink-0 mt-0.5 text-[10px] p-1.5 rounded-full flex items-center justify-center bg-notion-bg border border-notion-border`}>
                                                                {getSentimentDot(hl.sentiment)}
                                                            </span>
                                                            <span className="text-sm text-notion-muted group-hover/news:text-notion-text transition-colors leading-relaxed">{hl.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>, document.body)}
        </motion.div>
    );
};

export default AIInsights;
