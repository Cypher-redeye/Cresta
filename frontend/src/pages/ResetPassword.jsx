import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../api';
import Logo from '../components/common/Logo';
import { useToast } from '../context/ToastContext';

const ResetPassword = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!uid || !token) {
            showToast('Invalid password reset link', 'error');
            navigate('/auth');
        }
    }, [uid, token, navigate, showToast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/auth/reset-password/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, token, new_password: password })
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
            } else {
                showToast(data.error || 'Failed to reset password', 'error');
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
                                <h2 className="text-2xl font-bold mb-2 text-notion-text">Set New Password</h2>
                                <p className="text-notion-muted text-sm">
                                    Please enter your new password below.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-[18px] h-5 w-5 text-notion-muted group-focus-within:text-notion-emerald transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder=" "
                                        className="w-full bg-notion-hover/40 border border-notion-border/60 rounded-2xl pl-12 pr-12 py-4 text-notion-text outline-none focus:border-notion-emerald focus:bg-notion-hover focus:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 peer tracking-wide font-medium"
                                    />
                                    <label className="absolute left-11 top-4 text-sm text-notion-muted transition-all bg-notion-card px-1 ml-[-4px] pointer-events-none peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-notion-emerald peer-focus:font-bold peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-notion-emerald peer-[:not(:placeholder-shown)]:font-bold rounded-md">
                                        {t('password', 'New Password')}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-[18px] text-notion-muted hover:text-notion-emerald transition-colors"
                                    >
                                        <AnimatePresence mode="wait" initial={false}>
                                            <motion.div
                                                key={showPassword ? "hide" : "show"}
                                                initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </motion.div>
                                        </AnimatePresence>
                                    </button>
                                </div>

                                <div className="relative group">
                                    <Lock className="absolute left-4 top-[18px] h-5 w-5 text-notion-muted group-focus-within:text-notion-emerald transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder=" "
                                        className="w-full bg-notion-hover/40 border border-notion-border/60 rounded-2xl pl-12 pr-12 py-4 text-notion-text outline-none focus:border-notion-emerald focus:bg-notion-hover focus:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 peer tracking-wide font-medium"
                                    />
                                    <label className="absolute left-11 top-4 text-sm text-notion-muted transition-all bg-notion-card px-1 ml-[-4px] pointer-events-none peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-notion-emerald peer-focus:font-bold peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-notion-emerald peer-[:not(:placeholder-shown)]:font-bold rounded-md">
                                        Confirm Password
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !password || !confirmPassword}
                                    className="w-full relative group overflow-hidden rounded-2xl bg-notion-text text-notion-bg px-8 py-4 font-bold tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <span>Reset Password</span>
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
                            <h2 className="text-2xl font-bold mb-3 text-notion-text">Password Reset!</h2>
                            <p className="text-notion-muted text-sm mb-8">
                                Your password has been successfully updated. You can now log in with your new password.
                            </p>
                            
                            <Link 
                                to="/auth"
                                className="w-full inline-block relative group overflow-hidden rounded-2xl bg-notion-emerald text-white px-8 py-4 font-bold tracking-wide transition-all duration-300 hover:bg-notion-emerald/90"
                            >
                                Go to Login
                            </Link>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
