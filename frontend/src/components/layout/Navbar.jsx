import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';

const Navbar = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8 px-6 py-2.5 bg-[#0d0d0d]/70 backdrop-blur-xl border border-emerald-500/15 rounded-full shadow-2xl transition-all duration-300">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform">
                    <path d="M50 15L85 75H15L50 15Z" stroke="#10B981" strokeWidth="8" strokeLinejoin="round" />
                    <circle cx="50" cy="45" r="5" fill="#10B981" />
                    <path d="M50 45L35 65M50 45L65 65" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <span className="text-lg font-bold tracking-tight text-white">
                    Cresta<span className="text-[#10B981]">.</span>
                </span>
            </Link>

            {/* Nav Links */}
            <nav className="flex items-center gap-6">
                <a href="#about" className="text-sm font-semibold text-white hover:text-white transition-colors">
                    {t('about')}
                </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
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
