import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, BarChart2 } from 'lucide-react';
import PredictiveChart from '../dashboard/PredictiveChart';

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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-900/10 backdrop-blur-xl mb-6 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="w-24 h-24 text-fintech-emerald dark:text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('search_result')}</h2>
            <div className="flex flex-wrap items-center gap-8">
                <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('symbol')}</div>
                    <div className="text-2xl font-bold text-fintech-emerald dark:text-neon-emerald">{searchResult.symbol}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{searchResult.name}</div>
                </div>
                <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('price')}</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">₹{searchResult.price}</div>
                </div>
                <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('change')}</div>
                    <div className={`text-xl font-bold ${searchResult.change_percent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {searchResult.change_percent}%
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('volume')}</div>
                    <div className="text-xl font-bold text-gray-700 dark:text-gray-300">{searchResult.volume.toLocaleString()}</div>
                </div>
                {searchResult.suggestion && user ? (
                    <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('ai_suggestion')}</div>
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
                    <div className="flex flex-col items-center justify-center p-3 bg-gray-500/10 rounded-xl border border-white/10 blur-[2px] select-none cursor-not-allowed group relative">
                        <div className="text-xs text-gray-500">{t('ai_insight')}</div>
                        <div className="text-lg font-bold">{t('locked')}</div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 blur-0 rounded-xl z-10 p-2 text-center pointer-events-none">
                            <span className="text-[10px] text-white leading-tight">{t('login_unlock_ai')}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Confidence / Reasoning */}
            {searchResult.confidence && user && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('ai_confidence', 'AI Confidence')}</div>
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
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
                    {searchResult.reasoning && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                            "{searchResult.reasoning}"
                        </p>
                    )}
                </div>
            )}

            {/* View Forecast Button */}
            {user && (
                <div className="mt-4">
                    <button
                        onClick={() => setShowSearchChart(!showSearchChart)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${showSearchChart
                            ? 'bg-fintech-emerald/20 dark:bg-emerald-500/20 text-fintech-emerald dark:text-emerald-400 border border-fintech-emerald/30 dark:border-emerald-500/30'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-fintech-emerald/30 dark:hover:border-emerald-500/30'
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
                        symbol={searchResult.symbol?.replace('.NS', '')}
                        onClose={() => setShowSearchChart(false)}
                    />
                </motion.div>
            )}
        </motion.div>
    );
};

export default SearchResultCard;
