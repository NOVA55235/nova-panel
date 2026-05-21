import { useEffect, useState } from "react";

const SPLASH_KEY = "nova_splash_seen";
const SPLASH_DURATION = 4200;

export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, SPLASH_DURATION);
    return () => clearTimeout(t);
  }, [onDone]);

  const stars = Array.from({ length: 40 }, (_, i) => ({
    left: Math.random() * 100,
    top: Math.random() * 60,
    size: Math.random() * 2 + 0.5,
    delay: Math.random() * 2,
  }));

  return (
    <div className="fixed inset-0 z-[200] bg-[hsl(220,38%,4%)] overflow-hidden splash-fade">
      {/* Sky gradient */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 100%, hsl(198 92% 40% / 0.25) 0%, transparent 60%), radial-gradient(ellipse at 30% 20%, hsl(245 75% 50% / 0.2) 0%, transparent 50%)"
      }} />

      {/* Stars */}
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white splash-star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* Mountain */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] flex items-end justify-center splash-mountain">
        <svg viewBox="0 0 1200 600" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
          <defs>
            <linearGradient id="mtnGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(198, 92%, 65%)" />
              <stop offset="40%" stopColor="hsl(210, 60%, 30%)" />
              <stop offset="100%" stopColor="hsl(220, 38%, 8%)" />
            </linearGradient>
            <linearGradient id="mtnGrad2" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(220, 50%, 40%)" />
              <stop offset="100%" stopColor="hsl(220, 38%, 6%)" />
            </linearGradient>
            <linearGradient id="snowGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="white" />
              <stop offset="100%" stopColor="hsl(198, 92%, 75%)" />
            </linearGradient>
          </defs>
          {/* Back ridge */}
          <polygon points="0,600 200,300 400,420 550,250 750,400 950,200 1200,380 1200,600" fill="url(#mtnGrad2)" opacity="0.6" />
          {/* Main Everest peak */}
          <polygon points="200,600 500,180 600,80 700,180 1000,600" fill="url(#mtnGrad)" />
          {/* Snow cap */}
          <polygon points="540,220 600,80 660,220 640,250 620,210 600,250 580,210 560,250" fill="url(#snowGrad)" />
          {/* Side peak */}
          <polygon points="50,600 250,300 450,600" fill="url(#mtnGrad)" opacity="0.85" />
          <polygon points="220,330 250,300 280,330 270,345 260,320 240,345" fill="url(#snowGrad)" opacity="0.8" />
          {/* Right peak */}
          <polygon points="800,600 950,280 1100,600" fill="url(#mtnGrad)" opacity="0.85" />
          <polygon points="930,310 950,280 970,310 960,325 945,295" fill="url(#snowGrad)" opacity="0.8" />
        </svg>
      </div>

      {/* Dragon flying across */}
      <div className="absolute top-[30%] left-0 splash-dragon" style={{ width: 80, height: 50 }}>
        <svg viewBox="0 0 100 60" className="w-full h-full" style={{ filter: "drop-shadow(0 0 8px hsl(198 92% 54% / 0.6))" }}>
          {/* Body */}
          <ellipse cx="50" cy="35" rx="22" ry="5" fill="hsl(198, 92%, 54%)" />
          {/* Head */}
          <ellipse cx="72" cy="33" rx="8" ry="6" fill="hsl(198, 92%, 60%)" />
          {/* Eye */}
          <circle cx="74" cy="32" r="1.5" fill="hsl(0, 0%, 100%)" />
          {/* Tail */}
          <path d="M 28 35 Q 10 32 4 28 L 8 36 Q 18 38 28 36 Z" fill="hsl(198, 92%, 50%)" />
          {/* Wings */}
          <g className="splash-wing">
            <path d="M 40 35 Q 30 8 55 18 Q 50 30 45 32 Z" fill="hsl(198, 92%, 65%)" opacity="0.95" />
            <path d="M 60 35 Q 70 8 80 18 Q 70 30 65 32 Z" fill="hsl(198, 92%, 65%)" opacity="0.95" />
          </g>
          {/* Belly highlight */}
          <ellipse cx="50" cy="38" rx="18" ry="2" fill="hsl(198, 92%, 75%)" opacity="0.5" />
        </svg>
      </div>

      {/* Title */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="splash-title text-center">
          <h1 className="text-6xl sm:text-7xl font-black text-white tracking-wide drop-shadow-[0_0_30px_hsl(198,92%,54%)]">
            NOVA
          </h1>
          <p className="text-primary/80 text-sm sm:text-base mt-2 font-mono tracking-[0.4em] uppercase">
            Everest Node
          </p>
        </div>
      </div>

      {/* Bottom watermark */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-[10px] text-white/30 tracking-widest uppercase font-mono">
          @Lord_nova98
        </p>
      </div>
    </div>
  );
}

export function useSplash() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem(SPLASH_KEY);
  });

  const dismiss = () => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setShow(false);
  };

  return { show, dismiss };
}
