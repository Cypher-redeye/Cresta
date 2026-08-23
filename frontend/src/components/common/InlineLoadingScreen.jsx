import React from 'react';
import Logo from './Logo';

const InlineLoadingScreen = ({ text = "Loading...", subtext = "" }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 w-full h-full min-h-[300px]">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-emerald-500/10 blur-[30px] rounded-full animate-pulse" />
                <Logo width={64} height={64} animateDrawing={true} className="relative z-10 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <h2 className="text-xl font-bold text-notion-text tracking-tight animate-pulse">
                {text}
            </h2>
            {subtext && (
                <p className="mt-2 text-sm text-notion-muted">
                    {subtext}
                </p>
            )}
        </div>
    );
};

export default InlineLoadingScreen;
