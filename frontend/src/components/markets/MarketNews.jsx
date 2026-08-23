import React from 'react';
import { ExternalLink, Clock } from 'lucide-react';
import InlineLoadingScreen from '../common/InlineLoadingScreen';

/**
 * News feed column showing personalized or general market news
 * with publisher, timestamp, and headline links.
 */
const MarketNews = ({ news, newsLoading, user, t }) => {
    return (
        <div className="apple-glass apple-card-glow p-8 rounded-3xl relative overflow-hidden shadow-xl border border-notion-border/50">
            {/* Ambient Glow */}
            <div className="absolute top-[-20%] right-[-20%] w-[140%] h-[140%] bg-gradient-radial from-notion-blue/5 to-transparent blur-[60px] -z-10 pointer-events-none" />

            <h3 className="text-xl font-extrabold text-notion-text mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-notion-emerald" /> {user ? t('personalized_news') : t('market_news')}
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                {newsLoading ? (
                    <div className="flex flex-col justify-center h-64">
                        <InlineLoadingScreen text="Fetching News..." subtext="Getting latest market updates" />
                    </div>
                ) : news.length > 0 ? (
                    news.map((item, i) => (
                        <div key={i} className="group cursor-pointer border-b border-notion-border/50 pb-5 mb-5 last:border-0 last:pb-0 last:mb-0 transition-all">
                            <div className="flex justify-between items-center mb-1.5">
                                <div className="text-[10px] text-notion-emerald font-extrabold uppercase tracking-wider bg-notion-emerald-bg px-2 py-0.5 rounded-full">{item.publisher}</div>
                                <div className="text-[10px] text-notion-muted font-medium">
                                    {item.time ? new Date(item.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('just_now')}
                                </div>
                            </div>
                            <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-bold text-notion-text group-hover:text-notion-emerald transition-colors line-clamp-2 leading-relaxed"
                            >
                                {item.title}
                            </a>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <p className="text-notion-muted text-sm font-medium">{t('no_news_available')}</p>
                    </div>
                )}
            </div>
            <button className="w-full mt-6 py-3.5 text-sm font-bold bg-notion-hover border border-notion-border/60 rounded-2xl hover:bg-notion-card hover:border-notion-emerald/50 hover:text-notion-emerald transition-all duration-300 relative z-10 active:scale-[0.98]">
                {t('read_more')}
            </button>
        </div>
    );
};

export default MarketNews;
