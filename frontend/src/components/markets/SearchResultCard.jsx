import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, BarChart2 } from 'lucide-react';
import PredictiveChart from '../dashboard/PredictiveChart';
import StockLogo from '../common/StockLogo';

/**
 * Displays the search result card with stock info, AI suggestion,
 * confidence bar, reasoning, and inline forecast chart toggle.
 */
const SearchResultCard = ({
    searchResult,
    user,
    showSearchChart,
    setShowSearchChart,
    t,
}) => {
    if (!searchResult) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320, mass: 0.8 }}
            style={{ willChange: 'transform, opacity' }}
            className="apple-glass apple-card-glow p-8 md:p-10 mb-8 rounded-3xl relative overflow-hidden shadow-2xl border border-notion-border/50 z-10"
        >
            <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] bg-gradient-radial from-notion-emerald/5 to-transparent blur-[80px] -z-10 pointer-events-none" />
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="w-24 h-24 text-fintech-emerald dark:text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-notion-text mb-2">{t('search_result')}</h2>
            <div className="flex flex-wrap items-center gap-8">
                <div className="flex items-center gap-4">
                    <StockLogo ticker={searchResult.symbol} name={searchResult.name} size={48} />
                    <div>
                        <div className="text-sm text-notion-muted">{t('symbol')}</div>
                        <div className="text-2xl font-bold text-notion-emerald">{searchResult.symbol}</div>
                        <div className="text-sm text-notion-text">{searchResult.name}</div>
                    </div>
                </div>
                <div>
                    <div className="text-sm text-notion-muted">{t('price')}</div>
                    <div className="text-2xl font-bold text-notion-text">₹{searchResult.price}</div>
                </div>
                <div>
                    <div className="text-sm text-notion-muted">{t('change')}</div>
                    <div className={`text-xl font-bold ${searchResult.change_percent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {searchResult.change_percent}%
                    </div>
                </div>
                <div>
                    <div className="text-sm text-notion-muted">{t('volume')}</div>
                    <div className="text-xl font-bold text-notion-text">{searchResult.volume.toLocaleString()}</div>
                </div>
                {searchResult.suggestion && user ? (
                    <div>
                        <div className="text-sm text-notion-muted">{t('ai_suggestion')}</div>
                        <div className={`text-lg font-bold px-3 py-1 rounded-lg inline-block ${searchResult.suggestion === 'Buy'
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                            : searchResult.suggestion === 'Avoid'
                                ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                            }`}>
                            {searchResult.suggestion}
                        </div>
                    </div>
                ) : searchResult.suggestion && (
                    <div className="flex flex-col items-center justify-center p-3 bg-notion-hover rounded-xl border border-notion-border blur-[2px] select-none cursor-not-allowed group relative">
                        <div className="text-xs text-notion-muted">{t('ai_insight')}</div>
                        <div className="text-lg font-bold">{t('locked')}</div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 blur-0 rounded-xl z-10 p-2 text-center pointer-events-none">
                            <span className="text-[10px] text-white leading-tight">{t('login_unlock_ai')}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Confidence / Reasoning */}
            {searchResult.suggestion && user && (searchResult.confidence || searchResult.reasoning) && (
                <div className="mt-4 pt-4 border-t border-notion-border">
                    {searchResult.confidence && (
                        <div className="flex items-center gap-3 mb-2">
                            <div className="text-xs font-bold text-notion-muted uppercase tracking-wider">{t('ai_confidence', 'AI Confidence')}</div>
                            <div className="flex-1 h-2 bg-notion-bg border border-notion-border rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${searchResult.confidence >= 60 ? 'bg-emerald-500' :
                                        searchResult.confidence >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${searchResult.confidence}%` }}
                                />
                            </div>
                            <span className={`text-sm font-bold ${searchResult.confidence >= 60 ? 'text-emerald-600 dark:text-emerald-400' :
                                searchResult.confidence >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                                }`}>{searchResult.confidence}%</span>
                        </div>
                    )}
                    {searchResult.reasoning && (
                        <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-notion-muted uppercase tracking-wider shrink-0 mt-0.5">{t('why_label')}</span>
                            <p className="text-xs text-notion-muted leading-relaxed italic">
                                "{searchResult.reasoning}"
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* View Forecast Button */}
            {user && (
                <div className="mt-4">
                    <button
                        onClick={() => setShowSearchChart(!showSearchChart)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${showSearchChart
                            ? 'bg-notion-emerald-bg text-notion-emerald border border-notion-emerald/30'
                            : 'bg-notion-hover text-notion-text border border-notion-border hover:border-notion-emerald/30'
                            }`}
                    >
                        <BarChart2 size={16} />
                        {showSearchChart ? t('hide_forecast', 'Hide Forecast') : t('view_forecast', 'View Growth Forecast')}
                    </button>
                </div>
            )}

            {/* Inline Prediction Chart */}
            {showSearchChart && searchResult && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                >
                    <PredictiveChart
                        symbol={searchResult.symbol?.replace('.NS', '').replace('.BO', '')}
                        onClose={() => setShowSearchChart(false)}
                    />
                </motion.div>
            )}
        </motion.div>
    );
};

export default SearchResultCard;
