import React from 'react';
import Header from './DashboardHeader';
import FloatingDock from './FloatingDock';

const DashboardLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-notion-bg text-notion-text flex flex-col transition-colors duration-300">
            <Header />
            <main id="dashboard-main" className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-12 relative z-10 overflow-x-hidden w-full max-w-[1600px] mx-auto pb-28">
                {children}
            </main>
            <FloatingDock />
        </div>
    );
};

export default DashboardLayout;
