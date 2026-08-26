import React, { Suspense, lazy, useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ProtectedRoute from './components/auth/ProtectedRoute';

import { UserProvider } from './context/UserContext';
import { SearchProvider } from './context/SearchContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { PerformanceProvider } from './context/PerformanceContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import SplashScreen from './components/common/SplashScreen';
import CommandPalette from './components/common/CommandPalette';

import { useTheme } from './context/ThemeContext';
import { ReactLenis, useLenis } from 'lenis/react';

// Route-level code splitting — each page loads only when navigated to
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RiskAssessment = lazy(() => import('./pages/RiskAssessment'));
const MarketsPage = lazy(() => import('./pages/MarketsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const BacktestPage = lazy(() => import('./pages/BacktestPage'));
const VerifyEmailSent = lazy(() => import('./pages/VerifyEmailSent'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

import LoadingScreen from './components/common/LoadingScreen';

// Page Transition Wrapper
const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

function ScrollToTop() {
  const { pathname } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, lenis]);

  return null;
}

// Animated Routes Component
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <PageTransition><Dashboard /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/risk-assessment" element={
          <ProtectedRoute>
            <PageTransition><RiskAssessment /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/markets" element={<PageTransition><MarketsPage /></PageTransition>} />
        <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
        <Route path="/backtest" element={
          <ProtectedRoute>
            <PageTransition><BacktestPage /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <PageTransition><SettingsPage /></PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/verify-email-sent" element={<PageTransition><VerifyEmailSent /></PageTransition>} />
        <Route path="/verify-email" element={<PageTransition><VerifyEmail /></PageTransition>} />
        <Route path="*" element={<PageTransition><LandingPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [splashDone, setSplashDone] = useState(() => {
    // On mobile / small screens, load immediately without 3.6s delay
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothTouch: false }}>
      <div className="min-h-screen">
        <ErrorBoundary>
          <PerformanceProvider>
            <ThemeProvider>
                {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
                <UserProvider>
                  <ToastProvider>
                    <Router>
                      <ScrollToTop />
                      <SearchProvider>
                        <CommandPalette />
                        <Suspense fallback={<LoadingScreen />}>
                          <AnimatedRoutes />
                        </Suspense>
                      </SearchProvider>
                    </Router>

                  </ToastProvider>
                </UserProvider>
            </ThemeProvider>
          </PerformanceProvider>
        </ErrorBoundary>
      </div>
    </ReactLenis>
  );
}

export default App;
