import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';

import { UserProvider } from './context/UserContext';
import { SearchProvider } from './context/SearchContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useTheme } from './context/ThemeContext';


// Route-level code splitting — each page loads only when navigated to
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RiskAssessment = lazy(() => import('./pages/RiskAssessment'));
const MarketsPage = lazy(() => import('./pages/MarketsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const VerifyEmailSent = lazy(() => import('./pages/VerifyEmailSent'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

// Minimal loading fallback
const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: 'var(--bg-primary, #0a0e1a)'
  }}>
    <div style={{
      width: 40, height: 40, border: '3px solid rgba(0,200,255,0.2)',
      borderTop: '3px solid #00c8ff', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <div className="min-h-screen">
      <ErrorBoundary>
        <ThemeProvider>
            <UserProvider>
              <ToastProvider>
                <Router>
                  <SearchProvider>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/dashboard" element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="/risk-assessment" element={
                          <ProtectedRoute>
                            <RiskAssessment />
                          </ProtectedRoute>
                        } />
                        <Route path="/markets" element={<MarketsPage />} />
                        <Route path="/settings" element={
                          <ProtectedRoute>
                            <SettingsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
                        <Route path="/verify-email" element={<VerifyEmail />} />
                        <Route path="*" element={<LandingPage />} />
                      </Routes>
                    </Suspense>
                  </SearchProvider>
                </Router>
              </ToastProvider>
            </UserProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;
