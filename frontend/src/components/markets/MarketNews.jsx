import React from 'react';
import { Clock } from 'lucide-react';

/**
 * News feed column showing personalized or general market news
 * with publisher, timestamp, and headline links.
 */
const MarketNews = ({ news, newsLoading, user, t }) => {
    return (
        <div className="glass-panel p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-fintech-card/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-fintech-cyan dark:text-cyan-500" /> {user ? t('personalized_news') : t('market_news')}
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {newsLoading ? (
                    [1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse space-y-2">
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        </div>
                    ))
                ) : news.length > 0 ? (
                    news.map((item, i) => (
                        <div key={i} className="group cursor-pointer border-b border-gray-100 dark:border-white/5 pb-4 last:border-0">
                            <div className="flex justify-between items-center mb-1">
                                <div className="text-[10px] text-fintech-cyan dark:text-neon-cyan font-bold uppercase tracking-wider">{item.publisher}</div>
                                <div className="text-[10px] text-gray-400">
                                    {item.time ? new Date(item.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('just_now')}
                                </div>
                            </div>
                            <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-fintech-cyan dark:group-hover:text-neon-cyan transition-colors line-clamp-2"
                            >
                                {item.title}
                            </a>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 text-sm">{t('no_news_available')}</p>
                    </div>
                )}
            </div>
            <button className="w-full mt-6 py-2 text-sm text-fintech-cyan dark:text-neon-cyan font-medium border border-fintech-cyan/30 dark:border-neon-cyan/30 rounded-lg hover:bg-fintech-cyan/5 dark:hover:bg-neon-cyan/10 transition-colors">
                {t('read_more')}
            </button>
        </div>
    );
};

export default MarketNews;
