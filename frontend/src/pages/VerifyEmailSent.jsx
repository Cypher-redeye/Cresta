import React from 'react';
import { Mail } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const VerifyEmailSent = () => {
  const { state } = useLocation();
  const email = state?.email || "your email";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0d0d0d] p-6">
      <div className="max-w-md w-full glass-panel p-10 rounded-3xl border border-gray-200 dark:border-emerald-500/20 shadow-2xl bg-white dark:bg-fintech-card/30 backdrop-blur-xl text-center">
        <div className="w-20 h-20 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          <Mail className="w-10 h-10 text-emerald-600 dark:text-emerald-500" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Check your inbox</h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          We've sent a verification link to <br/>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{email}</span>
        </p>
        
        <div className="space-y-4">
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            The link will expire in 24 hours. If you don't see it, check your spam folder.
          </p>
          
          <div className="pt-6 border-t border-gray-100 dark:border-white/5">
            <Link 
              to="/auth" 
              className="text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailSent;
