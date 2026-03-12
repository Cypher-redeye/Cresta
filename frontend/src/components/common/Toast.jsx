import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-emerald-400 shrink-0" />,
};

const bgColors = {
    success: 'bg-emerald-900/80 border-emerald-500/40',
    error: 'bg-red-900/80 border-red-500/40',
    info: 'bg-gray-800/90 border-emerald-500/40',
};

const Toast = ({ message, type = 'info', onDismiss }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl max-w-sm ${bgColors[type] || bgColors.info}`}
        >
            {icons[type] || icons.info}
            <span className="text-sm font-medium text-white leading-tight">{message}</span>
            <button
                onClick={onDismiss}
                className="ml-2 text-white/50 hover:text-white transition-colors shrink-0"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

export default Toast;
