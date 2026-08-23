import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import Logo from '../components/common/Logo';
import { API_BASE } from '../api';

const VerifyEmail = () => {
    const { t } = useTranslation();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    useEffect(() => {
        if (!token || !email) {
            setStatus('error');
            setMessage(t('invalid_link'));
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`${API_BASE}/auth/verify-email/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, email })
                });
                const data = await res.json();
                
                if (res.ok) {
                    setStatus('success');
                } else {
                    setStatus('error');
                    setMessage(data.error || t('verification_failed_generic'));
                }
            } catch (err) {
                setStatus('error');
                setMessage(t('connection_error_retry'));
            }
        };

        verify();
    }, [token, email, t]);

    const containerClasses = "min-h-screen flex items-center justify-center bg-notion-bg text-notion-text p-6";
    const cardClasses = "max-w-md w-full bg-notion-card border border-notion-border p-10 rounded-3xl shadow-sm text-center";

    if (status === 'loading') {
        return (
            <div className={containerClasses}>
                <div className={cardClasses}>
                    <div className="flex justify-center mb-6">
                        <Logo width={64} height={64} animateDrawing={true} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-notion-text">{t('verifying_email')}</h2>
                    <p className="text-notion-muted mt-2">{t('please_wait')}</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className={containerClasses}>
                <div className={cardClasses}>
                    <div className="w-20 h-20 bg-notion-emerald-bg rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-12 h-12 text-notion-emerald" />
                    </div>
                    <h2 className="text-3xl font-bold text-notion-text mb-4">{t('email_verified')}</h2>
                    <p className="text-notion-muted mb-8">
                        {t('email_verified_desc')}
                    </p>
                    <button 
                        onClick={() => navigate('/auth')}
                        className="w-full py-4 bg-notion-emerald hover:bg-notion-emerald/90 text-white font-bold rounded-2xl transition-all shadow-sm"
                    >
                        {t('go_to_sign_in')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            <div className={cardClasses}>
                <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                    <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-3xl font-bold text-notion-text mb-4">{t('verification_failed')}</h2>
                <p className="text-notion-muted mb-8">
                    {message || t('invalid_verification_link')}
                </p>
                <button 
                    onClick={() => navigate('/auth', { state: { isSignUp: true } })}
                    className="w-full py-4 bg-notion-hover border border-notion-border text-notion-text font-bold rounded-2xl transition-all hover:bg-notion-border"
                >
                    {t('back_to_sign_up')}
                </button>
            </div>
        </div>
    );
};

export default VerifyEmail;
