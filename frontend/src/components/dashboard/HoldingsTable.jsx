import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpDown, BarChart2, Trash2, Edit2, Check, X, Sparkles, X as XIcon } from 'lucide-react';
import PredictiveChart from './PredictiveChart';
import { SignalBadge } from './AlertBanner';
import StockLogo from '../common/StockLogo';
import { useLenis } from 'lenis/react';
import Skeleton from '../common/Skeleton';
import InlineLoadingScreen from '../common/InlineLoadingScreen';

const MiniSparkline = ({ data = [] }) => {
    if (!data || data.length < 2) return <div className="w-full h-8 flex items-center justify-center text-[10px] text-gray-500 opacity-30">No trend</div>;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const isPositive = data[data.length - 1] >= data[0];
    const color = isPositive ? '#00ff66' : '#ff0055';

    // Map data points into x, y coordinates
    const coords = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 80 - 10; // scale to 80% height with 10% padding
        return { x, y };
    });

    // Formulate a beautiful, fluid Cubic Bezier curve path
    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
        const curr = coords[i];
        const next = coords[i + 1];
        const cp1x = curr.x + (next.x - curr.x) / 2;
        const cp1y = curr.y;
        const cp2x = curr.x + (next.x - curr.x) / 2;
        const cp2y = next.y;
        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    const fillD = `${pathD} L 100 100 L 0 100 Z`;

    return (
        <div className="w-20 h-9 flex items-center">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" style={{ filter: `drop-shadow(0 2px 6px ${color}1a)` }}>
                <defs>
                    <linearGradient id={`sparkGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.12" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={fillD}
                    fill={`url(#sparkGrad-${color.replace('#', '')})`}
                    stroke="none"
                />
                <path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};

const HoldingsTable = ({ holdings = [], onDelete, onUpdate, signals = {}, isLoading = false }) => {
    const { t } = useTranslation();
    const [analyzingStock, setAnalyzingStock] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editQty, setEditQty] = useState('');
    const [editAvg, setEditAvg] = useState('');
    const [drawerStock, setDrawerStock] = useState(null);
    const lenis = useLenis();

    useEffect(() => {
        if (!drawerStock) return;
        lenis?.stop();
        return () => lenis?.start();
    }, [drawerStock, lenis]);

    const [liveHoldings, setLiveHoldings] = useState([]);
    const [flashCells, setFlashCells] = useState({});

    // Sync with upstream holdings
    useEffect(() => {
        setLiveHoldings(holdings);
    }, [holdings]);

    // Lock body scroll when drawer is open
    useEffect(() => {
        const mainEl = document.getElementById('dashboard-main');
        if (drawerStock) {
            document.body.style.overflow = 'hidden';
            if (mainEl) mainEl.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            if (mainEl) mainEl.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            if (mainEl) mainEl.style.overflow = '';
        };
    }, [drawerStock]);

    // Simulated WebSocket Live Pulse
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveHoldings(prev => {
                if (!prev || prev.length === 0) return prev;
                const next = [...prev];
                const newFlashes = {};
                
                // Pick 1 to 3 random stocks to "tick"
                const numToJitter = Math.floor(Math.random() * 3) + 1;
                for(let i=0; i<numToJitter; i++) {
                    const idx = Math.floor(Math.random() * next.length);
                    const stock = {...next[idx]};
                    
                    // Jitter by -0.2% to +0.2%
                    const changePct = (Math.random() - 0.5) * 0.004; 
                    const oldLtp = stock.ltp || stock.avg || 100;
                    stock.ltp = oldLtp * (1 + changePct);
                    
                    newFlashes[stock.id] = changePct >= 0 ? 'up' : 'down';
                    next[idx] = stock;
                }
                
                setFlashCells(newFlashes);
                
                // Clear the flash effect after 800ms
                setTimeout(() => {
                    setFlashCells(currentFlashes => {
                        const copy = {...currentFlashes};
                        Object.keys(newFlashes).forEach(k => delete copy[k]);
                        return copy;
                    });
                }, 800);

                return next;
            });
        }, 3500); // Pulse every 3.5s

        return () => clearInterval(interval);
    }, []);

    const startEdit = (stock) => {
        setEditingId(stock.id);
        setEditQty(stock.qty.toString());
        setEditAvg(stock.avg.toString());
    };

    const saveEdit = (stock) => {
        if (onUpdate && editQty && editAvg) {
            onUpdate(stock.id, {
                qty: parseInt(editQty),
                avg_price: parseFloat(editAvg)
            });
        }
        setEditingId(null);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="apple-glass rounded-2xl overflow-hidden"
            >
                <div className="p-6 flex justify-between items-center bg-transparent">
                    <h3 className="text-xl font-bold text-notion-text tracking-tight">{t('holdings', 'Holdings')}</h3>
                    <span className="apple-subtitle">{holdings.length} {t('stocks')}</span>
                </div>

                <div className="hidden md:block overflow-x-auto px-2 pb-4">
                    <table className="w-full border-collapse">
                        <thead className="text-[10px] md:text-xs font-semibold text-notion-muted uppercase tracking-wider">
                            <tr>
                                <th className="pl-6 pr-3 py-4 text-left font-medium">
                                    <div className="flex items-center gap-1">{t('instrument')} <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                                </th>
                                <th className="px-3 py-4 text-right font-medium">{t('qty')}</th>
                                <th className="px-3 py-4 text-right text-xs font-medium">{t('avg_price')}</th>
                                <th className="px-3 py-4 text-right font-medium">{t('ltp')}</th>
                                <th className="px-3 py-4 text-right font-medium">{t('pnl')}</th>
                                <th className="px-3 py-4 text-right font-medium">{t('trend', 'Trend')}</th>
                                <th className="px-3 py-4 text-center font-medium">{t('signal')}</th>
                                <th className="pl-3 pr-6 py-4 text-right font-medium">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="space-y-1">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12">
                                        <InlineLoadingScreen text="Loading Holdings..." subtext="Fetching your portfolio data" />
                                    </td>
                                </tr>
                            ) : holdings.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-sm text-notion-muted">
                                        {t('no_holdings_yet')}
                                    </td>
                                </tr>
                            ) : liveHoldings.filter(s => s && s.qty != null).map((stock) => {
                                const avg = stock.avg || 0;
                                const ltp = stock.ltp || avg;
                                const qty = stock.qty || 0;
                                const currentValue = qty * ltp;
                                const investedValue = qty * avg;
                                const pnl = currentValue - investedValue;
                                const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
                                const isProfit = pnl >= 0;
                                const isEditing = editingId === stock.id;

                                return (
                                    <tr key={stock.id} onClick={(e) => { if(!isEditing && !e.target.closest('button') && !e.target.closest('input')) setDrawerStock(stock); }} className="hover:bg-notion-hover/40 transition-all duration-300 group rounded-xl cursor-pointer">
                                        <td className="pl-6 pr-3 py-4 whitespace-nowrap rounded-l-xl">
                                            <div className="flex items-center gap-3">
                                                <StockLogo ticker={stock.ticker} name={stock.name} size={32} />
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm text-notion-text">{stock.name}</span>
                                                    <span className="text-[10px] text-notion-muted font-mono mt-0.5">{stock.ticker}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-right text-xs text-notion-text">
                                            {isEditing ? (
                                                <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)}
                                                    className="w-16 px-2 py-1 bg-notion-bg border border-notion-border rounded text-right text-xs text-notion-text" />
                                            ) : qty}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-right text-xs text-notion-text">
                                            {isEditing ? (
                                                <input type="number" step="0.01" value={editAvg} onChange={e => setEditAvg(e.target.value)}
                                                    className="w-20 px-2 py-1 bg-notion-bg border border-notion-border rounded text-right text-xs text-notion-text" />
                                            ) : `₹${avg.toFixed(2)}`}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-right">
                                            <div className={`px-2 py-1 inline-block rounded text-xs font-medium text-notion-text transition-colors duration-1000 ${
                                                flashCells[stock.id] === 'up' ? 'bg-emerald-500/20 text-emerald-500 !transition-none' : 
                                                flashCells[stock.id] === 'down' ? 'bg-red-500/20 text-red-500 !transition-none' : 
                                                ''
                                            }`}>
                                                ₹{ltp.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-right">
                                            <div className={`flex flex-col items-end ${isProfit ? 'text-notion-emerald' : 'text-[#ff0055]'}`}>
                                                <span className="font-bold flex items-center gap-1">
                                                    {isProfit ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                    {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                </span>
                                                <span className="text-[10px] opacity-80">
                                                    ({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-right">
                                            {/* Mock data for sparkline until backend provides history per stock */}
                                            <MiniSparkline data={(() => {
                                                const seed = stock.ticker.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
                                                const base = ltp;
                                                const trend = [base * 0.95];
                                                for(let i=1; i<10; i++) {
                                                    const prev = trend[i-1];
                                                    const change = (Math.sin(seed + i) * 0.05);
                                                    trend.push(prev * (1 + change));
                                                }
                                                // Ensure it matches ltp at end roughly
                                                trend[trend.length-1] = ltp;
                                                return trend;
                                            })()} />
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-center">
                                            {(() => {
                                                const sig = signals[stock.id];
                                                return sig ? (
                                                    <div className="group/sig relative inline-block">
                                                        <SignalBadge signal={sig.signal} />
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-notion-card border border-notion-border rounded-lg text-left opacity-0 group-hover/sig:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                                                            <p className="text-[10px] text-notion-text mb-1">{sig.reason}</p>
                                                            <p className="text-[10px] text-notion-emerald font-bold">{sig.action}</p>
                                                        </div>
                                                    </div>
                                                ) : <span className="text-[10px] text-notion-muted">—</span>;
                                            })()}
                                        </td>
                                        <td className="pl-3 pr-6 py-3 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={() => saveEdit(stock)}
                                                            className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-emerald-500 transition-all" title="Save">
                                                            <Check size={14} />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)}
                                                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition-all" title="Cancel">
                                                            <X size={14} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => setAnalyzingStock(stock.ticker)}
                                                            className="p-1.5 hover:bg-notion-emerald-bg rounded-lg text-notion-emerald transition-all" title="Prediction">
                                                            <BarChart2 size={14} />
                                                        </button>
                                                        <button onClick={() => startEdit(stock)}
                                                            className="p-1.5 hover:bg-blue-500/10 rounded-lg text-blue-400 transition-all opacity-0 group-hover:opacity-100" title="Edit">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => onDelete && onDelete(stock.id)}
                                                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition-all opacity-0 group-hover:opacity-100" title="Delete">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Gesture-Driven Mobile View */}
                <div className="md:hidden flex flex-col gap-3 px-4 pb-4">
                    {isLoading ? (
                        <InlineLoadingScreen text="Loading Holdings..." />
                    ) : liveHoldings.length === 0 ? (
                        <div className="px-6 py-12 text-center text-sm text-notion-muted bg-notion-card rounded-xl border border-notion-border">
                            {t('no_holdings_yet')}
                        </div>
                    ) : liveHoldings.filter(s => s && s.qty != null).map((stock) => {
                        const avg = stock.avg || 0;
                        const ltp = stock.ltp || avg;
                        const qty = stock.qty || 0;
                        const currentValue = qty * ltp;
                        const investedValue = qty * avg;
                        const pnl = currentValue - investedValue;
                        const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
                        const isProfit = pnl >= 0;
                        const flash = flashCells[stock.id];

                        return (
                            <div key={`mobile-${stock.id}`} className="relative rounded-xl overflow-hidden bg-notion-hover border border-notion-border/50">
                                {/* Actions underneath (revealed on swipe left) */}
                                <div className="absolute inset-y-0 right-0 flex items-center justify-end px-3 gap-2 z-0 w-[140px]">
                                    <button onClick={() => setAnalyzingStock(stock.ticker)}
                                        className="p-2.5 bg-notion-emerald/20 text-notion-emerald rounded-lg shadow-sm" title="Prediction">
                                        <BarChart2 size={16} />
                                    </button>
                                    <button onClick={() => startEdit(stock)}
                                        className="p-2.5 bg-blue-500/20 text-blue-400 rounded-lg shadow-sm" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => onDelete && onDelete(stock.id)}
                                        className="p-2.5 bg-red-500/20 text-red-400 rounded-lg shadow-sm" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Draggable Foreground Card */}
                                <motion.div 
                                    drag="x" 
                                    dragConstraints={{ left: -140, right: 0 }}
                                    dragElastic={0.1}
                                    className="bg-notion-card p-4 rounded-xl relative z-10 w-full flex flex-col gap-3 shadow-sm"
                                    onClick={() => setDrawerStock(stock)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <StockLogo ticker={stock.ticker} name={stock.name} size={32} />
                                            <div>
                                                <span className="font-bold text-[15px] text-notion-text">{stock.name}</span>
                                                <p className="text-[11px] text-notion-muted font-mono mt-0.5">{stock.ticker}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`px-2 py-0.5 rounded text-sm font-bold text-notion-text transition-colors duration-1000 ${
                                                flash === 'up' ? 'bg-emerald-500/20 text-emerald-500 !transition-none' : 
                                                flash === 'down' ? 'bg-red-500/20 text-red-500 !transition-none' : ''
                                            }`}>
                                                ₹{ltp.toFixed(2)}
                                            </div>
                                            <p className="text-[10px] text-notion-muted mt-1">Avg: ₹{avg.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end border-t border-notion-border/50 pt-2">
                                        <div>
                                            <p className="text-[10px] text-notion-muted mb-0.5 uppercase tracking-wider">Quantity</p>
                                            <p className="font-mono text-sm text-notion-text">{qty}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-notion-muted mb-0.5 uppercase tracking-wider">Total P&L</p>
                                            <div className={`flex items-center gap-1 text-sm font-bold ${isProfit ? 'text-notion-emerald' : 'text-[#ff0055]'}`}>
                                                {isProfit ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                <span className="text-[10px] opacity-80 font-normal">({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Swipe Hint indicator */}
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 flex flex-col gap-0.5">
                                        <div className="w-1 h-1 rounded-full bg-notion-muted"></div>
                                        <div className="w-1 h-1 rounded-full bg-notion-muted"></div>
                                        <div className="w-1 h-1 rounded-full bg-notion-muted"></div>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>

            </motion.div>

            {/* Prediction Modal — outside motion.div so fixed positioning works */}
            {analyzingStock && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 cursor-pointer"
                    onClick={() => setAnalyzingStock(null)}>
                    <div className="w-full max-w-3xl cursor-default" onClick={e => e.stopPropagation()}>
                        <PredictiveChart
                            symbol={analyzingStock}
                            onClose={() => setAnalyzingStock(null)}
                        />
                    </div>
                </div>
            )}
            {/* Holdings Drawer */}
            {createPortal(
            <AnimatePresence>
                {drawerStock && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[70] cursor-pointer"
                            onClick={() => setDrawerStock(null)}
                        />
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-notion-bg border-l border-notion-border z-[80] shadow-2xl flex flex-col apple-glass"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between p-6 border-b border-notion-border/50 bg-notion-bg/50">
                                <div className="flex items-center gap-3">
                                    <StockLogo ticker={drawerStock.ticker} name={drawerStock.name} size={40} />
                                    <div>
                                        <h3 className="text-xl font-bold text-notion-text tracking-tight">{drawerStock.name}</h3>
                                        <p className="text-sm font-mono text-notion-muted">{drawerStock.ticker}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDrawerStock(null)}
                                    className="p-2 rounded-full hover:bg-notion-hover text-notion-muted hover:text-notion-text transition-colors"
                                >
                                    <XIcon size={20} />
                                </button>
                            </div>

                            {/* Drawer Content */}
                            <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-6 space-y-8">
                                {/* AI Summary Block */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-notion-text">AI Analysis</h4>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-notion-emerald/20 text-notion-emerald border border-notion-emerald/30">
                                            {signals[drawerStock.id]?.signal || 'Neutral'}
                                        </span>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-notion-card border border-notion-border shadow-sm relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-notion-emerald/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <p className="text-[15px] leading-relaxed text-notion-text relative z-10">
                                            {signals[drawerStock.id]?.reason || `Based on current market conditions and ${drawerStock.name}'s historical volatility, the AI models indicate a stable holding pattern. Recent sector rotations suggest monitoring for potential upside breakouts.`}
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-notion-border/50 flex items-center justify-between">
                                            <span className="text-xs text-notion-muted font-medium">Action</span>
                                            <span className="text-sm font-bold text-notion-text">{signals[drawerStock.id]?.action || 'Hold Position'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats Block */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-notion-text">Position Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-notion-hover/30 border border-notion-border/50">
                                            <div className="text-[10px] text-notion-muted uppercase font-semibold mb-1">Average Price</div>
                                            <div className="text-lg font-mono font-bold text-notion-text">₹{(drawerStock.avg || 0).toLocaleString('en-IN')}</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-notion-hover/30 border border-notion-border/50">
                                            <div className="text-[10px] text-notion-muted uppercase font-semibold mb-1">Current Value</div>
                                            <div className="text-lg font-mono font-bold text-notion-text">₹{((drawerStock.qty || 0) * (drawerStock.ltp || drawerStock.avg || 0)).toLocaleString('en-IN')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Drawer Footer */}
                            <div className="p-6 border-t border-notion-border/50 bg-notion-bg/80 backdrop-blur-md">
                                <button 
                                    onClick={() => {
                                        setAnalyzingStock(drawerStock.ticker);
                                        setDrawerStock(null);
                                    }}
                                    className="w-full py-3 rounded-xl bg-notion-text text-notion-bg font-bold shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                                    <BarChart2 size={18} />
                                    View Full Analytics
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>, document.body)}
        </>
    );
};

export default HoldingsTable;
