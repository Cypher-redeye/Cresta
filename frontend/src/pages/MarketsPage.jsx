import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Clock } from 'lucide-react';
import { useSearch } from '../context/SearchContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { API_BASE, apiCall } from '../api';

// Decomposed sub-components
import SearchResultCard from '../components/markets/SearchResultCard';
import MarketIndices from '../components/markets/MarketIndices';
import TopMovers from '../components/markets/TopMovers';
import MarketNews from '../components/markets/MarketNews';

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

                const response = await apiCall(`/search/?ticker=${searchQuery}${riskParam}`);
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
                        <div className="mt-4 p-3 bg-fintech-emerald/10 dark:bg-emerald-500/10 border border-fintech-emerald/20 dark:border-emerald-500/20 rounded-lg text-sm text-fintech-emerald dark:text-neon-emerald flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{t('sign_in_unlock')}</span>
                        </div>
                    )}
                    {searchLoading && <p className="text-fintech-emerald dark:text-emerald-600 mt-2 animate-pulse">{t('searching_for')} "{searchQuery}"...</p>}
                    {searchError && <p className="text-red-500 mt-2">Error: {searchError}</p>}

                    {/* Main Status Indicators */}
                    {loading && !indicesData.length && (
                        <div className="flex items-center gap-2 mt-2 text-fintech-emerald dark:text-neon-emerald animate-pulse">
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
            <SearchResultCard
                searchResult={searchResult}
                user={user}
                showSearchChart={showSearchChart}
                setShowSearchChart={setShowSearchChart}
                t={t}
            />

            {/* Market Indices Cards */}
            <MarketIndices indicesData={indicesData} chartData={chartData} t={t} />

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Gainers/Losers */}
                <div className="lg:col-span-2 space-y-6">
                    <TopMovers
                        selectedTab={selectedTab}
                        setSelectedTab={setSelectedTab}
                        currentMovers={currentMovers}
                        moversLoading={moversLoading}
                        t={t}
                    />
                </div>

                {/* Right Column: News */}
                <div className="space-y-6">
                    <MarketNews news={news} newsLoading={newsLoading} user={user} t={t} />
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
