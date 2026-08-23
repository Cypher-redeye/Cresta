import React, { createContext, useContext, useState, useEffect } from 'react';

export const PerformanceContext = createContext();

export const PerformanceProvider = ({ children }) => {
    const [isLowPerformance, setIsLowPerformance] = useState(false);

    useEffect(() => {
        // Auto-detect device performance on mount
        if (typeof window !== 'undefined' && window.navigator) {
            const cores = navigator.hardwareConcurrency || 4;
            const memory = navigator.deviceMemory || 4;
            
            // Heuristic: If less than 4 cores or less than 4GB RAM, enable performance mode
            if (cores < 4 || memory < 4) {
                setIsLowPerformance(true);
                console.log('Performance Mode Auto-Enabled: Detected low-end device constraints.');
            }
        }
    }, []);

    const togglePerformanceMode = () => {
        setIsLowPerformance(prev => !prev);
    };

    return (
        <PerformanceContext.Provider value={{ isLowPerformance, togglePerformanceMode, setIsLowPerformance }}>
            {children}
        </PerformanceContext.Provider>
    );
};

export const usePerformance = () => useContext(PerformanceContext);
