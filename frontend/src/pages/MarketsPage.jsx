import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Search, TrendingUp, TrendingDown, Clock, Filter, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSearch } from '../context/SearchContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PredictiveChart from '../components/dashboard/PredictiveChart';
import { API_BASE } from '../api';

// Mock Data Generator for mini charts
const generateChartData = (points = 50) => {
    let data = [];
    let value = 1500;
    for (let i = 0; i < points; i++) {
        value = value + (Math.random() - 0.5) * 50;
        data.push({ time: `${i}:00`, value: Math.abs(value) });
    }
    return data;
};

const MarketsPage = () => {
    const { t } = useTranslation();
    const { searchQuery } = useSearch();
    const { showToast } = useToast();
    const [searchResult, setSearchResult] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [showSearchChart, setShowSearchChart] = useState(false);

    const [indicesData, setIndicesData] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('gainers');
    const [news, setNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const { user } = useUser();

    // Live top movers data
    const [topGainers, setTopGainers] = useState([]);
    const [topLosers, setTopLosers] = useState([]);
    const [moversLoading, setMoversLoading] = useState(true);

    // Search Effect
    useEffect(() => {
        if (!searchQuery) {
            setSearchResult(null);
            setShowSearchChart(false);
            return;
        }

        const fetchSearch = async () => {
            try {
                setSearchLoading(true);
                setSearchError(null);
                setShowSearchChart(false);

                // Get user's risk class for personalized suggestion
                let riskParam = '';
                if (user) {
                    try {
                        const riskData = localStorage.getItem('risk_assessment_result');
                        if (riskData) {
                            const riskClass = JSON.parse(riskData)?.User_Class;
                            if (riskClass) riskParam = `&risk=${riskClass}`;
                        }
                    } catch (e) { }
                }

                const response = await fetch(`${API_BASE}/search/?symbol=${searchQuery}${riskParam}`);
                if (!response.ok) throw new Error('Stock not found');
                const data = await response.json();
                setSearchResult(data);
            } catch (err) {
                setSearchError(err.message);
                setSearchResult(null);
                showToast(`Search failed: ${err.message}`, 'error');
            } finally {
                setSearchLoading(false);
            }
        };

        const timeout = setTimeout(fetchSearch, 500);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                setLoading(true);
                const endpoints = ['nifty', 'sensex', 'banknifty'];
                const fetchWithTimeout = (url, ms = 5000) => {
                    return Promise.race([
                        fetch(url).then(async res => {
                            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                            return res.json();
                        }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms))
                    ]);
                };

                const responses = await Promise.all(
                    endpoints.map(endpoint => fetchWithTimeout(`${API_BASE}/${endpoint}/`, 8000))
                );

                const mappedData = responses.map((data) => ({
                    name: data.name,
                    value: data.value,
                    change: data.percent,
                    isPositive: String(data.change || '').startsWith('+')
                }));
                setIndicesData(mappedData);
                setError(null);
            } catch (error) {
                console.error("Failed to fetch market indices:", error);
                setError(error.message);
                showToast('Failed to fetch market indices', 'error');
                setIndicesData([
                    { name: 'NIFTY 50', value: 24000, change: 0.8, isPositive: true },
                    { name: 'SENSEX', value: 79000, change: 0.8, isPositive: true },
                    { name: 'BANK NIFTY', value: 51000, change: -0.4, isPositive: false }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchIndices();
        const interval = setInterval(fetchIndices, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch top movers (live gainers/losers)
    useEffect(() => {
        const fetchTopMovers = async () => {
            try {
                setMoversLoading(true);
                const response = await fetch(`${API_BASE}/top-movers/`);
                if (!response.ok) throw new Error('Failed to fetch top movers');
                const data = await response.json();
                setTopGainers(data.gainers || []);
                setTopLosers(data.losers || []);
            } catch (err) {
                console.error("Top movers error:", err);
                // Keep empty arrays on error — no mock data
                setTopGainers([]);
                setTopLosers([]);
            } finally {
                setMoversLoading(false);
            }
        };

        fetchTopMovers();
        const interval = setInterval(fetchTopMovers, 300000); // Refresh every 5 min
        return () => clearInterval(interval);
    }, []);

    const [chartData, setChartData] = useState(generateChartData());

    // News Effect
    useEffect(() => {
        const fetchNews = async () => {
            try {
                setNewsLoading(true);
                let url = `${API_BASE}/news/`;

                if (user) {
                    let tickers = [];
                    try {
                        const aiData = localStorage.getItem('ai_insights_data');
                        if (aiData) {
                            const parsed = JSON.parse(aiData);
                            if (parsed.Recommended_Stocks) {
                                tickers = parsed.Recommended_Stocks.map(s => s.Ticker).slice(0, 3);
                            }
                        }
                    } catch (e) { }

                    if (tickers.length > 0) {
                        url += `?symbol=${tickers.join(',')}`;
                    } else {
                        url += '?symbol=RELIANCE.NS,TCS.NS,HDFCBANK.NS';
                    }
                }

                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch news');
                const data = await response.json();
                setNews(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("News fetch error:", err);
                setNews([]);
            } finally {
                setNewsLoading(false);
            }
        };

        fetchNews();
    }, [user]);

    // Simulate live chart updates
    useEffect(() => {
        const interval = setInterval(() => {
            setChartData(prev => {
                const lastValue = prev[prev.length - 1].value;
                const newValue = lastValue + (Math.random() - 0.5) * 30;
                return [...prev.slice(1), { time: 'Now', value: newValue }];
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const currentMovers = selectedTab === 'losers' ? topLosers : topGainers;

    const renderContent = () => (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('market_watch')}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{t('markets_subtitle')}</p>

                    {/* Search Status */}
                    {searchQuery && !user && (
                        <div className="mt-4 p-3 bg-fintech-cyan/10 dark:bg-cyan-500/10 border border-fintech-cyan/20 dark:border-cyan-500/20 rounded-lg text-sm text-fintech-cyan dark:text-neon-cyan flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{t('sign_in_unlock')}</span>
                        </div>
                    )}
                    {searchLoading && <p className="text-fintech-cyan dark:text-cyan-600 mt-2 animate-pulse">{t('searching_for')} "{searchQuery}"...</p>}
                    {searchError && <p className="text-red-500 mt-2">Error: {searchError}</p>}

                    {/* Main Status Indicators */}
                    {loading && !indicesData.length && (
                        <div className="flex items-center gap-2 mt-2 text-fintech-cyan dark:text-neon-cyan animate-pulse">
                            <span className="w-2 h-2 bg-current rounded-full"></span>
                            <span className="text-sm font-medium">{t('fetching_live_data')}</span>
                        </div>
                    )}
                    {error && (
                        <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-3 rounded border border-red-200 dark:border-red-800/30">
                            <p className="font-bold">⚠️ {t('connection_error')}</p>
                            <p>{error}</p>
                            <p className="text-xs mt-1 text-gray-500">
                                {t('troubleshooting')}:<br />
                                1. Ensure backend is running at <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">http://127.0.0.1:8000</code><br />
                                2. Check console logs (F12) for detailed error.<br />
                                3. Try disabling ad blockers or VPN.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Result Card */}
            {searchResult && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-cyan-50/10 dark:bg-cyan-900/10 backdrop-blur-xl mb-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp className="w-24 h-24 text-fintech-cyan dark:text-cyan-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('search_result')}</h2>
                    <div className="flex flex-wrap items-center gap-8">
                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{t('symbol')}</div>
                            <div className="text-2xl font-bold text-fintech-cyan dark:text-neon-cyan">{searchResult.symbol}</div>
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
                                    ? 'bg-fintech-cyan/20 dark:bg-cyan-500/20 text-fintech-cyan dark:text-cyan-400 border border-fintech-cyan/30 dark:border-cyan-500/30'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-fintech-cyan/30 dark:hover:border-cyan-500/30'
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
            )}

            {/* Market Indices Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(indicesData.length > 0 ? indicesData : ['NIFTY 50', 'SENSEX', 'BANK NIFTY'].map((name, i) => ({ name, value: 24000 + i * 5000, change: 0.8, isPositive: true }))).map((index, i) => (
                    <motion.div
                        key={index.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-panel p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-fintech-card/50 backdrop-blur-xl"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-gray-500 dark:text-gray-400 font-medium">{index.name}</h3>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {index.value}
                                </div>
                            </div>
                            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${index.isPositive ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                {index.change}
                            </div>
                        </div>
                        <div className="h-16">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={index.isPositive ? "#10B981" : "#EF4444"} stopOpacity={0.2} />
                                            <stop offset="100%" stopColor={index.isPositive ? "#10B981" : "#EF4444"} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={index.isPositive ? "#10B981" : "#EF4444"}
                                        strokeWidth={2}
                                        fill={`url(#grad${i})`}
                                        isAnimationActive={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Gainers/Losers Lists */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-fintech-card/50">
                        <div className="p-4 border-b border-gray-200 dark:border-white/10 flex gap-6">
                            <button
                                onClick={() => setSelectedTab('gainers')}
                                className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${selectedTab === 'gainers' || selectedTab === 'overview' ? 'text-fintech-cyan dark:text-neon-cyan border-fintech-cyan dark:border-neon-cyan' : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                {t('top_gainers')}
                            </button>
                            <button
                                onClick={() => setSelectedTab('losers')}
                                className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${selectedTab === 'losers' ? 'text-fintech-cyan dark:text-neon-cyan border-fintech-cyan dark:border-neon-cyan' : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'}`}
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
                </div>

                {/* Right Column: Trending News */}
                <div className="space-y-6">
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
                </div>
            </div>
        </div>
    );

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-fintech-bg transition-colors duration-300">
                <Navbar />
                <main className="container mx-auto px-6 py-32">
                    {renderContent()}
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <DashboardLayout>
            {renderContent()}
        </DashboardLayout>
    );
};

export default MarketsPage;
