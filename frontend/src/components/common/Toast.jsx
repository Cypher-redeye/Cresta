import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-emerald-400 shrink-0" />,
};

const bgColors = {
    success: 'bg-emerald-900/90 border-emerald-500/30 text-emerald-50',
    error: 'bg-red-900/90 border-red-500/30 text-red-50',
    info: 'bg-notion-card border-notion-border text-notion-text',
};

const Toast = ({ message, type = 'info', onDismiss }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full border shadow-xl backdrop-blur-xl min-w-[300px] max-w-sm ${bgColors[type] || bgColors.info}`}
        >
            {icons[type] || icons.info}
            <span className="text-[13px] font-medium leading-tight flex-1">{message}</span>
            <button
                onClick={onDismiss}
                className="ml-2 opacity-50 hover:opacity-100 transition-opacity shrink-0"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    );
};

export default Toast;
