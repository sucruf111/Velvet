'use client';

import { useEffect, useRef } from 'react';

export function LuxuryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    resize();
    window.addEventListener('resize', resize);

    // Gentle flowing gradient animation
    let time = 0;

    const animate = () => {
      time += 0.002;

      // Clear with subtle fade for smooth trails
      ctx.fillStyle = 'rgba(5, 5, 5, 1)';
      ctx.fillRect(0, 0, width, height);

      // Create elegant flowing gradients
      const gradient1X = width * (0.3 + Math.sin(time) * 0.1);
      const gradient1Y = height * (0.4 + Math.cos(time * 0.7) * 0.1);

      const gradient2X = width * (0.7 + Math.cos(time * 0.8) * 0.1);
      const gradient2Y = height * (0.6 + Math.sin(time * 0.6) * 0.1);

      // First ambient glow - warm gold
      const glow1 = ctx.createRadialGradient(
        gradient1X, gradient1Y, 0,
        gradient1X, gradient1Y, width * 0.5
      );
      glow1.addColorStop(0, 'rgba(212, 175, 55, 0.06)');
      glow1.addColorStop(0.4, 'rgba(212, 175, 55, 0.02)');
      glow1.addColorStop(1, 'transparent');

      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      // Second ambient glow - subtle rose
      const glow2 = ctx.createRadialGradient(
        gradient2X, gradient2Y, 0,
        gradient2X, gradient2Y, width * 0.4
      );
      glow2.addColorStop(0, 'rgba(180, 140, 100, 0.04)');
      glow2.addColorStop(0.5, 'rgba(150, 120, 90, 0.015)');
      glow2.addColorStop(1, 'transparent');

      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);

      // Subtle center focus glow
      const centerGlow = ctx.createRadialGradient(
        width / 2, height * 0.4, 0,
        width / 2, height * 0.4, width * 0.6
      );
      centerGlow.addColorStop(0, 'rgba(212, 175, 55, 0.03)');
      centerGlow.addColorStop(0.3, 'rgba(212, 175, 55, 0.01)');
      centerGlow.addColorStop(1, 'transparent');

      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      // Very subtle noise texture overlay
      ctx.globalAlpha = 0.02;
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1 + 0.5;
        ctx.fillStyle = `rgba(212, 175, 55, ${Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated canvas background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Elegant vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_40%,rgba(5,5,5,0.6)_100%)]"></div>

      {/* Subtle top-down lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505]/80"></div>
    </div>
  );
}
