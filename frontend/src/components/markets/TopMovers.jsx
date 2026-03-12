import React from 'react';

/**
 * Tabbed gainers/losers table with skeleton loading state.
 */
const TopMovers = ({ selectedTab, setSelectedTab, currentMovers, moversLoading, t }) => {
    return (
        <div className="glass-panel rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-fintech-card/50">
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex gap-6">
                <button
                    onClick={() => setSelectedTab('gainers')}
                    className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${selectedTab === 'gainers' || selectedTab === 'overview' ? 'text-fintech-emerald dark:text-neon-emerald border-fintech-emerald dark:border-neon-emerald' : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    {t('top_gainers')}
                </button>
                <button
                    onClick={() => setSelectedTab('losers')}
                    className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${selectedTab === 'losers' ? 'text-fintech-emerald dark:text-neon-emerald border-fintech-emerald dark:border-neon-emerald' : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    {t('top_losers')}
                </button>
            </div>

            <div className="p-4">
                {moversLoading ? (
                    // Skeleton loading
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse flex justify-between items-center py-4">
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
                                </div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                            </div>
                        ))}
                    </div>
                ) : currentMovers.length > 0 ? (
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <th className="pb-4">{t('company')}</th>
                                <th className="pb-4 text-right">{t('price')}</th>
                                <th className="pb-4 text-right">{t('change')}</th>
                                <th className="pb-4 text-right hidden sm:table-cell">{t('volume')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            {currentMovers.map((stock, idx) => (
                                <tr key={stock.symbol || idx} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                                    <td className="py-4">
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">{stock.symbol}</div>
                                            <div className="text-xs text-gray-500">{stock.name}</div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-right font-medium text-gray-900 dark:text-white">₹{stock.price?.toFixed(2)}</td>
                                    <td className={`py-4 text-right font-bold ${stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {stock.change > 0 ? '+' : ''}{stock.change}%
                                    </td>
                                    <td className="py-4 text-right text-gray-500 hidden sm:table-cell">{stock.volume}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {selectedTab === 'gainers' ? t('no_gainers_data') : t('no_losers_data')}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{t('backend_not_running')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopMovers;
