import React, { useEffect, useRef } from 'react';

const EXCHANGES = [
  { name:'BSE SENSEX',   startAngle: 0.8,  endAngle: 1.3 },
  { name:'NSE NIFTY 50', startAngle: 1.3,  endAngle: 1.9 },
  { name:'FTSE 100',     startAngle: 2.8,  endAngle: 3.6 },
  { name:'NYSE (DOW)',   startAngle: 3.8,  endAngle: 5.0 },
  { name:'NIKKEI 225',   startAngle: 0.0,  endAngle: 0.9 },
  { name:'ASX 200',      startAngle: 5.0,  endAngle: 6.28 },
];

const orbitRX = 168, orbitRY = 52, orbitTilt = -28 * Math.PI / 180;

function getOrbitPos(a) {
  const x = orbitRX * Math.cos(a);
  const y = orbitRY * Math.sin(a);
  const rx = x * Math.cos(orbitTilt) - y * Math.sin(orbitTilt);
  const ry = x * Math.sin(orbitTilt) + y * Math.cos(orbitTilt);
  return { x: rx, y: ry, behind: Math.sin(a) < 0 };
}

export default function SatelliteOrbit({ globeRef, cardRefs }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      console.log('cardRefs:', Object.keys(cardRefs.current));
    }, 1000);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId, angle = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const getGlobeCenter = () => {
      if (!globeRef?.current) return { cx: canvas.width * 0.65, cy: canvas.height * 0.5 };
      const rect = globeRef.current.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      return {
        cx: rect.left + rect.width / 2 - canvasRect.left,
        cy: rect.top + rect.height / 2 - canvasRect.top,
      };
    };

    const getCardCenter = (name) => {
      if (!cardRefs?.current) return null;
      const el = cardRefs.current[name];
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - canvasRect.left,
        y: rect.top + rect.height / 2 - canvasRect.top,
      };
    };

    const getActiveFade = (a, ex) => {
      const norm = ((a % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
      const s = ((ex.startAngle % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
      const e = ((ex.endAngle % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
      const inRange = s < e ? (norm >= s && norm <= e) : (norm >= s || norm <= e);
      if (!inRange) return 0;
      const mid = (s + e) / 2;
      let dist = Math.abs(norm - mid);
      if (dist > Math.PI) dist = Math.PI*2 - dist;
      const span = ((e - s + Math.PI*2) % (Math.PI*2)) * 0.7;
      return Math.max(0, 1 - dist / span);
    };

    const drawBeam = (sx, sy, cx2, cy2, fade, behind) => {
      if (behind || fade < 0.15) return;
      const grad = ctx.createLinearGradient(sx, sy, cx2, cy2);
      grad.addColorStop(0, `rgba(16,185,129,${fade * 0.85})`);
      grad.addColorStop(0.6, `rgba(16,185,129,${fade * 0.3})`);
      grad.addColorStop(1, `rgba(16,185,129,0.04)`);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(cx2, cy2);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(sx, sy, 2 + fade * 3, 0, Math.PI*2);
      ctx.fillStyle = `rgba(16,185,129,${fade * 0.7})`;
      ctx.fill();
    };

    const drawSatellite = (x, y, a, behind) => {
      ctx.save();
      ctx.globalAlpha = behind ? 0.2 : 1;
      ctx.translate(x, y);
      ctx.rotate(a + Math.PI / 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-3.5, -3.5, 7, 7);
      ctx.fillStyle = 'rgba(16,185,129,0.95)';
      ctx.fillRect(-12, -2, 7, 4);
      ctx.fillRect(5, -2, 7, 4);
      if (!behind) {
        ctx.rotate(-(a + Math.PI / 4));
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
        g.addColorStop(0, 'rgba(16,185,129,0.25)');
        g.addColorStop(1, 'rgba(16,185,129,0)');
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI*2);
        ctx.fillStyle = g;
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    const frame = () => {
      animId = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { cx, cy } = getGlobeCenter();
      const sat = getOrbitPos(angle);
      const sx = cx + sat.x, sy = cy + sat.y;
      
      EXCHANGES.forEach(ex => {
        const fade = getActiveFade(angle, ex);
        const cardEl = cardRefs?.current ? cardRefs.current[ex.name] : null;

        if (fade > 0.15) {
          const cardPos = getCardCenter(ex.name);
          if (cardPos) drawBeam(sx, sy, cardPos.x, cardPos.y, fade, sat.behind);
        }

        // Direct DOM update for card glow effect based on fade
        if (cardEl) {
          if (fade > 0.15) {
            cardEl.style.boxShadow = `0 0 ${Math.round(fade * 14)}px rgba(16,185,129,${(fade * 0.35).toFixed(2)})`;
            cardEl.style.transition = 'none'; // Clear any CSS transition during manual frame updates
            cardEl.style.borderColor = `rgba(16,185,129,${(fade * 0.7).toFixed(2)})`;
          } else {
            cardEl.style.boxShadow = 'none';
            cardEl.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease'; // Re-enable smooth ease-out
            cardEl.style.borderColor = 'rgba(16,185,129,0.2)';
          }
        }
      });
      
      drawSatellite(sx, sy, angle, sat.behind);
      angle += 0.006;
    };

    animId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [globeRef, cardRefs]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
}
