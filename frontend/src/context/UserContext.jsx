import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE, refreshToken } from '../api';

const UserContext = createContext();

// Helper: check if cached insights have real news headlines
const hasFreshHeadlines = () => {
    try {
        const cached = localStorage.getItem('ai_insights_data');
        if (!cached) return false;
        const data = JSON.parse(cached);
        const stocks = data?.Recommended_Stocks || [];
        if (stocks.length === 0) return false;
        // Check if at least one stock has real headlines with 'text' key
        return stocks.some(s => s.Headlines?.length > 0 && s.Headlines[0]?.text);
    } catch { return false; }
};

// Helper: auto-fetch AI recommendations if user has a saved profile but no cached insights
const fetchRecommendationsIfNeeded = async (profileData) => {
    if (!profileData?.risk_profile) return;
    // Re-fetch if no data OR if existing data has stale/missing headlines
    if (localStorage.getItem('ai_insights_data') && hasFreshHeadlines()) return;
    if (!profileData.risk_score || !profileData.age || !profileData.income || !profileData.investment_goal) return;

    try {
        const token = localStorage.getItem('access_token');

        // Normalize risk_score: DB may store 1-5 (from recommend_api) or 8-32 (from save_profile)
        let riskTolerance = profileData.risk_score;
        if (riskTolerance > 5) {
            // Map 8-32 raw score to 1-5 Risk_Tolerance
            if (riskTolerance <= 12) riskTolerance = 1;
            else if (riskTolerance <= 18) riskTolerance = 2;
            else if (riskTolerance <= 24) riskTolerance = 3;
            else if (riskTolerance <= 28) riskTolerance = 4;
            else riskTolerance = 5;
        }

        const res = await fetch(`${API_BASE}/recommend/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                Age: profileData.age,
                Income: profileData.income,
                Risk_Tolerance: riskTolerance,
                Investment_Goal: profileData.investment_goal
            })
        });
        if (res.ok) {
            const aiData = await res.json();
            if (aiData.Recommended_Stocks) {
                localStorage.setItem('ai_insights_data', JSON.stringify(aiData));
                window.dispatchEvent(new Event('ai_insights_updated'));
            }
        }
    } catch (e) {
        console.error('Auto-fetch recommendations failed:', e);
    }
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [hasCompletedRiskAssessment, setHasCompletedRiskAssessment] = useState(() => {
        return localStorage.getItem('risk_assessment_completed') === 'true';
    });

    // On mount, validate the token by calling /auth/me/
    useEffect(() => {
        const validateSession = async () => {
            const token = localStorage.getItem('access_token');
            if (!token || !user) return;

            try {
                let res = await fetch(`${API_BASE}/auth/me/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Try refresh if expired
                if (res.status === 401) {
                    const refreshed = await refreshToken();
                    if (refreshed) {
                        const newToken = localStorage.getItem('access_token');
                        res = await fetch(`${API_BASE}/auth/me/`, {
                            headers: { 'Authorization': `Bearer ${newToken}` }
                        });
                    }
                }

                if (res.ok) {
                    const data = await res.json();
                    setUser(prev => ({ ...prev, ...data }));
                    if (data.risk_profile) {
                        setHasCompletedRiskAssessment(true);
                        localStorage.setItem('risk_assessment_completed', 'true');
                        // Auto-fetch recommendations if not cached
                        fetchRecommendationsIfNeeded(data);
                    }
                } else {
                    logout();
                }
            } catch {
                // Network error — keep user logged in (offline mode)
            }
        };

        validateSession();
    }, []);

    const login = (userData, tokens) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (userData?.risk_profile) {
            setHasCompletedRiskAssessment(true);
            localStorage.setItem('risk_assessment_completed', 'true');
        } else {
            setHasCompletedRiskAssessment(false);
            localStorage.removeItem('risk_assessment_completed');
        }

        if (tokens) {
            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);
        }

        // Auto-fetch AI recommendations in background after login
        if (userData?.risk_profile) {
            fetchRecommendationsIfNeeded(userData);
        }
    };

    const logout = () => {
        setUser(null);
        setHasCompletedRiskAssessment(false);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('risk_assessment_completed');
        localStorage.removeItem('ai_insights_data');
    };

    const completeRiskAssessment = (profileData = {}) => {
        setHasCompletedRiskAssessment(true);
        localStorage.setItem('risk_assessment_completed', 'true');
        setUser(prev => {
            const updated = {
                ...prev,
                ...profileData,
                needs_reassessment: false
            };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <UserContext.Provider value={{ user, login, logout, hasCompletedRiskAssessment, completeRiskAssessment }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
