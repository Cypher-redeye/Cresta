import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../api';
import Logo from '../components/common/Logo';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/auth/forgot-password/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                setIsSuccess(true);
            } else {
                const data = await response.json();
                showToast(data.error || 'Failed to request reset', 'error');
            }
        } catch (err) {
            showToast('Connection error', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-notion-bg flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-notion-emerald/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-notion-emerald/10 rounded-full blur-[100px] pointer-events-none" />

            <Link 
                to="/"
                className="absolute top-8 left-8 flex items-center gap-2 group z-20"
            >
                <Logo width={24} height={24} className="transition-transform duration-300 group-hover:scale-105" />
                <span className="text-notion-text font-bold text-lg tracking-tight">Cresta</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="apple-glass apple-card-glow p-8 md:p-10 rounded-3xl relative overflow-hidden shadow-2xl border border-notion-border/50">
                    
                    {!isSuccess ? (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold mb-2 text-notion-text">Forgot Password</h2>
                                <p className="text-notion-muted text-sm">
                                    Enter your email address and we'll send you a link to reset your password.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-[18px] h-5 w-5 text-notion-muted group-focus-within:text-notion-emerald transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder=" "
                                        className="w-full bg-notion-hover/40 border border-notion-border/60 rounded-2xl px-12 py-4 text-notion-text outline-none focus:border-notion-emerald focus:bg-notion-hover focus:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 peer tracking-wide font-medium"
                                    />
                                    <label className="absolute left-11 top-4 text-sm text-notion-muted transition-all bg-notion-card px-1 ml-[-4px] pointer-events-none peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-notion-emerald peer-focus:font-bold peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-notion-emerald peer-[:not(:placeholder-shown)]:font-bold rounded-md">
                                        {t('email_address', 'Email Address')}
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !email}
                                    className="w-full relative group overflow-hidden rounded-2xl bg-notion-text text-notion-bg px-8 py-4 font-bold tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <span>Send Reset Link</span>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 bg-notion-emerald/10 text-notion-emerald rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <CheckCircle2 className="w-8 h-8" />
                            </motion.div>
                            <h2 className="text-2xl font-bold mb-3 text-notion-text">Check Your Email</h2>
                            <p className="text-notion-muted text-sm mb-8">
                                We've sent a password reset link to <br/>
                                <span className="font-semibold text-notion-text">{email}</span>
                            </p>
                        </div>
                    )}

                    <div className="mt-8 text-center border-t border-notion-border/40 pt-6">
                        <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-notion-muted hover:text-notion-emerald transition-colors">
                            <ArrowLeft size={16} />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
