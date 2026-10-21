import React, { useEffect, useRef, useState } from 'react';

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  flip: number;
  flipSpeed: number;
  opacity: number;
  color: string;
}

const PETAL_COLORS = [
  'rgba(255, 182, 193, 0.75)', // Light pink
  'rgba(255, 192, 203, 0.85)', // Pink
  'rgba(254, 205, 211, 0.80)', // Rose 200
  'rgba(251, 113, 133, 0.65)', // Rose 400
  'rgba(255, 240, 245, 0.90)', // Lavender blush / soft white-pink
];

export const SakuraPetalsCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [enabled, setEnabled] = useState(true);
  const petalsRef = useRef<Petal[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -100, y: -100, active: false });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, active: true };
      }
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Initialize petals
    const petalCount = Math.min(36, Math.floor((width * height) / 25000));
    petalsRef.current = Array.from({ length: petalCount }, () => createPetal(width, height, true));

    function createPetal(w: number, h: number, randomY = false): Petal {
      const size = 10 + Math.random() * 14;
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -size - Math.random() * 50,
        size,
        speedY: 1.0 + Math.random() * 1.6,
        speedX: -0.8 + Math.random() * 1.6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        flip: Math.random() * Math.PI,
        flipSpeed: 0.02 + Math.random() * 0.03,
        opacity: 0.5 + Math.random() * 0.45,
        color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      };
    }

    function drawPetal(c: CanvasRenderingContext2D, petal: Petal) {
      c.save();
      c.translate(petal.x, petal.y);
      c.rotate(petal.rotation);
      c.scale(1, Math.cos(petal.flip)); // 3D flip flutter

      c.fillStyle = petal.color;
      c.shadowColor = 'rgba(244, 63, 94, 0.25)';
      c.shadowBlur = 6;

      // Draw realistic notched sakura petal shape
      const s = petal.size;
      c.beginPath();
      c.moveTo(0, -s);
      // Right curve with notch
      c.bezierCurveTo(s * 0.8, -s * 0.6, s * 0.9, s * 0.3, s * 0.1, s);
      c.lineTo(-s * 0.1, s);
      // Left curve
      c.bezierCurveTo(-s * 0.9, s * 0.3, -s * 0.8, -s * 0.6, 0, -s);
      c.closePath();
      c.fill();

      // Subtle petal midrib line
      c.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, -s * 0.7);
      c.lineTo(0, s * 0.6);
      c.stroke();

      c.restore();
    }

    let tick = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      tick += 0.015;

      const petals = petalsRef.current;
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];

        // Natural horizontal wind wave
        const windWave = Math.sin(tick + i) * 0.8;
        p.x += p.speedX + windWave;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.flip += p.flipSpeed;

        // Interactive wind breeze when mouse / finger approaches
        if (mouseRef.current.active) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120 && dist > 0) {
            const force = (120 - dist) / 120;
            p.x += (dx / dist) * force * 4;
            p.y += (dy / dist) * force * 4;
            p.rotation += 0.05 * force;
          }
        }

        // Respawn when falling beyond bottom or sides
        if (p.y > height + 30 || p.x < -30 || p.x > width + 30) {
          petals[i] = createPetal(width, height, false);
        }

        drawPetal(ctx, p);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled]);

  return (
    <>
      {enabled && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-30"
          style={{ width: '100vw', height: '100vh' }}
        />
      )}
      {/* Anime Petals Toggle Floating Pill */}
      <button
        type="button"
        onClick={() => setEnabled((prev) => !prev)}
        className="fixed bottom-4 right-4 z-40 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer backdrop-blur-md border border-pink-200/80 bg-white/85 text-pink-700 hover:bg-pink-50 hover:scale-105 active:scale-95"
        title={enabled ? 'Tắt hiệu ứng hoa anh đào' : 'Bật hiệu ứng hoa anh đào'}
      >
        <span className="text-base animate-spin" style={{ animationDuration: '6s' }}>🌸</span>
        <span className="text-[11px] font-semibold">{enabled ? 'Hoa rơi: Bật' : 'Hoa rơi: Tắt'}</span>
      </button>
    </>
  );
};
