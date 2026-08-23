import { useEffect, useRef } from 'react';
import { usePerformance } from '../../context/PerformanceContext';

const BackgroundEffects = ({ isDark, style }) => {
  const canvasRef = useRef(null);
  const { isLowPerformance } = usePerformance();

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
        this.maxAlpha = isDark ? 0.35 + Math.random() * 0.35 : 0.45 + Math.random() * 0.40;
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
        if (pos) {
          ctx.fillStyle = isDark ? `rgba(0, 255, 102, ${this.alpha})` : `rgba(0, 170, 68, ${this.alpha})`; // cyber neon green
        } else if (neg) {
          ctx.fillStyle = isDark ? `rgba(255, 0, 85, ${this.alpha})` : `rgba(230, 0, 68, ${this.alpha})`; // neon pink-red
        } else {
          ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${this.alpha * 0.45})` : `rgba(0, 0, 0, ${this.alpha * 0.4})`; // monochrome default
        }
        ctx.font = `500 ${this.size}px 'JetBrains Mono', monospace`;
        ctx.fillText(this.text, this.x, this.y);
      }
    }

    const floats = Array.from({ length: 45 }, () => new Float(canvas.width, canvas.height));

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      // Pure Apple/Vercel backgrounds (true black / white)
      ctx.fillStyle = isDark ? '#000000' : '#ffffff';
      ctx.fillRect(0, 0, w, h);

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

  if (isLowPerformance) return null;

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
