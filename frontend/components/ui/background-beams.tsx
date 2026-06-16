'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Beam {
  id: number;
  x1: string;
  y1: string;
  x2: string;
  y2: string;
  duration: number;
  delay: number;
  color: string;
  width: number;
}

export function BackgroundBeams({ className }: { className?: string }) {
  const [beams, setBeams] = useState<Beam[]>([]);

  useEffect(() => {
    const generated: Beam[] = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x1: `${Math.random() * 100}%`,
      y1: `${Math.random() * 100}%`,
      x2: `${Math.random() * 100}%`,
      y2: `${Math.random() * 100}%`,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 3,
      color: i % 3 === 0 ? '#F59E0B' : i % 3 === 1 ? '#6366F1' : '#10B981',
      width: 0.5 + Math.random() * 1,
    }));
    setBeams(generated);
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className ?? ''}`}>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#1A1A2E" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0A0A0F" stopOpacity="1" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGrad)" />
        {beams.map((beam) => (
          <motion.line
            key={beam.id}
            x1={beam.x1} y1={beam.y1}
            x2={beam.x2} y2={beam.y2}
            stroke={beam.color}
            strokeWidth={beam.width}
            strokeOpacity={0}
            animate={{
              strokeOpacity: [0, 0.15, 0.08, 0.2, 0],
              x1: [beam.x1, `${parseFloat(beam.x1) + 20}%`, beam.x1],
              y1: [beam.y1, `${parseFloat(beam.y1) + 10}%`, beam.y1],
            }}
            transition={{
              duration: beam.duration,
              delay: beam.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(245,158,11,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,158,11,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
