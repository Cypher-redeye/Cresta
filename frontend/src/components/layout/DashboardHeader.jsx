import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, Settings, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import ThemeToggle from '../common/ThemeToggle';
import Logo from '../common/Logo';
import { useSearch } from '../../context/SearchContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';

const Header = () => {
    const { user, logout } = useUser();
    const { setSearchQuery } = useSearch();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const displayName = user?.name || user?.first_name || 'Investor';
    const userEmail = user?.email || '';
    const location = useLocation();

    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfile(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const normalizeQuery = (query) => {
        const q = query.trim().toUpperCase();
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
        <header className="flex items-center justify-between px-4 md:px-8 py-3.5 border-b border-notion-border bg-notion-bg/60 backdrop-blur-2xl sticky top-0 z-30 transition-colors duration-300 w-full overflow-visible">
            {/* Left: Logo + Welcome */}
            <div className="flex items-center gap-4 min-w-0">
                <div 
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 pr-4 border-r border-notion-border cursor-pointer hover:opacity-85 transition-opacity"
                >
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

            <div className="flex items-center gap-4 sm:gap-6">
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

                {/* Profile Button & Interactive Dropdown */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-notion-border focus:outline-none group cursor-pointer text-left"
                    >
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-notion-text group-hover:text-notion-emerald transition-colors">{displayName}</div>
                            <div className="text-xs text-notion-muted">{user?.risk_profile ? `${user.risk_profile} Risk` : t('premium_investor')}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full border border-notion-border bg-notion-hover flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-notion-emerald/40 transition-all duration-200">
                            {user?.picture ? (
                                <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-5 h-5 text-notion-muted group-hover:text-notion-text" />
                            )}
                        </div>
                        <ChevronDown size={14} className={`text-notion-muted transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showProfile && (
                        <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-notion-bg border border-notion-border shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl">
                            {/* User details header */}
                            <div className="px-4 py-3 border-b border-notion-border/60">
                                <div className="font-semibold text-sm text-notion-text truncate">{displayName}</div>
                                {userEmail && <div className="text-xs text-notion-muted truncate mt-0.5">{userEmail}</div>}
                                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-notion-emerald/10 text-notion-emerald">
                                    <ShieldCheck size={12} />
                                    {user?.risk_profile ? `${user.risk_profile} Investor` : 'Verified Account'}
                                </div>
                            </div>

                            {/* Menu Actions */}
                            <div className="py-1">
                                <button
                                    onClick={() => { setShowProfile(false); navigate('/settings'); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-notion-text hover:bg-notion-hover transition-colors text-left"
                                >
                                    <Settings size={15} className="text-notion-muted" />
                                    <span>{t('settings')}</span>
                                </button>
                                <button
                                    onClick={() => { setShowProfile(false); navigate('/risk-assessment'); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-notion-text hover:bg-notion-hover transition-colors text-left"
                                >
                                    <ShieldCheck size={15} className="text-notion-muted" />
                                    <span>{t('risk_assessment_title')}</span>
                                </button>
                            </div>

                            {/* Logout */}
                            <div className="border-t border-notion-border/60 pt-1">
                                <button
                                    onClick={() => { setShowProfile(false); logout(); navigate('/auth'); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors text-left"
                                >
                                    <LogOut size={15} />
                                    <span>{t('logout')}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
