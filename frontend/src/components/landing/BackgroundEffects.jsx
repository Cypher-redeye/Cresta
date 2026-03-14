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
        this.maxAlpha = isDark ? 0.10 + Math.random() * 0.13 : 0.18 + Math.random() * 0.18;
        this.alpha = 0; this.fadeIn = true;
        this.speed = 0.004 + Math.random() * 0.006;
        this.size = 9 + Math.floor(Math.random() * 5);
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
        ctx.fillStyle = pos ? `rgba(16,185,129,${this.alpha})` : neg ? `rgba(239,68,68,${this.alpha})` : `rgba(16,185,129,${this.alpha * 0.75})`;
        ctx.font = `500 ${this.size}px monospace`;
        ctx.fillText(this.text, this.x, this.y);
      }
    }

    const floats = Array.from({ length: 28 }, () => new Float(canvas.width, canvas.height));

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const b1 = 0.5 + 0.5 * Math.sin(t * 1.5);
      const b2 = 0.5 + 0.5 * Math.sin(t * 1.0 + 2.0);
      const b3 = 0.5 + 0.5 * Math.sin(t * 0.7 + 4.0);
      const base = isDark ? 1 : 1.8;

      let r, g;
      r = w * (0.40 + b1 * 0.14);
      g = ctx.createRadialGradient(w*0.06, h*0.52, 0, w*0.06, h*0.52, r);
      g.addColorStop(0, `rgba(16,185,129,${(0.13 + b1*0.10)*base})`);
      g.addColorStop(0.45, `rgba(16,185,129,${(0.04 + b1*0.04)*base})`);
      g.addColorStop(1, 'rgba(16,185,129,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      r = w * (0.33 + b2 * 0.11);
      g = ctx.createRadialGradient(w*0.85, h*0.18, 0, w*0.85, h*0.18, r);
      g.addColorStop(0, `rgba(16,185,129,${(0.11 + b2*0.09)*base})`);
      g.addColorStop(0.45, `rgba(16,185,129,${(0.03 + b2*0.03)*base})`);
      g.addColorStop(1, 'rgba(16,185,129,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      r = w * (0.35 + b3 * 0.12);
      g = ctx.createRadialGradient(w*0.48, h*1.02, 0, w*0.48, h*1.02, r);
      g.addColorStop(0, `rgba(5,150,105,${(0.12 + b3*0.09)*base})`);
      g.addColorStop(1, 'rgba(5,150,105,0)');
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
