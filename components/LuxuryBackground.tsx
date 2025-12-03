
import React, { useEffect, useRef } from 'react';

interface LuxuryBackgroundProps {
  className?: string;
  intensity?: 'high' | 'low';
}

export const LuxuryBackground: React.FC<LuxuryBackgroundProps> = ({ className = '', intensity = 'high' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let frame = 0;

    // Configuration
    const waveCount = intensity === 'high' ? 5 : 3;
    const colors = [
      'rgba(212, 175, 55, 0.15)', // Gold
      'rgba(181, 149, 47, 0.1)',  // Darker Gold
      'rgba(255, 235, 128, 0.05)', // Bright Gold
      'rgba(100, 80, 20, 0.1)'     // Shadow
    ];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Create a luxury dark gradient background base (optional, can be transparent)
      // ctx.fillStyle = '#050505';
      // ctx.fillRect(0, 0, width, height);

      frame += 0.005;

      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        // Draw Sine Waves
        for (let x = 0; x < width; x++) {
          // Complex wave synthesis
          const y = Math.sin(x * 0.002 + frame + i) * 50 * Math.sin(frame * 0.5) +
                    Math.sin(x * 0.005 + frame * 2 + i) * 30 +
                    (height / 2);
          
          ctx.lineTo(x, y + (i * 20) - (waveCount * 10)); // Offset each wave
        }

        // Close path for fill
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        
        // Add a thin stroke for sharpness
        // ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
        // ctx.stroke();
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [intensity]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} 
    />
  );
};
