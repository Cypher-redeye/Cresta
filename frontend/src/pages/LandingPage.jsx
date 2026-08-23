import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import About from '../components/landing/About';
import Footer from '../components/layout/Footer';
import BackgroundEffects from '../components/landing/BackgroundEffects';
import IntroSequence from '../components/landing/IntroSequence';
import ScrollPath from '../components/landing/ScrollPath';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [introComplete, setIntroComplete] = useState(false);

    const handleIntroComplete = () => {
        setIntroComplete(true);
        window.__CRESTA_INTRO_ACTIVE = false;
    };

    // Set initial global state
    if (typeof window !== 'undefined' && !introComplete) {
        window.__CRESTA_INTRO_ACTIVE = true;
    }

    return (
        <div className="min-h-screen selection:bg-emerald-300/30 dark:selection:bg-neon-emerald/30 transition-colors duration-300 relative bg-transparent">
            {/* Intro scroll space comes first — user scrolls through this */}
            {!introComplete && (
                <IntroSequence onComplete={handleIntroComplete} isDark={isDark} />
            )}

            {/* Homepage content follows in normal document flow.
                As the user scrolls past the intro, the black overlay fades
                and they naturally arrive at this content. */}
            <BackgroundEffects isDark={isDark} />
            <Navbar />
            <main className="relative z-10 flex flex-col">
                <ScrollPath isDark={isDark} />
                <Hero />
                <Features />
                <About />
            </main>
            <div className="relative z-10">
                <Footer />
            </div>
        </div>
    );
};

export default LandingPage;
