import React from 'react';
import StockLogo from '../common/StockLogo';
import Logo from '../common/Logo';

/**
 * Tabbed gainers/losers table with skeleton loading state.
 */
const TopMovers = ({ selectedTab, setSelectedTab, currentMovers, moversLoading, t }) => {
    return (
        <div className="apple-glass rounded-3xl border border-notion-border/50 overflow-hidden shadow-lg relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-[-50%] left-[20%] w-[60%] h-[150%] bg-gradient-radial from-notion-emerald/5 to-transparent blur-[60px] -z-10 pointer-events-none" />

            <div className="p-5 md:p-6 border-b border-notion-border/60 flex gap-8 relative z-10">
                <button
                    onClick={() => setSelectedTab('gainers')}
                    className={`pb-2 text-sm font-bold transition-all border-b-2 tracking-wide uppercase ${selectedTab === 'gainers' || selectedTab === 'overview' ? 'text-notion-emerald border-notion-emerald' : 'text-notion-muted border-transparent hover:text-notion-text'}`}
                >
                    {t('top_gainers')}
                </button>
                <button
                    onClick={() => setSelectedTab('losers')}
                    className={`pb-2 text-sm font-bold transition-all border-b-2 tracking-wide uppercase ${selectedTab === 'losers' ? 'text-red-500 border-red-500' : 'text-notion-muted border-transparent hover:text-notion-text'}`}
                >
                    {t('top_losers')}
                </button>
            </div>

            <div className="p-4">
                {moversLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Logo width={48} height={48} animateDrawing={true} className="mb-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <p className="text-notion-muted text-sm font-medium">Loading market data...</p>
                    </div>
                ) : currentMovers.length > 0 ? (
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-notion-muted uppercase tracking-wider border-b border-notion-border">
                                <th className="pb-4">{t('company')}</th>
                                <th className="pb-4 text-right">{t('price')}</th>
                                <th className="pb-4 text-right">{t('change')}</th>
                                <th className="pb-4 text-right hidden sm:table-cell">{t('volume')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-notion-border">
                             {currentMovers.map((stock, idx) => (
                                <tr key={stock.symbol || idx} className="hover:bg-notion-hover/50 transition-colors group cursor-pointer border-b border-notion-border">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <StockLogo ticker={stock.symbol} name={stock.name} size={32} />
                                            <div>
                                                <div className="font-bold text-notion-text">{stock.symbol}</div>
                                                <div className="text-xs text-notion-muted">{stock.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-right font-medium text-notion-text">₹{stock.price?.toFixed(2)}</td>
                                    <td className={`py-4 text-right font-bold ${stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {stock.change > 0 ? '+' : ''}{stock.change}%
                                    </td>
                                    <td className="py-4 text-right text-notion-muted hidden sm:table-cell">{stock.volume}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-notion-muted text-sm">
                            {selectedTab === 'gainers' ? t('no_gainers_data') : t('no_losers_data')}
                        </p>
                        <p className="text-xs text-notion-muted mt-1">{t('backend_not_running')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopMovers;
