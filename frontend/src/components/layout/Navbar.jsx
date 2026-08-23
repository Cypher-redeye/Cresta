import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from '../common/Logo';
import ThemeToggle from '../common/ThemeToggle';
import MagneticWrapper from '../common/MagneticWrapper';

const Navbar = () => {
    const { t } = useTranslation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: t('features'), path: '#features' },
        { name: t('about_us'), path: '#about' },
        { name: t('markets'), path: '/markets' },
    ];

    return (
        <>
            <nav
                className={`fixed z-50 left-1/2 -translate-x-1/2 transition-all duration-300 w-[90%] max-w-[850px] rounded-full apple-glass flex items-center h-14 ${
                    scrolled ? 'top-4' : 'top-6'
                }`}
            >
            <div className="w-full px-6 flex items-center justify-between">
                
                {/* Logo */}
                <MagneticWrapper strength={0.3}>
                    <Link to="/" className="flex items-center gap-2 group">
                        <Logo width={22} height={22} className="transition-transform duration-300 group-hover:scale-105 active:scale-95" />
                        <span className="text-notion-text font-bold text-[15px] tracking-tight select-none">Cresta</span>
                    </Link>
                </MagneticWrapper>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <MagneticWrapper key={link.name} strength={0.2}>
                            <a 
                                href={link.path}
                                className="text-[13px] font-semibold text-notion-muted hover:text-notion-text transition-colors duration-250 block px-2 py-1"
                            >
                                {link.name}
                            </a>
                        </MagneticWrapper>
                    ))}
                </div>

                {/* Right CTA & Mobile Toggle */}
                <div className="flex items-center gap-3">

                    <ThemeToggle />
                    
                    <MagneticWrapper strength={0.4} className="hidden md:flex">
                        <Link
                            to="/auth"
                            className="stark-btn-primary !py-1 !px-3.5 !rounded-full text-[12px] tracking-wide"
                        >
                            {t('get_started')}
                        </Link>
                    </MagneticWrapper>
                    
                    <button 
                        className="md:hidden text-notion-text"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>
            </nav>

            {/* Mobile Menu */}
            <div className={`fixed inset-0 bg-notion-bg z-40 transition-transform duration-300 pt-28 px-8 md:hidden flex flex-col ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="flex flex-col gap-8 text-center mt-10">
                    {navLinks.map((link) => (
                        <a 
                            key={link.name} 
                            href={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-2xl font-semibold text-notion-muted hover:text-notion-text transition-colors duration-200"
                        >
                            {link.name}
                        </a>
                    ))}
                    <Link
                        to="/auth"
                        onClick={() => setMobileMenuOpen(false)}
                        className="stark-btn-primary mt-8 py-4 text-lg font-bold w-full rounded-2xl text-center flex items-center justify-center"
                    >
                        {t('get_started')}
                    </Link>
                </div>
            </div>
        </>
    );
};

export default Navbar;
