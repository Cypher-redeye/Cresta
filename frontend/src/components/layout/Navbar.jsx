import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../common/ThemeToggle';

const Navbar = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div 
            style={{
                position: 'fixed',
                top: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 50,
                background: isDark ? 'rgba(13, 13, 13, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                border: isDark ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(16, 185, 129, 0.25)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}
            className="flex items-center gap-8 px-6 py-2.5 rounded-full shadow-2xl transition-all duration-300"
        >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform">
                    <path d="M50 15L85 75H15L50 15Z" stroke="#10B981" strokeWidth="8" strokeLinejoin="round" />
                    <circle cx="50" cy="45" r="5" fill="#10B981" />
                    <path d="M50 45L35 65M50 45L65 65" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <span className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>
                    Cresta<span className="text-[#10B981]">.</span>
                </span>
            </Link>

            {/* Nav Links */}
            <nav className="flex items-center gap-6">
                <a 
                    href="#about" 
                    className={`text-sm font-semibold transition-colors ${isDark ? 'text-white hover:text-white' : 'text-[#0f172a] hover:text-[#10B981]'}`}
                >
                    {t('about')}
                </a>
            </nav>

            {/* Actions */}
            <div className={`flex items-center gap-4 border-l pl-6 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <Link 
                    to="/auth" 
                    className="px-4 py-1.5 rounded-lg border-[1.5px] border-[#10B981] bg-transparent text-sm font-bold text-[#10B981] hover:bg-[#10B981]/10 transition-all duration-300"
                >
                    {t('login')}
                </Link>
                <ThemeToggle />
            </div>
        </div>
    );
};

export default Navbar;
