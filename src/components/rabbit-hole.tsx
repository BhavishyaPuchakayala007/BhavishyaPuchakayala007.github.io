import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import astronaut from "@/assets/rabbit-hole/astronaut.webp";
import camera from "@/assets/rabbit-hole/camera.webp";
import code from "@/assets/rabbit-hole/code.webp";
import console_ from "@/assets/rabbit-hole/console.webp";
import folder from "@/assets/rabbit-hole/folder.webp";
import headphones from "@/assets/rabbit-hole/headphones.webp";
import laptop from "@/assets/rabbit-hole/laptop.webp";
import phone from "@/assets/rabbit-hole/phone.webp";
import sparkles from "@/assets/rabbit-hole/sparkles.webp";
import swirl from "@/assets/rabbit-hole/swirl.webp";
import { cn } from "@/lib/utils";

// Set right before jumping between the story and /work, so the page we land on
// knows to finish the animation instead of just appearing.
export const FELL_IN = "fell-down-the-rabbit-hole";
export const CLIMBED_OUT = "climbed-out-of-the-rabbit-hole";

// The things that get sucked in (and spat back out), with where they start
// as a fraction of the screen, and their size in px.
const debris = [
  { src: astronaut, x: 0.18, y: 0.2, size: 150 },
  { src: laptop, x: 0.78, y: 0.16, size: 170 },
  { src: headphones, x: 0.1, y: 0.62, size: 140 },
  { src: console_, x: 0.86, y: 0.52, size: 120 },
  { src: folder, x: 0.32, y: 0.84, size: 130 },
  { src: code, x: 0.7, y: 0.84, size: 160 },
  { src: phone, x: 0.5, y: 0.1, size: 105 },
  { src: camera, x: 0.92, y: 0.86, size: 130 },
];

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
// Progress of t through the window [a, b].
const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

const remember = (key: string) => {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // private mode: we still travel, just without the finishing animation
  }
};

export const takeFlag = (key: string) => {
  try {
    const set = sessionStorage.getItem(key) === "1";
    sessionStorage.removeItem(key);
    return set;
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// "go deeper →": hover warns "no way back.", click says "okay…", and the page
// falls in: objects drift in, spiral into a hole that swallows the screen,
// "past the event horizon.", "you crossed over. here's everything else." and
// we land on /work.
export function RabbitHoleButton() {
  const navigate = useNavigate();
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);

  const jump = () => {
    const button = ref.current;
    if (!button || origin) return;
    const r = button.getBoundingClientRect();
    setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    remember(FELL_IN);
  };

  return (
    <>
      <button
        ref={ref}
        onClick={jump}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        data-cursor="technically, nothing escapes."
        className={cn(
          "inline-flex min-w-[13.5rem] items-center justify-center gap-3 rounded-full border border-foreground px-6 py-3 text-lg transition-all duration-300",
          origin ? "bg-background" : hovered ? "-rotate-2 scale-105 bg-foreground text-background" : "",
        )}
      >
        {origin ? "okay…" : hovered ? "no way back." : "go deeper"}
        <span className={cn("transition-transform duration-300", hovered && !origin && "translate-x-1")}>→</span>
      </button>
      {origin && (
        <Fall
          origin={origin}
          onDone={() => {
            const curtain = document.createElement("div");
            curtain.id = "rabbit-hole-curtain";
            curtain.style.cssText = "position:fixed;inset:0;z-index:300;background:#0b0b0d;pointer-events:none;transition:opacity 1s";
            document.body.appendChild(curtain);
            void navigate({ to: "/work" });
          }}
        />
      )}
    </>
  );
}

// A few small curly strands of thread drifting in the dark, plus fewer stars.
const fallCurls = [
  { x: 14, y: 22, r: -18, s: 1 },
  { x: 78, y: 18, r: 30, s: 0.8 },
  { x: 86, y: 70, r: -40, s: 1.1 },
  { x: 22, y: 76, r: 12, s: 0.9 },
  { x: 55, y: 86, r: 70, s: 0.7 },
];
const CURL = "M0 20 C10 4 26 4 28 16 C30 28 14 30 14 20 C14 10 30 6 40 14 C48 20 52 10 60 8";

// Tiny stars scattered through the dark while "past the event horizon." is on screen.
const fallStars = Array.from({ length: 16 }, (_, i) => {
  const r = (n: number) => Math.abs((Math.sin(i * 91.7 + n * 47.3) * 43758.5453) % 1);
  return { x: r(1) * 100, y: r(2) * 100, s: 1 + r(3) * 2.4, d: r(4) * 1.2, p: 0.6 + r(5) * 1.1 };
});

const FALL_MS = 4500;

function Fall({ origin, onDone }: { origin: { x: number; y: number }; onDone: () => void }) {
  const dimRef = useRef<HTMLDivElement>(null);
  const swirlRef = useRef<HTMLImageElement>(null);
  const holeRef = useRef<HTMLDivElement>(null);
  const downRef = useRef<HTMLParagraphElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const fellRef = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLImageElement | null)[]>([]);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // The hole opens where the button is, then the whole fall recentres there.
    const cx = origin.x;
    const cy = origin.y;
    const reach = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 60;
    const small = w < 768 ? 0.62 : 1;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = now - start;
      // 1. the page dims and softens
      if (dimRef.current) {
        const d = span(t, 0, 500);
        dimRef.current.style.opacity = `${d * 0.6}`;
        dimRef.current.style.backdropFilter = `blur(${d * 3}px)`;
      }
      // 2–4. objects drift in, float, then spiral into the hole
      debris.forEach((o, i) => {
        const el = items.current[i];
        if (!el) return;
        const appear = ease(span(t, 60 * i, 600 + 60 * i));
        const pull = span(t, 1000 + 40 * i, 2300 + 40 * i);
        const sx = o.x * w;
        const sy = o.y * h;
        const r0 = Math.hypot(sx - cx, sy - cy);
        const a0 = Math.atan2(sy - cy, sx - cx);
        const r = r0 * (1 - ease(pull));
        const a = a0 + ease(pull) * Math.PI * 2.4;
        const bob = Math.sin((t + i * 300) / 380) * 8 * (1 - pull);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r + bob;
        const scale = (0.6 + 0.4 * appear) * (1 - 0.92 * ease(pull)) * small;
        el.style.opacity = `${appear * (1 - span(t, 2100, 2400))}`;
        el.style.transform = `translate3d(${x - o.size / 2}px, ${y - o.size / 2}px, 0) rotate(${(i % 2 ? 1 : -1) * (8 + ease(pull) * 540)}deg) scale(${scale})`;
      });
      // The swirl itself becomes the hole: it spins up behind the button, then
      // keeps growing until its dark heart fills the screen. The darkness is
      // pinned to the swirl's core and grows with it, so it's one spiral.
      const grow = ease(span(t, 700, 2400));
      const engulf = ease(span(t, 1900, 3000)) ** 1.6;
      const swirlScale = (0.5 + grow * 3) * (1 + engulf * 14) * small;
      const turn = -t / 4;
      if (swirlRef.current) {
        swirlRef.current.style.opacity = `${span(t, 700, 1500) * (1 - span(t, 2850, 3150))}`;
        swirlRef.current.style.transform = `translate(-63%, -47%) rotate(${turn}deg) scale(${swirlScale})`;
      }
      if (holeRef.current) {
        // the swirl's dark core is ~70px across at scale 1
        const core = (34 * swirlScale) / (0.72 * (Math.hypot(w, h) + 120));
        holeRef.current.style.transform = `rotate(${turn - 20}deg) scale(${core}, ${core * (0.74 + 0.26 * engulf)})`;
        holeRef.current.style.opacity = `${span(t, 900, 1400)}`;
      }
      if (starsRef.current) starsRef.current.style.opacity = `${span(t, 2800, 3200) * (1 - span(t, 3800, 4150))}`;
      if (downRef.current) downRef.current.style.opacity = `${span(t, 3000, 3300) * (1 - span(t, 3650, 3900))}`;
      if (fellRef.current) fellRef.current.style.opacity = `${span(t, 3900, 4250)}`;
      if (t >= FALL_MS) {
        done.current();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [origin]);

  const reachPx = typeof window === "undefined" ? 2000 : Math.hypot(window.innerWidth, window.innerHeight) + 120;
  return (
    <div aria-hidden="true" className="pointer-events-auto fixed inset-0 z-[200] overflow-hidden">
      <div ref={dimRef} className="absolute inset-0 bg-background opacity-0" />
      {debris.map((o, i) => (
        <img
          key={o.src}
          ref={(el) => {
            items.current[i] = el;
          }}
          src={o.src}
          alt=""
          draggable={false}
          className="absolute left-0 top-0 max-w-none object-contain opacity-0 [filter:drop-shadow(0_18px_22px_rgb(0_0_0/0.25))]"
          style={{ width: o.size, height: o.size }}
        />
      ))}
      <div
        ref={holeRef}
        className="absolute rounded-full opacity-0 [filter:blur(6px)]"
        style={{
          left: origin.x - reachPx * 2,
          top: origin.y - reachPx * 2,
          width: reachPx * 4,
          height: reachPx * 4,
          transform: "scale(0)",
          // no edge anywhere: black core, charcoal, smoke, then a haze that
          // melts into the paper, so it reads as the swirl deepening
          background:
            "radial-gradient(closest-side, #0b0b0d 0%, #0b0b0d 36%, rgb(22 22 25) 42%, rgb(40 40 43 / 0.82) 48%, rgb(78 76 73 / 0.5) 56%, rgb(130 126 120 / 0.24) 65%, rgb(170 166 160 / 0.08) 74%, transparent 84%)",
        }}
      />
      <img ref={swirlRef} src={swirl} alt="" className="absolute origin-[63%_47%] w-[360px] max-w-none opacity-0 [mask-image:radial-gradient(closest-side,black_55%,transparent_100%)]" style={{ left: origin.x, top: origin.y }} />
      <div ref={starsRef} className="absolute inset-0 opacity-0">
        {fallCurls.map((c, k) => (
          <svg key={`c${k}`} viewBox="-2 0 64 34" className="animate-star-flicker absolute w-16 text-white/50" style={{ left: `${c.x}%`, top: `${c.y}%`, rotate: `${c.r}deg`, scale: `${c.s}`, animationDelay: `${k * 0.3}s`, animationDuration: "1.8s" }}>
            <path d={CURL} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        ))}
        {fallStars.map((st, k) => (
          <span
            key={k}
            className="animate-star-flicker absolute rounded-full bg-white"
            style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, animationDelay: `${st.d}s`, animationDuration: `${st.p}s`, boxShadow: st.s > 2 ? "0 0 6px 1px rgba(255,255,255,0.6)" : undefined }}
          />
        ))}
      </div>
      <p ref={downRef} className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-hand text-4xl leading-tight text-white opacity-0">
        past the<br />&nbsp;&nbsp;event horizon.
      </p>
      <div ref={fellRef} className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-white opacity-0">
        <p className="font-serif text-6xl">you crossed over.</p>
        <p className="mt-2 font-hand text-2xl tracking-wide text-white/80">here's everything else.</p>
      </div>
    </div>
  );
}

// On /work after falling in: the screen starts black with "you crossed over." and
// fades away onto the arrival screen, which says the same thing.
export function ArrivalFade() {
  useEffect(() => {
    takeFlag(FELL_IN);
    const curtain = document.getElementById("rabbit-hole-curtain");
    if (!curtain) return;
    // land at the top, behind the curtain, then let the dark lift
    window.scrollTo(0, 0);
    const settle = [80, 200, 380].map((ms) => window.setTimeout(() => window.scrollTo(0, 0), ms));
    const a = window.setTimeout(() => {
      window.scrollTo(0, 0);
      curtain.style.opacity = "0";
    }, 480);
    const b = window.setTimeout(() => curtain.remove(), 1600);
    return () => {
      settle.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);
  return null;
}

// ---------------------------------------------------------------------------
// "reach escape velocity ↑" is the reverse: the hole spits the objects back out, the
// light floods in from the middle, and we're back at the work section.
export function ClimbBackButton({ className, children }: { className?: string; children: ReactNode }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLButtonElement>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <button
        ref={ref}
        className={className}
        onClick={() => {
          if (origin) return;
          setOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
          remember(CLIMBED_OUT);
        }}
      >
        {children}
      </button>
      {origin && <ClimbOut origin={origin} onDone={() => void navigate({ to: "/", hash: "work" })} />}
    </>
  );
}

const CLIMB_MS = 1900;

function ClimbOut({ origin, onDone }: { origin: { x: number; y: number }; onDone: () => void }) {
  const swirlRef = useRef<HTMLImageElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLImageElement | null)[]>([]);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const small = w < 768 ? 0.62 : 1;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = now - start;
      // Same trick as the way in: the light is the swirl's own heart. The
      // swirl grows and its glowing core grows with it, pinned to the centre,
      // until it washes out the screen: one spiral, no separate shape.
      const grow = ease(span(t, 0, 1300));
      const engulf = ease(span(t, 700, 1700)) ** 1.6;
      const swirlScale = (1 + grow * 3) * (1 + engulf * 14) * small;
      const turn = t / 4;
      if (swirlRef.current) {
        swirlRef.current.style.opacity = `${span(t, 0, 300) * (1 - span(t, 1500, 1800)) * 0.6}`;
        swirlRef.current.style.transform = `translate(-63%, -47%) rotate(${turn}deg) scale(${swirlScale})`;
      }
      // objects burst out of the middle, unspinning back to where they belong
      debris.forEach((o, i) => {
        const el = items.current[i];
        if (!el) return;
        const out = ease(span(t, 100 + 30 * i, 1200 + 30 * i));
        const ex = o.x * w;
        const ey = o.y * h;
        const r0 = Math.hypot(ex - origin.x, ey - origin.y);
        const a0 = Math.atan2(ey - origin.y, ex - origin.x);
        const r = r0 * out;
        const a = a0 - (1 - out) * Math.PI * 1.6;
        const x = origin.x + Math.cos(a) * r;
        const y = origin.y + Math.sin(a) * r;
        el.style.opacity = `${span(t, 100, 300) * (1 - span(t, 1500, 1850))}`;
        el.style.transform = `translate3d(${x - o.size / 2}px, ${y - o.size / 2}px, 0) rotate(${(1 - out) * 360}deg) scale(${(0.1 + 0.9 * out) * small})`;
      });
      // the light comes back in from the middle
      if (lightRef.current) {
        const core = (34 * swirlScale) / (0.72 * (Math.hypot(w, h) + 120));
        lightRef.current.style.opacity = `${span(t, 250, 650)}`;
        lightRef.current.style.transform = `rotate(${turn - 20}deg) scale(${core}, ${core * (0.74 + 0.26 * engulf)})`;
      }
      if (t >= CLIMB_MS) {
        done.current();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [origin]);

  const reachPx = typeof window === "undefined" ? 2000 : Math.hypot(window.innerWidth, window.innerHeight) + 120;
  return (
    <div aria-hidden="true" className="pointer-events-auto fixed inset-0 z-[200] overflow-hidden bg-[#0b0b0d]/0">
      <div
        ref={lightRef}
        className="absolute rounded-full opacity-0 [filter:blur(6px)]"
        style={{
          left: origin.x - reachPx * 2,
          top: origin.y - reachPx * 2,
          width: reachPx * 4,
          height: reachPx * 4,
          transform: "scale(0)",
          // the same layered falloff as the way in, in paper tones
          background:
            "radial-gradient(closest-side, var(--background) 0%, var(--background) 36%, color-mix(in oklch, var(--background) 85%, transparent) 44%, color-mix(in oklch, var(--background) 50%, transparent) 54%, color-mix(in oklch, var(--background) 22%, transparent) 64%, color-mix(in oklch, var(--background) 6%, transparent) 74%, transparent 84%)",
        }}
      />
      <img ref={swirlRef} src={swirl} alt="" className="absolute origin-[63%_47%] w-[360px] max-w-none opacity-0 invert [mask-image:radial-gradient(closest-side,black_55%,transparent_100%)]" style={{ left: origin.x, top: origin.y }} />
      {debris.map((o, i) => (
        <img
          key={o.src}
          ref={(el) => {
            items.current[i] = el;
          }}
          src={o.src}
          alt=""
          draggable={false}
          className="absolute left-0 top-0 max-w-none object-contain opacity-0"
          style={{ width: o.size, height: o.size }}
        />
      ))}
    </div>
  );
}

export { sparkles as sparklesImage, swirl as swirlImage };
