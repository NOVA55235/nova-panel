import { useEffect, useRef } from "react";
import type { AnimBgConfig, AnimBgType } from "@/hooks/use-animated-bg";

function ParticlesCanvas({ canvas, opacity, speed }: { canvas: HTMLCanvasElement; opacity: number; speed: number }) {
  const raf = { id: 0 };
  const ctx = canvas.getContext("2d")!;
  const speedMult = speed / 3;

  interface Particle { x: number; y: number; vx: number; vy: number; r: number; alpha: number }
  const COUNT = 70;
  const particles: Particle[] = [];

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6 * speedMult,
      vy: (Math.random() - 0.5) * 0.6 * speedMult,
      r: Math.random() * 1.8 + 0.8,
      alpha: Math.random() * 0.6 + 0.4,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    }
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(103,232,249,${(1 - dist / 130) * 0.25 * (opacity / 100)})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(103,232,249,${p.alpha * (opacity / 100)})`;
      ctx.fill();
    }
    raf.id = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(raf.id);
}

function MatrixCanvas({ canvas, opacity, speed }: { canvas: HTMLCanvasElement; opacity: number; speed: number }) {
  const raf = { id: 0 };
  const ctx = canvas.getContext("2d")!;
  const speedMult = speed / 3;

  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize();

  const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF</>{}[];:.#@!";
  const fontSize = 14;
  const cols = Math.floor(canvas.width / fontSize);
  const drops = Array.from({ length: cols }, () => Math.random() * -50);

  let lastTime = 0;
  const interval = 60 / speedMult;

  function draw(time: number) {
    raf.id = requestAnimationFrame(draw);
    if (time - lastTime < interval) return;
    lastTime = time;

    ctx.fillStyle = `rgba(0,0,0,0.05)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${fontSize}px monospace`;
    for (let i = 0; i < drops.length; i++) {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)];
      const alpha = opacity / 100;
      if (drops[i] * fontSize < 20) {
        ctx.fillStyle = `rgba(167,243,208,${alpha})`;
      } else {
        ctx.fillStyle = `rgba(52,211,153,${alpha * 0.7})`;
      }
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += 0.5;
    }
  }
  raf.id = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf.id);
}

function StarsCanvas({ canvas, opacity, speed }: { canvas: HTMLCanvasElement; opacity: number; speed: number }) {
  const raf = { id: 0 };
  const ctx = canvas.getContext("2d")!;
  const speedMult = speed / 3;

  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize();

  interface Star { x: number; y: number; r: number; baseAlpha: number; phase: number; phaseSpeed: number }
  interface Shooting { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }

  const COUNT = 180;
  const stars: Star[] = Array.from({ length: COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.4 + 0.3,
    baseAlpha: Math.random() * 0.6 + 0.2,
    phase: Math.random() * Math.PI * 2,
    phaseSpeed: (Math.random() * 0.02 + 0.005) * speedMult,
  }));

  const shooters: Shooting[] = [];
  let shootTimer = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shootTimer++;
    if (shootTimer > 180 / speedMult && Math.random() > 0.7) {
      shooters.push({
        x: Math.random() * canvas.width * 0.7,
        y: Math.random() * canvas.height * 0.5,
        vx: (3 + Math.random() * 4) * speedMult,
        vy: (1 + Math.random() * 2) * speedMult,
        life: 0,
        maxLife: 40 + Math.random() * 30,
      });
      shootTimer = 0;
    }

    for (const s of stars) {
      s.phase += s.phaseSpeed;
      const alpha = s.baseAlpha * (0.5 + 0.5 * Math.sin(s.phase)) * (opacity / 100);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,240,255,${alpha})`;
      ctx.fill();
    }

    for (let i = shooters.length - 1; i >= 0; i--) {
      const sh = shooters[i];
      sh.life++;
      const progress = sh.life / sh.maxLife;
      const alpha = (1 - progress) * (opacity / 100);
      const len = 60 + progress * 40;
      const grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * len / sh.vx, sh.y - sh.vy * len / sh.vx);
      grad.addColorStop(0, `rgba(200,240,255,${alpha})`);
      grad.addColorStop(1, `rgba(200,240,255,0)`);
      ctx.beginPath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x - sh.vx * (len / 4), sh.y - sh.vy * (len / 4));
      ctx.stroke();
      sh.x += sh.vx;
      sh.y += sh.vy;
      if (sh.life >= sh.maxLife) shooters.splice(i, 1);
    }

    raf.id = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(raf.id);
}

function CanvasAnim({ type, opacity, speed }: { type: "particles" | "matrix" | "stars"; opacity: number; speed: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cleanup: (() => void) | undefined;
    if (type === "particles") cleanup = ParticlesCanvas({ canvas, opacity, speed });
    else if (type === "matrix") cleanup = MatrixCanvas({ canvas, opacity, speed });
    else if (type === "stars") cleanup = StarsCanvas({ canvas, opacity, speed });

    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    return () => { cleanup?.(); ro.disconnect(); };
  }, [type, opacity, speed]);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

function AuroraBg({ opacity, speed }: { opacity: number; speed: number }) {
  const dur = (s: number) => `${(s / speed).toFixed(1)}s`;
  const alpha = (opacity / 100 * 0.5).toFixed(2);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes aurora1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(5%,3%) scale(1.1)} 66%{transform:translate(-3%,5%) scale(0.95)} }
        @keyframes aurora2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-6%,-4%) scale(1.15)} 66%{transform:translate(4%,-2%) scale(0.9)} }
        @keyframes aurora3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(3%,-6%) scale(1.2)} }
        .a1{animation:aurora1 ${dur(18)} ease-in-out infinite}
        .a2{animation:aurora2 ${dur(22)} ease-in-out infinite}
        .a3{animation:aurora3 ${dur(15)} ease-in-out infinite}
      `}</style>
      <div className="a1 absolute" style={{width:"70%",height:"60%",left:"10%",top:"5%",borderRadius:"50%",background:`radial-gradient(ellipse,rgba(6,182,212,${alpha}) 0%,transparent 70%)`,filter:"blur(60px)"}} />
      <div className="a2 absolute" style={{width:"60%",height:"50%",left:"30%",top:"20%",borderRadius:"50%",background:`radial-gradient(ellipse,rgba(139,92,246,${alpha}) 0%,transparent 70%)`,filter:"blur(70px)"}} />
      <div className="a3 absolute" style={{width:"50%",height:"55%",left:"5%",top:"30%",borderRadius:"50%",background:`radial-gradient(ellipse,rgba(20,184,166,${alpha}) 0%,transparent 70%)`,filter:"blur(50px)"}} />
      <div className="a1 absolute" style={{width:"40%",height:"40%",right:"5%",bottom:"10%",borderRadius:"50%",background:`radial-gradient(ellipse,rgba(59,130,246,${alpha}) 0%,transparent 70%)`,filter:"blur(55px)",animationDelay:"-8s"}} />
    </div>
  );
}

function HexGridBg({ opacity, speed }: { opacity: number; speed: number }) {
  const dur = (s: number) => `${(s / speed).toFixed(1)}s`;
  const a = (opacity / 100 * 0.35).toFixed(2);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes hexpulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
        @keyframes hexdrift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .hexpulse{animation:hexpulse ${dur(4)} ease-in-out infinite}
        .hexdrift{animation:hexdrift ${dur(8)} ease-in-out infinite}
      `}</style>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hex" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon className="hexpulse" points="30,2 52,14 52,38 30,50 8,38 8,14"
              fill="none" stroke={`rgba(103,232,249,${a})`} strokeWidth="0.8" />
            <circle className="hexpulse" cx="30" cy="26" r="2"
              fill={`rgba(103,232,249,${(opacity / 100 * 0.5).toFixed(2)})`}
              style={{ animationDelay: "0.5s" }} />
          </pattern>
          <pattern id="hex2" x="30" y="26" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon className="hexpulse" points="30,2 52,14 52,38 30,50 8,38 8,14"
              fill="none" stroke={`rgba(103,232,249,${(parseFloat(a) * 0.5).toFixed(2)})`} strokeWidth="0.5"
              style={{ animationDelay: "2s" }} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex)" />
        <rect width="100%" height="100%" fill="url(#hex2)" />
        <rect width="100%" height="100%" fill={`radial-gradient(ellipse at 50% 50%, rgba(6,182,212,${(opacity/100*0.08).toFixed(2)}), transparent 70%)`} />
      </svg>
      <div className="hexdrift absolute" style={{width:"40%",height:"40%",left:"30%",top:"20%",borderRadius:"50%",background:`radial-gradient(ellipse,rgba(6,182,212,${(opacity/100*0.06).toFixed(2)}) 0%,transparent 70%)`,filter:"blur(40px)"}} />
    </div>
  );
}

function NebulaBg({ opacity, speed }: { opacity: number; speed: number }) {
  const dur = (s: number) => `${(s / speed).toFixed(1)}s`;
  const a = (opacity / 100 * 0.35).toFixed(2);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes neb1 { 0%,100%{transform:translate(0%,0%) scale(1) rotate(0deg)} 33%{transform:translate(3%,5%) scale(1.1) rotate(5deg)} 66%{transform:translate(-5%,2%) scale(0.95) rotate(-3deg)} }
        @keyframes neb2 { 0%,100%{transform:translate(0%,0%) scale(1) rotate(0deg)} 50%{transform:translate(-4%,-6%) scale(1.2) rotate(8deg)} }
        @keyframes neb3 { 0%,100%{transform:translate(0%,0%) scale(1)} 40%{transform:translate(6%,3%) scale(0.9)} 80%{transform:translate(-2%,6%) scale(1.1)} }
        .neb1{animation:neb1 ${dur(25)} ease-in-out infinite}
        .neb2{animation:neb2 ${dur(30)} ease-in-out infinite}
        .neb3{animation:neb3 ${dur(20)} ease-in-out infinite}
      `}</style>
      <div className="neb1 absolute" style={{width:"80%",height:"70%",left:"-10%",top:"-10%",borderRadius:"50%",background:`radial-gradient(ellipse,rgba(139,92,246,${a}) 0%,rgba(59,130,246,${(parseFloat(a)*0.5).toFixed(2)}) 40%,transparent 70%)`,filter:"blur(80px)"}} />
      <div className="neb2 absolute" style={{width:"70%",height:"65%",right:"-15%",bottom:"-10%",borderRadius:"50%",background:`radial-gradient(ellipse,rgba(236,72,153,${(parseFloat(a)*0.7).toFixed(2)}) 0%,rgba(139,92,246,${(parseFloat(a)*0.4).toFixed(2)}) 50%,transparent 70%)`,filter:"blur(90px)"}} />
      <div className="neb3 absolute" style={{width:"50%",height:"55%",left:"25%",top:"20%",borderRadius:"50%",background:`radial-gradient(ellipse,rgba(6,182,212,${(parseFloat(a)*0.6).toFixed(2)}) 0%,transparent 65%)`,filter:"blur(60px)"}} />
    </div>
  );
}

export function AnimatedBackground({ config }: { config: AnimBgConfig }) {
  if (config.type === "none") return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {(config.type === "particles" || config.type === "matrix" || config.type === "stars") && (
        <CanvasAnim type={config.type} opacity={config.opacity} speed={config.speed} />
      )}
      {config.type === "aurora" && <AuroraBg opacity={config.opacity} speed={config.speed} />}
      {config.type === "hexgrid" && <HexGridBg opacity={config.opacity} speed={config.speed} />}
      {config.type === "nebula" && <NebulaBg opacity={config.opacity} speed={config.speed} />}
    </div>
  );
}
