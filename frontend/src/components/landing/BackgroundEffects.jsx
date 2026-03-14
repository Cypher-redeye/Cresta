import { useEffect, useRef } from 'react';

const BackgroundEffects = ({ isDark, style }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0, animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const dataPoints = [
      '₹76,034','▲2.4%','SENSEX','₹23,639','NIFTY','▼0.95%',
      '24,261','78,205','▲1.18%','8,684','▼0.28%','NSE','BSE',
      '+312','−227','FTSE','NYSE','▲0.82%','₹1,408','HOLD',
      'BUY','SELL','56,950','▲1.66%','β=0.87','RSI','▼0.46%','42,840'
    ];

    class Float {
      constructor(w, h) { this.reset(w, h); this.alpha = Math.random() * 0.1; }
      reset(w, h) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.text = dataPoints[Math.floor(Math.random() * dataPoints.length)];
        this.maxAlpha = isDark ? 0.25 + Math.random() * 0.20 : 0.35 + Math.random() * 0.25;
        this.alpha = 0; this.fadeIn = true;
        this.speed = 0.004 + Math.random() * 0.006;
        this.size = 11 + Math.floor(Math.random() * 7);
        this.drift = (Math.random() - 0.5) * 0.3;
      }
      update(w, h) {
        if (this.fadeIn) {
          this.alpha += this.speed;
          if (this.alpha >= this.maxAlpha) { this.alpha = this.maxAlpha; this.fadeIn = false; }
        } else {
          this.alpha -= this.speed * 0.7;
          if (this.alpha <= 0) this.reset(w, h);
        }
        this.x += this.drift;
      }
      draw(ctx) {
        const pos = this.text.includes('▲') || this.text.includes('+') || this.text === 'BUY';
        const neg = this.text.includes('▼') || this.text.includes('−') || this.text === 'SELL';
        const otherColor = isDark ? `rgba(16,185,129,${this.alpha * 0.75})` : `rgba(5,120,85,${this.alpha * 0.9})`;
        ctx.fillStyle = pos ? `rgba(16,185,129,${this.alpha})` : neg ? `rgba(239,68,68,${this.alpha})` : otherColor;
        ctx.font = `500 ${this.size}px monospace`;
        ctx.fillText(this.text, this.x, this.y);
      }
    }

    const floats = Array.from({ length: 45 }, () => new Float(canvas.width, canvas.height));

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      // Background base
      ctx.fillStyle = isDark ? '#121212' : '#f0f4f8';
      ctx.fillRect(0, 0, w, h);

      const b1 = 0.5 + 0.5 * Math.sin(t * 1.5);
      const b2 = 0.5 + 0.5 * Math.sin(t * 1.0 + 2.0);
      const b3 = 0.5 + 0.5 * Math.sin(t * 0.7 + 4.0);
      const b4 = 0.5 + 0.5 * Math.sin(t * 0.9 + 5.0);
      const base = isDark ? 1 : 2.4;

      let r, g;
      // Left glow
      r = w * (0.55 + b1 * 0.18);
      g = ctx.createRadialGradient(w*0.06, h*0.52, 0, w*0.06, h*0.52, r);
      g.addColorStop(0, `rgba(16,185,129,${(0.22 + b1*0.16)*base})`);
      g.addColorStop(0.45, `rgba(16,185,129,${(0.08 + b1*0.07)*base})`);
      g.addColorStop(1, 'rgba(16,185,129,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      // Top-right glow
      r = w * (0.45 + b2 * 0.15);
      g = ctx.createRadialGradient(w*0.85, h*0.18, 0, w*0.85, h*0.18, r);
      g.addColorStop(0, `rgba(16,185,129,${(0.18 + b2*0.14)*base})`);
      g.addColorStop(0.45, `rgba(16,185,129,${(0.06 + b2*0.05)*base})`);
      g.addColorStop(1, 'rgba(16,185,129,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      // Bottom glow (moved up to be visible)
      r = w * (0.50 + b3 * 0.16);
      g = ctx.createRadialGradient(w*0.48, h*0.82, 0, w*0.48, h*0.82, r);
      g.addColorStop(0, `rgba(5,150,105,${(0.20 + b3*0.14)*base})`);
      g.addColorStop(1, 'rgba(5,150,105,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      // New breathing dot (Top-left)
      r = w * (0.35 + b4 * 0.12);
      g = ctx.createRadialGradient(w*0.25, h*0.22, 0, w*0.25, h*0.22, r);
      g.addColorStop(0, `rgba(16,185,129,${(0.15 + b4*0.12)*base})`);
      g.addColorStop(0.45, `rgba(16,185,129,${(0.05 + b4*0.04)*base})`);
      g.addColorStop(1, 'rgba(16,185,129,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      floats.forEach(f => { f.update(w, h); f.draw(ctx); });
      t += 0.025;
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        pointerEvents: 'none', zIndex: 0,
        ...style
      }}
    />
  );
};

export default BackgroundEffects;
