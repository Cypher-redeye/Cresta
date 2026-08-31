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
                        <div className="flex gap-4 mb-4">
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-notion-muted hover:text-notion-text transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://github.com/ankitrmishra01/Cresta" target="_blank" rel="noopener noreferrer" className="text-notion-muted hover:text-notion-text transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                        </div>

                        {/* Team LinkedIn Quick Badges */}
                        <div className="pt-3 border-t border-notion-border/50">
                            <span className="text-[11px] font-semibold text-notion-muted block mb-2">Team Leads (LinkedIn):</span>
                            <div className="flex flex-wrap gap-1.5">
                                <a href="https://www.linkedin.com/in/ankitrmishra01" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-notion-hover hover:bg-accent-blue/15 hover:text-accent-blue text-[11px] text-notion-muted transition-colors" title="Ankit Mishra - Team Leader & Backend Lead">
                                    <Linkedin className="w-3 h-3" />
                                    <span>Ankit (Lead)</span>
                                </a>
                                <a href="https://www.linkedin.com/in/om-sharma38" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-notion-hover hover:bg-accent-blue/15 hover:text-accent-blue text-[11px] text-notion-muted transition-colors" title="Om Sharma - Frontend & Deployment Lead">
                                    <Linkedin className="w-3 h-3" />
                                    <span>Om (Frontend & Deploy)</span>
                                </a>
                                <a href="https://www.linkedin.com/in/shivam-panchal-7471052a5" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-notion-hover hover:bg-accent-blue/15 hover:text-accent-blue text-[11px] text-notion-muted transition-colors" title="Shivam Panchal - ML Lead">
                                    <Linkedin className="w-3 h-3" />
                                    <span>Shivam (ML)</span>
                                </a>
                                <a href="https://www.linkedin.com/in/shubham-jha-986520312" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-notion-hover hover:bg-accent-blue/15 hover:text-accent-blue text-[11px] text-notion-muted transition-colors" title="Shubham Jha - Chatbot Lead">
                                    <Linkedin className="w-3 h-3" />
                                    <span>Shubham (AI)</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold text-notion-text mb-4 text-sm">{t('product')}</h4>
                        <ul className="space-y-3">
                            <li><Link to="/markets" className="text-notion-muted hover:text-notion-text text-sm transition-colors">{t('markets')}</Link></li>
                            <li><a href="/#features" className="text-notion-muted hover:text-notion-text text-sm transition-colors">{t('features')}</a></li>
                            <li><Link to="/backtest" className="text-notion-muted hover:text-notion-text text-sm transition-colors">Backtesting Engine</Link></li>
                            <li><Link to="/risk-assessment" className="text-notion-muted hover:text-notion-text text-sm transition-colors">Risk Profiling</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-notion-text mb-4 text-sm">{t('company')}</h4>
                        <ul className="space-y-3">
                            <li><Link to="/about" className="text-notion-muted hover:text-notion-text text-sm transition-colors">{t('about_us')}</Link></li>
                            <li><Link to="/about" className="text-notion-muted hover:text-notion-text text-sm transition-colors">Founding Team</Link></li>
                            <li><Link to="/contact" className="text-notion-muted hover:text-notion-text text-sm transition-colors">Contact Us</Link></li>
                            <li><a href="https://github.com/ankitrmishra01/Cresta" target="_blank" rel="noopener noreferrer" className="text-notion-muted hover:text-notion-text text-sm transition-colors">Open Source Repo</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-notion-text mb-4 text-sm">Legal & Compliance</h4>
                        <ul className="space-y-3">
                            <li><Link to="/privacy" className="text-notion-muted hover:text-notion-text text-sm transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="text-notion-muted hover:text-notion-text text-sm transition-colors">Terms of Service</Link></li>
                            <li><Link to="/terms" className="text-notion-muted hover:text-notion-text text-sm transition-colors">Regulatory Disclaimers</Link></li>
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
