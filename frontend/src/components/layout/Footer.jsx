import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Github, Twitter, Linkedin } from 'lucide-react';
import Logo from '../common/Logo';

const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className="bg-notion-bg border-t border-notion-border pt-16 pb-8">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <Logo width={20} height={20} />
                            <span className="text-notion-text font-bold text-lg tracking-tight">Cresta</span>
                        </Link>
                        <p className="text-notion-muted text-sm leading-relaxed mb-6">
                            Intelligently grow and manage your wealth through AI-powered insights and portfolio rebalancing.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-notion-muted hover:text-notion-text transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-notion-muted hover:text-notion-text transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-notion-muted hover:text-notion-text transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold text-notion-text mb-4 text-sm">{t('product')}</h4>
                        <ul className="space-y-3">
                            <li><Link to="/markets" className="text-notion-muted hover:text-notion-text text-sm transition-colors">{t('markets')}</Link></li>
                            <li><a href="#features" className="text-notion-muted hover:text-notion-text text-sm transition-colors">{t('features')}</a></li>
                            <li><Link to="/pricing" className="text-notion-muted hover:text-notion-text text-sm transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-notion-text mb-4 text-sm">{t('company')}</h4>
                        <ul className="space-y-3">
                            <li><a href="#about" className="text-notion-muted hover:text-notion-text text-sm transition-colors">{t('about_us')}</a></li>
                            <li><Link to="/careers" className="text-notion-muted hover:text-notion-text text-sm transition-colors">Careers</Link></li>
                            <li><Link to="/contact" className="text-notion-muted hover:text-notion-text text-sm transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-notion-text mb-4 text-sm">Legal</h4>
                        <ul className="space-y-3">
                            <li><Link to="/privacy" className="text-notion-muted hover:text-notion-text text-sm transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="text-notion-muted hover:text-notion-text text-sm transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-notion-border flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-notion-muted text-sm">
                        &copy; {new Date().getFullYear()} Cresta. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
