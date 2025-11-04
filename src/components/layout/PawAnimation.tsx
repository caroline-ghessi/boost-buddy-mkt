import { useEffect, useRef } from 'react';

export function PawAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pawCount = 20;
    const paws: HTMLElement[] = [];

    for (let i = 0; i < pawCount; i++) {
      const paw = document.createElement('div');
      paw.innerHTML = '🐾';
      paw.className = 'paw-float';
      paw.style.left = `${Math.random() * 100}vw`;
      paw.style.animationDuration = `${Math.random() * 10 + 10}s`;
      paw.style.animationDelay = `${Math.random() * 15}s`;
      container.appendChild(paw);
      paws.push(paw);
    }

    return () => {
      paws.forEach(paw => paw.remove());
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
    />
  );
}
