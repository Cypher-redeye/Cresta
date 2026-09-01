import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Github, Chrome, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { API_BASE } from '../api';
import { useToast } from '../context/ToastContext';

const AuthPage = () => {
    const { t } = useTranslation();
    
    const quotes = [
        { text: t('quote_buffett', "The stock market is designed to transfer money from the active to the patient."), author: "Warren Buffett" },
        { text: t('quote_einstein', "Compound interest is the eighth wonder of the world. He who understands it, earns it."), author: "Albert Einstein" },
        { text: t('quote_graham', "The investor's chief problem—and even his worst enemy—is likely to be himself."), author: "Benjamin Graham" },
        { text: t('quote_lynch', "In the stock market, the most important organ is the stomach, not the brain."), author: "Peter Lynch" },
        { text: t('quote_munger', "The big money is not in the buying and the selling, but in the waiting."), author: "Charlie Munger" },
        { text: t('quote_templeton', "The time of maximum pessimism is the best time to buy, and the time of maximum optimism is the best time to sell."), author: "John Templeton" }
    ];

    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(() => 
        Math.floor(Math.random() * quotes.length)
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
        }, 7000);
        return () => clearInterval(interval);
    }, [quotes.length]);

    const location = useLocation();
    const [isLogin, setIsLogin] = useState(location.state?.isSignUp ? false : true);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const navigate = useNavigate();
    const { login } = useUser();
    const { showToast } = useToast();

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            try {
                const res = await fetch(`${API_BASE}/auth/google/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: tokenResponse.access_token })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    login(data.user, data.tokens);
                    showToast(t('login_success'), 'success');
                    navigate('/dashboard');
                } else {
                    const errorMsg = data.error || data.detail || 'Google Auth Failed';
                    console.error('Backend Google Auth Failed:', errorMsg);
                    showToast(errorMsg, 'error');
                }
            } catch (err) {
                console.error('Google Auth Request Failed:', err);
                showToast(`Google Auth Error: ${err.message}`, 'error');
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => {
            console.log('Google Login Failed');
            showToast('Google Login was cancelled or failed.', 'error');
            setIsLoading(false);
        }
    });

    const toggleMode = () => setIsLogin(!isLogin);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const endpoint = isLogin ? 'auth/login/' : 'auth/signup/';
        const payload = isLogin 
            ? { username: formData.email, password: formData.password }
            : { name: formData.name, email: formData.email, password: formData.password };

        try {
            const response = await fetch(`${API_BASE}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                if (!isLogin) {
                    showToast(t('signup_success'), 'success');
                    navigate('/verify-email-sent', { state: { email: formData.email } });
                    return;
                }
                
                const accessToken = data.access;
                const refreshToken = data.refresh;

                if (accessToken) {
                    localStorage.setItem('access_token', accessToken);
                    localStorage.setItem('refresh_token', refreshToken);
                    
                    // Fetch or use user info
                    let userData = data.user;
                    if (!userData) {
                        const userRes = await fetch(`${API_BASE}/auth/me/`, {
                            headers: { 'Authorization': `Bearer ${accessToken}` }
                        });
                        userData = await userRes.json();
                    }
                    
                    login(userData, data);
                    showToast(t('login_success'), 'success');
                    navigate('/dashboard');
                } else {
                    showToast('Unexpected response from server', 'error');
                }
            } else {
                // If backend returns a specific error for unverified users
                const errorMessage = data.error || data.detail || 'Operation failed';
                showToast(errorMessage, 'error');
            }
        } catch (err) {
            console.error('Auth error:', err);
            showToast('Connection failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-notion-bg text-notion-text overflow-hidden transition-colors duration-300">

            <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-notion-sidebar border-r border-notion-border">
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale transition-all duration-500"></div>
                </div>

                <Link to="/" className="relative z-10 flex items-center gap-2 text-notion-muted hover:text-notion-text transition-colors w-fit group">
                    <div className="p-2 rounded-full bg-notion-hover border border-notion-border group-hover:bg-notion-border transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    <span>{t('back_future')}</span>
                </Link>

                <div className="relative z-10 max-w-lg min-h-[220px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuoteIndex}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="h-[2px] w-12 bg-notion-emerald mb-6 rounded-full"></div>
                            <blockquote className="text-3xl font-light leading-snug mb-6 font-serif text-notion-text">
                                "{quotes[currentQuoteIndex].text}"
                            </blockquote>
                            <cite className="not-italic text-xs font-bold tracking-wider uppercase font-mono text-notion-emerald">
                                — {quotes[currentQuoteIndex].author}
                            </cite>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="relative z-10 text-sm text-notion-muted">
                    &copy; 2026 Cresta AI.
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">

                <motion.div
                    layout
                    className="w-full max-w-md relative z-10"
                >
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold mb-2 text-notion-text">
                            {isLogin ? t('auth_welcome_back') : t('create_account')}
                        </h2>
                        <p className="text-notion-muted">
                            {isLogin ? t('login_subtitle') : t('signup_subtitle')}
                        </p>
                    </div>

                    <div className="apple-glass apple-card-glow p-8 md:p-10 rounded-3xl relative overflow-hidden shadow-2xl border border-notion-border/50">
                        {/* Ambient Background Glow */}
                        <div className="absolute top-[-20%] right-[-20%] w-[140%] h-[140%] bg-gradient-radial from-notion-emerald/5 to-transparent blur-[60px] -z-10 pointer-events-none" />

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

                            <AnimatePresence mode="popLayout">
                                {!isLogin && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="relative group"
                                    >
                                        <User className="absolute left-4 top-[18px] h-5 w-5 text-notion-muted group-focus-within:text-notion-emerald transition-colors" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required={!isLogin}
                                            placeholder=" "
                                            className="w-full bg-notion-hover/40 border border-notion-border/60 rounded-2xl px-12 py-4 text-notion-text outline-none focus:border-notion-emerald focus:bg-notion-hover focus:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 peer tracking-wide font-medium"
                                        />
                                        <label className="absolute left-11 top-4 text-sm text-notion-muted transition-all bg-notion-card px-1 ml-[-4px] pointer-events-none peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-notion-emerald peer-focus:font-bold peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-notion-emerald peer-[:not(:placeholder-shown)]:font-bold rounded-md">
                                            {t('full_name')}
                                        </label>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="relative group">
                                <Mail className="absolute left-4 top-[18px] h-5 w-5 text-notion-muted group-focus-within:text-notion-emerald transition-colors" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    placeholder=" "
                                    className="w-full bg-notion-hover/40 border border-notion-border/60 rounded-2xl px-12 py-4 text-notion-text outline-none focus:border-notion-emerald focus:bg-notion-hover focus:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 peer tracking-wide font-medium"
                                />
                                <label className="absolute left-11 top-4 text-sm text-notion-muted transition-all bg-notion-card px-1 ml-[-4px] pointer-events-none peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-notion-emerald peer-focus:font-bold peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-notion-emerald peer-[:not(:placeholder-shown)]:font-bold rounded-md">
                                    {t('email_address')}
                                </label>
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-[18px] h-5 w-5 text-notion-muted group-focus-within:text-notion-emerald transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    placeholder=" "
                                    className="w-full bg-notion-hover/40 border border-notion-border/60 rounded-2xl pl-12 pr-12 py-4 text-notion-text outline-none focus:border-notion-emerald focus:bg-notion-hover focus:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 peer tracking-wide font-medium"
                                />
                                <label className="absolute left-11 top-4 text-sm text-notion-muted transition-all bg-notion-card px-1 ml-[-4px] pointer-events-none peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-notion-emerald peer-focus:font-bold peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-notion-emerald peer-[:not(:placeholder-shown)]:font-bold rounded-md">
                                    {t('password')}
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

                            {isLogin && (
                                <div className="flex justify-end">
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs font-bold text-notion-muted hover:text-notion-emerald transition-colors"
                                    >
                                        {t('forgot_password')}
                                    </Link>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full stark-btn-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <div className="h-5 w-5 border-2 border-notion-text/30 border-t-notion-text rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>{isLogin ? t('sign_in') : t('create_account')}</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="my-8 flex items-center gap-4 relative z-10">
                            <div className="h-px bg-notion-border flex-1"></div>
                            <span className="text-notion-muted text-xs font-bold uppercase tracking-wider">{t('or_continue_with')}</span>
                            <div className="h-px bg-notion-border flex-1"></div>
                        </div>

                        <div className="flex flex-col gap-4 relative z-10">
                            <button type="button" onClick={() => loginWithGoogle()} className="flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-notion-border/60 hover:bg-notion-hover hover:border-notion-border bg-notion-card/50 transition-all duration-300 text-sm font-bold w-full text-notion-text hover:shadow-sm">
                                <Chrome className="w-5 h-5" /> Google
                            </button>
                        </div>
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-notion-muted">
                            {isLogin ? t('dont_have_account') : t('already_have_account')} {' '}
                            <button
                                onClick={toggleMode}
                                className="text-notion-emerald hover:underline font-medium"
                            >
                                {isLogin ? t('sign_up') : t('log_in')}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AuthPage;
