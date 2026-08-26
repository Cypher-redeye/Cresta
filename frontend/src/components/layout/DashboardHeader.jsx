import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import ThemeToggle from '../common/ThemeToggle';
import Logo from '../common/Logo';
import { useSearch } from '../../context/SearchContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';

const Header = () => {
    const { user } = useUser();
    const { setSearchQuery } = useSearch();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const displayName = user?.name || 'Investor';
    const location = useLocation();

    const normalizeQuery = (query) => {
        const q = query.trim().toUpperCase();
        // Common name mappings
        const aliases = {
            'RELIANCE': 'RELIANCE.NS',
            'TCS': 'TCS.NS',
            'INFY': 'INFY.NS',
            'INFOSYS': 'INFY.NS',
            'HDFC': 'HDFCBANK.NS',
            'HDFCBANK': 'HDFCBANK.NS',
            'ICICI': 'ICICIBANK.NS',
            'ICICIBANK': 'ICICIBANK.NS',
            'SUNPHARMA': 'SUNPHARMA.NS',
            'SUN PHARMA': 'SUNPHARMA.NS',
            'SUNPHARM': 'SUNPHARMA.NS',
            'MARUTI': 'MARUTI.NS',
            'SUZUKI': 'MARUTI.NS',
            'ONGC': 'ONGC.NS',
            'BAJAJ': 'BAJAJ-AUTO.NS',
            'BAJAJUTO': 'BAJAJ-AUTO.NS',
            'BPCL': 'BPCL.NS',
            'WIPRO': 'WIPRO.NS',
            'TATAMOTORS': 'TATAMOTORS.NS',
            'TATA MOTORS': 'TATAMOTORS.NS',
            'TATA': 'TCS.NS',
            'ASIAN PAINTS': 'ASIANPAINT.NS',
            'ASIANPAINT': 'ASIANPAINT.NS',
            'KOTAK': 'KOTAKBANK.NS',
            'KOTAKBANK': 'KOTAKBANK.NS',
            'AXIS': 'AXISBANK.NS',
            'AXISBANK': 'AXISBANK.NS',
            'SBI': 'SBIN.NS',
            'SBIN': 'SBIN.NS',
            'ADANI': 'ADANIENT.NS',
            'BHARTI': 'BHARTIARTL.NS',
            'AIRTEL': 'BHARTIARTL.NS',
        };
        if (aliases[q]) return aliases[q];
        if (q.includes('.') || q.startsWith('^')) return q;
        return q + '.NS';
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            const ticker = normalizeQuery(e.target.value);
            setSearchQuery(ticker);
        }
    };



    return (
        <header className="flex items-center justify-between px-4 md:px-8 py-3.5 border-b border-notion-border bg-notion-bg/60 backdrop-blur-2xl sticky top-0 z-30 transition-colors duration-300 w-full overflow-hidden">
            {/* Left: Logo + Welcome */}
            <div className="flex items-center gap-4 min-w-0">
                {/* Logo branding (migrated from sidebar) */}
                <div className="flex items-center gap-2 pr-4 border-r border-notion-border">
                    <Logo width={28} height={28} />
                    <span className="text-lg font-bold tracking-tight text-notion-text hidden sm:block">
                        Cresta<span className="text-notion-emerald">.</span>
                    </span>
                </div>

                <div className="min-w-0">
                    <h1 className="text-[16px] md:text-[18px] font-bold text-notion-text truncate tracking-tight">
                        {t('welcome_back')}, <span className="text-notion-emerald">{displayName}</span>
                    </h1>
                    <p className="text-xs text-notion-muted hidden sm:block truncate">{t('whats_happening_today')}</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Search */}
                {location.pathname === '/markets' && (
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-notion-muted" />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            onKeyDown={handleSearch}
                            className="bg-notion-hover border border-notion-border rounded-lg pl-10 pr-4 py-1.5 text-xs text-notion-text focus:outline-none focus:bg-notion-bg focus:border-notion-text w-32 sm:w-48 md:w-64 transition-all duration-200 placeholder:text-notion-muted"
                        />
                    </div>
                )}

                {/* Notifications */}
                <button
                    onClick={() => showToast('No new notifications', 'info')}
                    className="relative p-2 rounded-full hover:bg-notion-hover text-notion-muted hover:text-notion-text transition-colors"
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <ThemeToggle />

                {/* Profile */}
                <div className="flex items-center gap-3 pl-6 border-l border-notion-border">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-notion-text">{displayName}</div>
                        <div className="text-xs text-notion-muted">{t('premium_investor')}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-notion-border bg-notion-hover flex items-center justify-center overflow-hidden">
                        {user?.picture ? (
                            <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-notion-muted" />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
