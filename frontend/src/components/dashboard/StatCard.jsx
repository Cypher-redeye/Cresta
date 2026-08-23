import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import CountUp from '../common/CountUp';

const StatCard = ({ title, value, change, isPositive, icon: Icon, delay, subtitle }) => {
    // Parse the value string (e.g., "₹24,500.00" -> prefix="₹", val=24500, suffix="")
    const parseValue = (str) => {
        const match = str.match(/^([^\d-]*)(-?[\d,.]+)([^\d]*)$/);
        if (match) {
            return {
                prefix: match[1],
                val: parseFloat(match[2].replace(/,/g, '')),
                suffix: match[3]
            };
        }
        return { prefix: '', val: 0, suffix: '' };
    };

    const { prefix, val, suffix } = parseValue(value);
    const decimalPlaces = (val.toString().split('.')[1] || '').length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, delay }}
            whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
            className="apple-glass apple-card-glow p-6 rounded-3xl relative overflow-hidden group shadow-sm"
        >
            {/* Shimmer effect inside the card on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_2s_infinite]" />

            {/* Ambient Glow behind icon */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] -z-10 transition-all duration-500 opacity-40 group-hover:opacity-100 ${isPositive ? 'bg-accent-emerald-bg' : 'bg-[#ff0055]/10'}`} />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-notion-muted mb-2">{title}</p>
                    <h3 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-notion-text to-notion-muted tracking-tighter monospace-stats">
                        {/* If it's not a valid number parse, fallback to raw string, otherwise animate */}
                        {isNaN(val) ? value : (
                            <CountUp value={val} prefix={prefix} suffix={suffix} decimals={decimalPlaces} duration={2.5} />
                        )}
                    </h3>
                </div>
                <div className={`p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-sm ${isPositive ? 'bg-notion-bg text-notion-emerald border border-notion-emerald/20' : 'bg-notion-bg text-[#ff0055] border border-[#ff0055]/20'}`}>
                    <Icon size={20} />
                </div>
            </div>

            <div className="flex items-center gap-3 text-sm relative z-10">
                <span className={`flex items-center font-bold text-xs px-2.5 py-1 rounded-lg monospace-stats border ${isPositive ? 'text-notion-emerald bg-notion-emerald-bg border-notion-emerald/10' : 'text-[#ff0055] bg-[#ff0055]/8 border-[#ff0055]/10'}`}>
                    {isPositive ? <TrendingUp size={14} className="mr-1.5" /> : <TrendingDown size={14} className="mr-1.5" />}
                    {change}
                </span>
                <span className="text-notion-muted text-xs font-semibold">{subtitle || 'vs last month'}</span>
            </div>
        </motion.div>
    );
};

export default StatCard;
