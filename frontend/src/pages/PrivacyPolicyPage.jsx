import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const PrivacyPolicyPage = () => {
    return (
        <div className="min-h-screen bg-notion-bg text-notion-text flex flex-col selection:bg-accent-emerald/20 selection:text-accent-emerald">
            <Navbar />

            <main className="flex-1 pt-32 pb-24 max-w-4xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12 text-center"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-notion-hover border border-notion-border text-xs font-semibold text-accent-emerald mb-4">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Last Updated: August 2026</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
                    <p className="text-notion-muted text-sm max-w-lg mx-auto">
                        How Cresta safeguards your personal information, financial inputs, and algorithmic privacy.
                    </p>
                </motion.div>

                <div className="space-y-10 text-sm leading-relaxed text-notion-muted">
                    <section className="p-8 rounded-2xl bg-notion-card border border-notion-border space-y-4">
                        <h2 className="text-xl font-bold text-notion-text flex items-center gap-2">
                            <Lock className="w-5 h-5 text-accent-emerald" />
                            1. Commitment to Financial Privacy
                        </h2>
                        <p>
                            At Cresta, we respect the sensitivity of personal wealth and investment psychology. 
                            Our robo-advisory framework is built with a zero-compromise security posture: we do not sell your personal data, 
                            we do not share your risk profile with external marketing networks, and we never store your net banking credentials or Demat trading passwords.
                        </p>
                    </section>

                    <section className="p-8 rounded-2xl bg-notion-card border border-notion-border space-y-4">
                        <h2 className="text-xl font-bold text-notion-text flex items-center gap-2">
                            <Eye className="w-5 h-5 text-accent-blue" />
                            2. Information We Collect
                        </h2>
                        <ul className="space-y-2 list-disc list-inside">
                            <li><strong className="text-notion-text">Account Information:</strong> Name, verified email address, and profile picture collected securely through Google OAuth or standard registration.</li>
                            <li><strong className="text-notion-text">Investor Questionnaire Data:</strong> Approximate age bracket, income range, investment time horizon, and behavioral risk answers utilized strictly by our XGBoost classifier.</li>
                            <li><strong className="text-notion-text">Simulation & Watchlist Data:</strong> Stocks backtested, simulated trades, and price alert thresholds configured by you.</li>
                        </ul>
                    </section>

                    <section className="p-8 rounded-2xl bg-notion-card border border-notion-border space-y-4">
                        <h2 className="text-xl font-bold text-notion-text flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-accent-emerald" />
                            3. Security Architecture & Cookies
                        </h2>
                        <p>
                            We employ strict defense-in-depth protection across our infrastructure:
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4 pt-2">
                            <div className="p-4 rounded-xl bg-notion-hover border border-notion-border/60">
                                <h3 className="font-bold text-notion-text mb-1">HttpOnly JWT Cookies</h3>
                                <p className="text-xs text-notion-muted">Authentication tokens are shielded from JavaScript execution, preventing XSS-based session hijacking.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-notion-hover border border-notion-border/60">
                                <h3 className="font-bold text-notion-text mb-1">CSRF & Rate Throttling</h3>
                                <p className="text-xs text-notion-muted">Automated protection against cross-site request forgery and brute-force abuse on all analytical endpoints.</p>
                            </div>
                        </div>
                    </section>

                    <section className="p-8 rounded-2xl bg-notion-card border border-notion-border space-y-4">
                        <h2 className="text-xl font-bold text-notion-text flex items-center gap-2">
                            <FileText className="w-5 h-5 text-accent-blue" />
                            4. Your Data Rights
                        </h2>
                        <p>
                            Under modern data protection regulations including India's DPDP Act, you retain full ownership of your data. 
                            You may at any time retake your risk assessment, delete your saved simulation histories, or request complete account deletion 
                            by contacting our engineering team at <a href="mailto:ankitrmishra01@gmail.com" className="text-accent-emerald hover:underline">ankitrmishra01@gmail.com</a>.
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PrivacyPolicyPage;
