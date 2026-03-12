import React, { useRef, useEffect, useState, useCallback } from 'react';
import createGlobe from 'cobe';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../../api';
import { useTheme } from '../../context/ThemeContext';

/* ─────────────────────────────────────────────────────────────────────
 * Exchanges
 * ──────────────────────────────────────────────────────────────────── */
const EXCHANGES = [
    {
        id: 'bse', name: 'BSE SENSEX', location: 'Dalal Street, Mumbai',
        lat: 18.9307, lng: 72.8334, region: 'India',
        fallback: { value: '78,205.98', change: '+639.82', percent: '+0.82%', positive: true },
        color: '#0891B2', flag: '🇮🇳',
    },
    {
        id: 'nse', name: 'NSE NIFTY 50', location: 'BKC, Mumbai',
        lat: 19.0654, lng: 72.8691, region: 'India',
        fallback: { value: '24,261.60', change: '+233.55', percent: '+0.97%', positive: true },
        color: '#0891B2', flag: '🇮🇳',
    },
    {
        id: 'lse', name: 'FTSE 100', location: 'Paternoster Sq, London',
        lat: 51.5142, lng: -0.0981, region: 'Europe',
        fallback: { value: '8,684.56', change: '+38.48', percent: '+0.45%', positive: true },
        color: '#7C3AED', flag: '🇬🇧',
    },
    {
        id: 'nyse', name: 'NYSE (DOW)', location: 'Wall Street, New York',
        lat: 40.7069, lng: -74.0089, region: 'North America',
        fallback: { value: '42,840.26', change: '+498.02', percent: '+1.18%', positive: true },
        color: '#2563EB', flag: '🇺🇸',
    },
    {
        id: 'b3', name: 'IBOVESPA', location: 'Rua XV, São Paulo',
        lat: -23.5505, lng: -46.6333, region: 'South America',
        fallback: { value: '131,902.31', change: '+1,204.56', percent: '+0.92%', positive: true },
        color: '#0D9488', flag: '🇧🇷',
    },
    {
        id: 'tse', name: 'NIKKEI 225', location: 'Nihonbashi, Tokyo',
        lat: 35.6762, lng: 139.6503, region: 'Asia',
        fallback: { value: '37,155.33', change: '+312.62', percent: '+0.85%', positive: true },
        color: '#DB2777', flag: '🇯🇵',
    },
    {
        id: 'asx', name: 'ASX 200', location: 'Bridge Street, Sydney',
        lat: -33.8688, lng: 151.2093, region: 'Oceania',
        fallback: { value: '8,115.20', change: '-22.40', percent: '-0.28%', positive: false },
        color: '#D97706', flag: '🇦🇺',
    },
];

/** One representative per region */
const REGION_REPS = [
    EXCHANGES[0], EXCHANGES[2], EXCHANGES[3],
    EXCHANGES[4], EXCHANGES[5], EXCHANGES[6],
];

/* ─────────────────────────────────────────────────────────────────────
 * Simple angular-distance detection (guaranteed correct)
 * ──────────────────────────────────────────────────────────────────── */
const normDeg = (d) => { d = d % 360; if (d > 180) d -= 360; if (d < -180) d += 360; return d; };
const phiToFacingLng = (phi) => -phi * 180 / Math.PI;

const findActiveExchange = (phi) => {
    const facingLng = phiToFacingLng(phi);
    let minDist = Infinity, best = REGION_REPS[0];
    for (const ex of REGION_REPS) {
        const dist = Math.abs(normDeg(facingLng - ex.lng));
        if (dist < minDist) { minDist = dist; best = ex; }
    }
    return best;
};

/* ─────────────────────────────────────────────────────────────────────
 * 3D → 2D projection using exact lat/lng coordinates
 * ──────────────────────────────────────────────────────────────────── */
const GLOBE_THETA = 0.15;

const latLngToVector3 = (lat, lng, radius, globeRotationY) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + globeRotationY) * (Math.PI / 180);
    return {
        x: -(radius * Math.sin(phi) * Math.cos(theta)),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta),
    };
};

/* ─────────────────────────────────────────────────────────────────────
 * Theme-aware colour palettes
 * ──────────────────────────────────────────────────────────────────── */
const LIGHT_GLOBE = {
    dark: 0,
    diffuse: 3,
    mapSamples: 24000,
    mapBrightness: 1.8,
    baseColor: [0.88, 0.92, 0.96],       // soft blue-grey sphere
    markerColor: [0.03, 0.57, 0.70],     // teal markers (#0891B2ish)
    glowColor: [0.85, 0.90, 0.96],       // subtle cool glow
};
const DARK_GLOBE = {
    dark: 1,
    diffuse: 1.2,
    mapSamples: 24000,
    mapBrightness: 6,
    baseColor: [0.15, 0.18, 0.25],
    markerColor: [0.1, 0.8, 0.9],
    glowColor: [0.05, 0.15, 0.25],
};

/* ─────────────────────────────────────────────────────────────────────
 * Main Component
 * ──────────────────────────────────────────────────────────────────── */
const IndiaGlobe = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const pointerInteracting = useRef(null);
    const pointerInteractionMovement = useRef(0);
    const phiRef = useRef(0);
    const lastPosUpdate = useRef(0);
    const globeRef = useRef(null);

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [liveData, setLiveData] = useState({});
    const [markerPositions, setMarkerPositions] = useState({});
    const currentActiveRef = useRef('BSE SENSEX');

    /* ── Fetch live BSE / NSE ──────────────────────────────── */
    useEffect(() => {
        const fetchLive = async () => {
            try {
                const [sensexRes, niftyRes] = await Promise.all([
                    fetch(`${API_BASE}/sensex/`).then(r => r.ok ? r.json() : null).catch(() => null),
                    fetch(`${API_BASE}/nifty/`).then(r => r.ok ? r.json() : null).catch(() => null),
                ]);
                const u = {};
                if (sensexRes) u.bse = { value: String(sensexRes.value || ''), change: String(sensexRes.change || ''), percent: String(sensexRes.percent || ''), positive: String(sensexRes.change || '').includes('+') };
                if (niftyRes) u.nse = { value: String(niftyRes.value || ''), change: String(niftyRes.change || ''), percent: String(niftyRes.percent || ''), positive: String(niftyRes.change || '').includes('+') };
                setLiveData(prev => ({ ...prev, ...u }));
            } catch { /* fallback */ }
        };
        fetchLive();
        const iv = setInterval(fetchLive, 60000);
        return () => clearInterval(iv);
    }, []);

    /* ── Globe + rotation (re-create on theme change) ──────── */
    useEffect(() => {
        if (!canvasRef.current) return;
        let width = 0;
        const onResize = () => { if (canvasRef.current) width = canvasRef.current.offsetWidth; };
        window.addEventListener('resize', onResize);
        onResize();

        const startPhi = -72.83 * Math.PI / 180;

        const markers = EXCHANGES.map(ex => ({
            location: [ex.lat, ex.lng],
            size: ex.region === 'India' ? 0.07 : 0.05,
        }));

        const palette = isDark ? DARK_GLOBE : LIGHT_GLOBE;

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: width * 2,
            height: width * 2,
            phi: startPhi,
            theta: GLOBE_THETA,
            ...palette,
            markers,
            onRender: (state) => {
                if (!pointerInteracting.current) {
                    phiRef.current += 0.002;
                }
                const phi = startPhi + phiRef.current + pointerInteractionMovement.current;
                state.phi = phi;
                state.width = width * 2;
                state.height = width * 2;

                const normalizedPhi = ((phi % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                
                const REGION_MAP = [
                    { name: 'BSE SENSEX',   phiStart: 0.8,  phiEnd: 1.3  },
                    { name: 'NSE NIFTY 50', phiStart: 1.3,  phiEnd: 1.9  },
                    { name: 'FTSE 100',     phiStart: 2.8,  phiEnd: 3.6  },
                    { name: 'NYSE (DOW)',   phiStart: 3.8,  phiEnd: 5.0  },
                    { name: 'NIKKEI 225',   phiStart: 0.0,  phiEnd: 0.9  },
                    { name: 'ASX 200',      phiStart: 5.0,  phiEnd: 6.28 },
                ];
                
                const active = REGION_MAP.find(r =>
                    normalizedPhi >= r.phiStart && normalizedPhi <= r.phiEnd
                );
                
                if (active && active.name !== currentActiveRef.current) {
                    currentActiveRef.current = active.name;
                    if (containerRef.current) {
                        containerRef.current.setAttribute('data-active', active.name);
                        // Update connector line visibility directly
                        const connectors = containerRef.current.querySelectorAll('.connector-line');
                        connectors.forEach(c => c.style.display = 'none');
                        const activeConn = containerRef.current.querySelector(`[data-connector="${active.name}"]`);
                        if (activeConn) activeConn.style.display = 'inline';
                    }
                }

                const now = performance.now();
                if (now - lastPosUpdate.current > 50) {
                    lastPosUpdate.current = now;
                    const r = width / 2;
                    const cx = width / 2;
                    const cy = width / 2;
                    // Convert globe phi (radians) to degrees for latLngToVector3
                    const globeRotationDeg = phi * (180 / Math.PI);
                    const positions = {};
                    for (const ex of EXCHANGES) {
                        const p = latLngToVector3(ex.lat, ex.lng, 1, globeRotationDeg);
                        positions[ex.id] = {
                            x: cx + p.x * r * 0.92,
                            y: cy + p.y * r * 0.92,
                            visible: p.z > 0,
                        };
                    }
                    setMarkerPositions(positions);
                }
            },
        });
        globeRef.current = globe;

        setTimeout(() => { if (canvasRef.current) canvasRef.current.style.opacity = '1'; }, 100);
        return () => { globe.destroy(); window.removeEventListener('resize', onResize); };
    }, [isDark]);

    /* ── Derived ───────────────────────────────────────────── */
    const getData = (ex) => liveData[ex.id] || ex.fallback;

    /* ── Connector line colour ─────────────────────────────── */
    const lineColor = isDark ? 'rgba(6,182,212,0.4)' : 'rgba(8,145,178,0.45)';
    const dotColor = isDark ? '#06B6D4' : '#0891B2';

    /* ── Render ─────────────────────────────────────────────── */
    return (
        <div ref={containerRef} className="globe-container relative w-full h-[420px] md:h-[500px] flex items-center justify-center" data-active="BSE SENSEX">
            {/* Globe */}
            <div className="relative w-[300px] h-[300px] md:w-[380px] md:h-[380px]">
                <canvas
                    ref={canvasRef}
                    onPointerDown={(e) => { pointerInteracting.current = e.clientX - pointerInteractionMovement.current; canvasRef.current.style.cursor = 'grabbing'; }}
                    onPointerUp={() => { pointerInteracting.current = null; canvasRef.current.style.cursor = 'grab'; }}
                    onPointerOut={() => { pointerInteracting.current = null; if (canvasRef.current) canvasRef.current.style.cursor = 'grab'; }}
                    onMouseMove={(e) => { if (pointerInteracting.current !== null) pointerInteractionMovement.current = (e.clientX - pointerInteracting.current) / 200; }}
                    onTouchMove={(e) => { if (pointerInteracting.current !== null && e.touches[0]) pointerInteractionMovement.current = (e.touches[0].clientX - pointerInteracting.current) / 200; }}
                    style={{ width: '100%', height: '100%', cursor: 'grab', contain: 'layout paint size', opacity: 0, transition: 'opacity 1s ease' }}
                />
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                        background: isDark
                            ? 'radial-gradient(circle, transparent 55%, rgba(6,182,212,0.06) 70%, transparent 80%)'
                            : 'radial-gradient(circle, transparent 55%, rgba(8,145,178,0.08) 70%, transparent 80%)',
                    }}
                />
            </div>

            {/* Exchange cards - DOM rendered entirely */}
            <AnimatePresence mode="wait">
                {EXCHANGES.map((exchange) => (
                    <motion.div key={exchange.id} data-card={exchange.name}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="absolute right-0 top-[20%] md:top-[18%] z-20 pointer-events-none"
                    >
                        <div>
                            <ExchangeCard exchange={exchange} data={getData(exchange)} isDark={isDark} />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Bottom region label */}
            <AnimatePresence mode="wait">
                <motion.div key="global-label"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
                    className="absolute bottom-0 md:bottom-2 left-1/2 -translate-x-1/2 z-20"
                >
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-sm border ${isDark
                            ? 'bg-gray-900/60 border-white/5'
                            : 'bg-white/70 border-gray-200/60 shadow-sm'
                        }`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Global Markets
                        </span>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────────────
 * ExchangeCard — theme-aware glass card
 * ──────────────────────────────────────────────────────────────────── */
const ExchangeCard = ({ exchange, data, isDark }) => {
    const pos = data.positive;
    const sparkline = React.useMemo(() => {
        const seed = exchange.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        return Array.from({ length: 16 }, (_, i) => {
            const base = 40 + ((seed * (i + 1) * 7) % 45);
            return Math.min(95, Math.max(20, base));
        });
    }, [exchange.id]);

    return (
        <div
            className={`backdrop-blur-xl rounded-2xl p-4 md:p-5 shadow-2xl max-w-[210px] md:max-w-[230px] border ${isDark
                    ? 'bg-gray-900/80 border-white/10'
                    : 'bg-white/80 border-gray-200/60 shadow-lg'
                }`}
            style={{ 
               borderColor: isDark ? `${exchange.color}33` : `${exchange.color}22`,
               transition: 'box-shadow 0.4s ease, border-color 0.4s ease'
            }}
        >
            <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em]"
                    style={{ color: exchange.color }}
                >
                    {exchange.flag} {exchange.name}
                </span>
            </div>
            <div className={`text-xl md:text-2xl font-black tracking-tight mb-1 ${isDark ? 'text-white' : 'text-gray-900'
                }`}>
                {data.value}
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${pos ? 'text-emerald-500' : 'text-red-500'}`}>{data.change}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${pos ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-600'
                    }`}>
                    {data.percent}
                </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: exchange.color }} />
                <span className={`text-[8px] uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                    {exchange.location}
                </span>
            </div>
            <div className="mt-2 h-5 flex items-end gap-[2px]">
                {sparkline.map((h, i) => (
                    <div key={i} className="w-[3px] rounded-full"
                        style={{
                            height: `${h}%`,
                            backgroundColor: pos
                                ? (isDark ? 'rgba(16,185,129,0.5)' : 'rgba(5,150,105,0.4)')
                                : (isDark ? 'rgba(239,68,68,0.5)' : 'rgba(220,38,38,0.4)'),
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default IndiaGlobe;
