import React from 'react';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const VerifyEmailSent = () => {
    const { t } = useTranslation();
  const { state } = useLocation();
  const email = state?.email || "your email";

  return (
    <div className="min-h-screen flex items-center justify-center bg-notion-bg text-notion-text p-6">
      <div className="max-w-md w-full bg-notion-card border border-notion-border p-10 rounded-3xl shadow-sm text-center">
        <div className="w-20 h-20 bg-notion-emerald-bg rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          <Mail className="w-10 h-10 text-notion-emerald" />
        </div>
        
        <h2 className="text-3xl font-bold text-notion-text mb-4">{t('check_your_inbox')}</h2>
        
        <p className="text-notion-muted mb-6 leading-relaxed">
          {t('verification_link_sent')} <br/>
          <span className="text-notion-emerald font-semibold">{email}</span>
        </p>
        
        <div className="space-y-4">
          <p className="text-notion-muted text-sm">
            {t('link_expiry_notice')}
          </p>
          
          <div className="pt-6 border-t border-notion-border">
            <Link 
              to="/auth" 
              className="text-notion-emerald hover:text-notion-emerald/80 font-medium transition-colors"
            >
              {t('back_to_sign_in')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailSent;
