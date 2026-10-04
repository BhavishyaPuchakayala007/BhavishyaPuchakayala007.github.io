import { useEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

// The site's running joke about aiming for the stars: small stars scattered
// over every section that split apart when you click them, and a rocket on the
// right edge that climbs toward one as you scroll.

const SPARK = "M12 1 C13 9 15 11 23 12 C15 13 13 15 12 23 C11 15 9 13 1 12 C9 11 11 9 12 1Z";

// A fixed scatter, so the sky looks the same on the server and in the browser.
const hash = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const round = (n: number) => Math.round(n * 10) / 10;

// What the cursor says as the stars go, one line per star, then it settles.
const wishes = [
  "one star down. make a wish.",
  "that's one small click for you…",
  "…one giant leap for my ego.",
  "aim for the stars. collect a few on the way.",
  "you know they grow back, right?",
  "okay, astronaut. the thread is that way.",
];
let popped = 0;

// Where the six pieces fly when a star splits (px).
const shards = [0, 1, 2, 3, 4, 5].map((i) => {
  const a = (i / 6) * Math.PI * 2 + 0.4;
  return { dx: Math.round(Math.cos(a) * 26), dy: Math.round(Math.sin(a) * 26) };
});

function Star({ left, top, size, blue, delay, hidden }: { left: string; top: string; size: number; blue: boolean; delay: number; hidden: boolean }) {
  const [state, setState] = useState<"idle" | "split" | "gone">("idle");
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  const split = () => {
    if (state !== "idle") return;
    setState("split");
    popped += 1;
    const text = wishes[Math.min(popped, wishes.length) - 1]!;
    window.dispatchEvent(new CustomEvent("cursor-comment", { detail: { id: `star:${popped}`, text, fade: true } }));
    // gone for a while, then a new one fades in where it was
    timers.current.push(window.setTimeout(() => setState("gone"), 700), window.setTimeout(() => setState("idle"), 9000));
  };

  return (
    <button type="button" tabIndex={-1} aria-label="a star" onClick={split} data-cursor={state === "idle" ? "go on. click it." : ""} className={cn("absolute -translate-x-1/2 -translate-y-1/2 bg-transparent p-2", hidden && "hidden", blue ? "text-cursor" : "text-foreground/45", state === "idle" ? "pointer-events-auto" : "pointer-events-none")} style={{ left, top }}>
      <svg viewBox="0 0 24 24" width={size} height={size} className={cn("block transition-transform duration-300", state === "idle" ? "animate-twinkle scale-100 hover:scale-150" : "scale-0")} style={{ animationDelay: `${delay}s` }}>
        <path d={SPARK} fill="currentColor" />
      </svg>
      {state === "split" &&
        shards.map((shard, i) => (
          <svg key={i} viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} className="animate-star-shard absolute left-1/2 top-1/2" style={{ "--dx": `${shard.dx}px`, "--dy": `${shard.dy}px` } as CSSProperties}>
            <path d={SPARK} fill="currentColor" />
          </svg>
        ))}
    </button>
  );
}

// A scatter of stars over whatever positioned box it's placed in. Positions
// run from 0 to `width`/`height` in the given units (percent of the box by
// default; the sideways story uses vw and vh).
// What a star must not sit on top of: words, pictures, drawings, buttons.
const CONTENT = 'p, h1, h2, h3, li, dt, dd, blockquote, img, figure, a, button, [role="img"], [data-avoid]';
// How much air (px) a star leaves around them.
const CLEARANCE = 10;

export function Stars({ count, seed, width = 100, height = 100, top = 0, xUnit = "%", yUnit = "%", className }: { count: number; seed: number; width?: number; height?: number; top?: number; xUnit?: string; yUnit?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [crowded, setCrowded] = useState<ReadonlySet<number>>(new Set());

  // The scatter is random, so some stars land on text or on a drawing. Find
  // those once the page has settled (and again if the window changes) and
  // leave them out.
  useEffect(() => {
    const check = () => {
      const sky = ref.current;
      const area = sky?.parentElement;
      if (!sky || !area || sky.offsetParent === null) return;
      const boxes = [...area.querySelectorAll<HTMLElement>(CONTENT)]
        .filter((el) => !sky.contains(el) && !el.closest("[data-backdrop]"))
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0);
      const next = new Set<number>();
      [...sky.children].forEach((star, i) => {
        // measured from where the star would be, whether or not it's showing
        const el = star as HTMLElement;
        const wasHidden = el.classList.contains("hidden");
        if (wasHidden) el.classList.remove("hidden");
        const s = el.getBoundingClientRect();
        if (wasHidden) el.classList.add("hidden");
        if (boxes.some((r) => s.left < r.right + CLEARANCE && s.right > r.left - CLEARANCE && s.top < r.bottom + CLEARANCE && s.bottom > r.top - CLEARANCE)) next.add(i);
      });
      setCrowded(next);
    };
    const timers = [300, 1500, 4000].map((ms) => window.setTimeout(check, ms));
    void document.fonts?.ready.then(check);
    window.addEventListener("resize", check);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {Array.from({ length: count }, (_, i) => {
        const n = seed * 100 + i * 5;
        return <Star key={i} left={`${round(hash(n + 1) * width)}${xUnit}`} top={`${round(top + hash(n + 2) * (height - top))}${yUnit}`} size={Math.round(9 + hash(n + 3) * 11)} blue={hash(n + 4) > 0.68} delay={round(hash(n + 5) * 3)} hidden={crowded.has(i)} />;
      })}
    </div>
  );
}

// The rocket that follows your scrolling. While the story runs sideways it
// travels sideways too, along the bottom edge. Where the story ends it reaches a
// spin launcher in the corner, gets whirled round faster and faster, and is
// flung straight up the right edge; from there on its height is how far down
// the rest of the page you are, and the moon at the top (plots available) is
// the end. Scroll back into the story and it drops back onto the bottom rail.
const HUB = 18; // radius of the launcher's swing (px)
const SPIN_MS = 1500;
const TURNS = 3;
const UNSPIN_MS = 650;
const LAUNCH_CLEARS = 0.24; // how much of the vertical rail the launch covers
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// What the launcher says for itself, in the same voice as the sketches.
const LAUNCH_VOICE = "no launch tower here. just physics, spun very fast.";

// The big version of the spin launch, played the first time you scroll out of
// the story: the launcher swells out of its corner to fill the screen, the
// rocket is whirled round it through a 3, 2, 1, the page shakes, and on "go"
// it is let fly straight up through a flash and two shockwaves. It never
// blocks scrolling; the page carries on underneath.
const CINE_FLY_MS = 380; // the launcher travelling from the corner to the middle
const CINE_RELEASE_MS = 2050; // when the rocket is let go
const CINE_END_MS = 2950;

function LaunchCinema({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const rig = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const rays = useRef<HTMLDivElement>(null);
  const arm = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLDivElement>(null);
  const rocket = useRef<HTMLDivElement>(null);
  const streak = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const waveA = useRef<HTMLDivElement>(null);
  const waveB = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState("3");
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = now - start;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const R = Math.min(W, H) * 0.27;
      // out of the corner, into the middle
      const fly = 1 - (1 - clamp01(t / CINE_FLY_MS)) ** 3;
      const cx = W - 38 + (W / 2 - (W - 38)) * fly;
      const cy = H - 36 + (H / 2 - (H - 36)) * fly;
      const scale = 0.12 + 0.88 * fly;
      // round and round, faster each time
      const whirl = clamp01((t - CINE_FLY_MS) / (CINE_RELEASE_MS - CINE_FLY_MS));
      const angle = (90 + 360 * TURNS) * whirl ** 2.4;
      const a = (angle * Math.PI) / 180;
      const gone = clamp01((t - CINE_RELEASE_MS) / 420);
      const after = clamp01((t - CINE_RELEASE_MS) / 800);
      const released = t >= CINE_RELEASE_MS;
      // the whole stage shudders as it winds up, and jolts on release
      const shake = released ? 10 * (1 - after) ** 2 : 5 * whirl ** 3;
      const sx = (Math.sin(t / 17) + Math.sin(t / 7.3)) * shake * 0.5;
      const sy = (Math.cos(t / 13) + Math.sin(t / 5.1)) * shake * 0.5;

      if (root.current) root.current.style.opacity = `${Math.min(1, t / 220) * (1 - clamp01((t - (CINE_END_MS - 500)) / 500))}`;
      if (stage.current) stage.current.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
      if (rig.current) {
        rig.current.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        rig.current.style.setProperty("--r", `${R.toFixed(1)}px`);
      }
      if (ring.current) ring.current.style.transform = `translate(-50%, -50%) rotate(${(-angle * 0.6).toFixed(1)}deg)`;
      if (rays.current) {
        rays.current.style.transform = `translate(-50%, -50%) rotate(${(-angle * 1.4).toFixed(1)}deg)`;
        rays.current.style.opacity = `${(released ? 1 - after : whirl ** 1.5) * 0.55}`;
      }
      if (arm.current) {
        arm.current.style.transform = `rotate(${(90 - angle).toFixed(1)}deg)`;
        arm.current.style.opacity = released ? "0" : "0.5";
      }
      if (trail.current) {
        trail.current.style.transform = `translate(-50%, -50%) rotate(${(180 - angle).toFixed(1)}deg)`;
        trail.current.style.opacity = `${released ? 1 - after : Math.min(1, whirl * 2)}`;
      }
      // on the swing, then straight up and out of the top of the screen
      const rx = released ? R : Math.sin(a) * R;
      const ry = released ? -(gone ** 2) * (H * 1.1) / Math.max(scale, 0.01) : Math.cos(a) * R;
      if (rocket.current) rocket.current.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${(released ? 0 : 90 - angle).toFixed(1)}deg)`;
      if (streak.current) {
        streak.current.style.opacity = released ? `${1 - after}` : "0";
        streak.current.style.transform = `translate3d(${R.toFixed(1)}px, 0, 0) translateX(-50%)`;
        streak.current.style.height = `${(-ry).toFixed(1)}px`;
      }
      if (flash.current) flash.current.style.opacity = released ? `${(1 - clamp01((t - CINE_RELEASE_MS) / 380)) * 0.9}` : "0";
      [waveA.current, waveB.current].forEach((wave, i) => {
        if (!wave) return;
        const p = clamp01((t - CINE_RELEASE_MS - i * 140) / 760);
        wave.style.opacity = released && p > 0 ? `${1 - p}` : "0";
        wave.style.transform = `translate3d(${R.toFixed(1)}px, 0, 0) translate(-50%, -50%) scale(${(0.3 + p * 7).toFixed(2)})`;
      });
      // an even beat, rather than one number per turn (the turns bunch up at the end)
      setCount(released ? "liftoff." : whirl < 0.36 ? "3" : whirl < 0.64 ? "2" : whirl < 0.86 ? "1" : "go");

      if (t >= CINE_END_MS) {
        done.current();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={root} className="absolute inset-0 opacity-0">
      <div className="absolute inset-0 bg-background/85 backdrop-blur-[3px]" />
      <div ref={flash} className="absolute inset-0 opacity-0" style={{ background: "radial-gradient(circle at 60% 50%, white 0%, color-mix(in oklch, var(--cursor) 35%, white) 22%, transparent 62%)" }} />
      <div ref={stage} className="absolute inset-0">
        {/* everything hangs off the launcher's hub, which starts in the corner */}
        <div ref={rig} className="absolute left-0 top-0 h-0 w-0">
          <div ref={rays} className="absolute rounded-full opacity-0" style={{ width: "calc(var(--r) * 5)", height: "calc(var(--r) * 5)", background: "repeating-conic-gradient(var(--foreground) 0deg 0.5deg, transparent 0.5deg 9deg)", mask: "radial-gradient(closest-side, transparent 30%, #000 44%, transparent 100%)", WebkitMask: "radial-gradient(closest-side, transparent 30%, #000 44%, transparent 100%)" }} />
          <div ref={ring} className="absolute rounded-full border-2 border-dashed border-foreground/70" style={{ width: "calc(var(--r) * 2 + 34px)", height: "calc(var(--r) * 2 + 34px)" }} />
          <div ref={trail} className="absolute rounded-full" style={{ width: "calc(var(--r) * 2 + 16px)", height: "calc(var(--r) * 2 + 16px)", background: "conic-gradient(var(--cursor) 0deg, transparent 170deg, transparent 360deg)", mask: "radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 11px))", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 11px))" }} />
          <div ref={arm} className="absolute left-0 top-0 h-0.5 origin-left bg-foreground" style={{ width: "var(--r)" }} />
          <div className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground bg-background" />
          <p className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-serif leading-none text-foreground" style={{ fontSize: count.length > 2 ? "calc(var(--r) * 0.42)" : "calc(var(--r) * 0.9)", fontStyle: count.length > 2 ? "italic" : "normal" }}>{count}</p>
          <div ref={waveA} className="absolute left-0 top-0 h-24 w-24 rounded-full border-2 border-cursor opacity-0" />
          <div ref={waveB} className="absolute left-0 top-0 h-24 w-24 rounded-full border border-foreground opacity-0" />
          <div ref={streak} className="absolute bottom-0 left-0 w-3 rounded-full opacity-0" style={{ background: "linear-gradient(to top, transparent, var(--signal-orange) 55%, white)" }} />
          <div ref={rocket} className="absolute left-0 top-0" style={{ width: "calc(var(--r) * 0.36)", aspectRatio: "24 / 46" }}>
            <svg viewBox="0 0 24 46" className="block h-full w-full overflow-visible">
              <path d="M8.5 33 C7 38 10.5 40 12 46 C13.5 40 17 38 15.5 33 Z" fill="var(--signal-orange)" className="animate-pulse" />
              <path d="M6 26 L2 35 H6 Z M18 26 L22 35 H18 Z" fill="var(--foreground)" />
              <path d="M12 2 C7 9 6 16 6 22 V33 H18 V22 C18 16 17 9 12 2 Z" fill="var(--background)" stroke="var(--foreground)" strokeWidth="1.4" strokeLinejoin="round" />
              <circle cx="12" cy="17" r="3" fill="var(--cursor)" stroke="var(--foreground)" strokeWidth="1.1" />
            </svg>
          </div>
        </div>
        <p className="absolute inset-x-0 bottom-[9vh] text-center font-hand text-[clamp(1.2rem,3.6vh,2.2rem)] tracking-[0.08em] text-foreground/80">{LAUNCH_VOICE}</p>
      </div>
    </div>
  );
}

export function Ascent({ visible = true, hull = "var(--background)", className }: { visible?: boolean; hull?: string; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const flatRef = useRef<HTMLDivElement>(null);
  const riseRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<SVGSVGElement>(null);
  const [burning, setBurning] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [arrived, setArrived] = useState(false);
  // "story": on the bottom rail; "spin": in the launcher; "page": on the way up
  const [phase, setPhase] = useState<"story" | "spin" | "page">("page");
  const [blasts, setBlasts] = useState(0);
  // the full-screen launch plays once per visit; after that the corner does it quietly
  const [cinema, setCinema] = useState(false);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let idle = 0;
    let mode: "story" | "spin" | "page" | "unspin" = "page";
    let since = 0;
    let first = true;
    let x = 0;
    let y = 0;
    let turn = 0;
    let played = false;
    let big = false; // the full-screen launch is running, so the little rocket hides

    const burn = (ms: number) => {
      setBurning(true);
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setBurning(false), ms);
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const root = rootRef.current;
      const rocket = rocketRef.current;
      if (!root || !rocket || getComputedStyle(root).display === "none") return;

      // where everything is, in px: the vertical rail, the bottom rail, and
      // the launcher's hub where the two meet
      const W = window.innerWidth;
      const H = window.innerHeight;
      const railX = W - 20;
      const baseY = H - 18;
      const cx = railX - HUB;
      const cy = baseY - HUB;
      const left = 34;
      const top = (moonRef.current?.getBoundingClientRect().bottom ?? 120) + 30;

      // how far along we are: through the sideways story, then down the rest
      const story = document.getElementById("brain");
      const max = document.documentElement.scrollHeight - H;
      const overall = max > 0 ? clamp01(window.scrollY / max) : 0;
      let inStory = false;
      let along = 0;
      let up = overall;
      if (story) {
        const end = story.offsetTop + story.offsetHeight - H;
        inStory = window.scrollY < end - 2;
        along = clamp01((window.scrollY - story.offsetTop) / Math.max(1, end - story.offsetTop));
        up = clamp01((window.scrollY - end) / Math.max(1, max - end));
      }

      if (first) mode = inStory ? "story" : "page";
      else if (mode === "story" && !inStory) {
        mode = still ? "page" : "spin";
        since = now;
        if (!still && !played) {
          played = true;
          big = true;
          setCinema(true);
        } else if (!still) window.dispatchEvent(new CustomEvent("cursor-comment", { detail: { id: `spin:${now}`, text: "spin launch. hold on.", fade: true } }));
      } else if (mode === "page" && inStory) {
        mode = still ? "story" : "unspin";
        since = now;
      }

      let tx = railX;
      // the launch itself clears the first stretch of the rail, so it reads as
      // a launch even if you have only just scrolled past the story
      let ty = cy + (top - cy) * (LAUNCH_CLEARS + (1 - LAUNCH_CLEARS) * up);
      let tr = 0;
      let whirl = 0;
      let angle = 0;
      if (mode === "story") {
        tx = left + (cx - left) * along;
        ty = baseY;
        tr = 90;
      } else if (mode === "spin") {
        const t = (now - since) / (big ? CINE_RELEASE_MS : SPIN_MS);
        if (t >= 1) {
          // let go at the right-hand side of the swing, pointing straight up
          big = false;
          mode = "page";
          x = railX;
          y = cy;
          turn = 0;
          setBlasts((n) => n + 1);
          burn(900);
        } else {
          angle = (90 + 360 * TURNS) * t ** 2.4;
          whirl = t;
        }
      } else if (mode === "unspin") {
        const t = (now - since) / UNSPIN_MS;
        if (t >= 1) mode = "story";
        else {
          angle = 450 * (1 - t) ** 2;
          whirl = 1 - t;
        }
      }

      if (mode === "spin" || mode === "unspin") {
        // on the swing: measured from the bottom of the circle, heading right
        const a = (angle * Math.PI) / 180;
        x = cx + Math.sin(a) * HUB;
        y = cy + Math.cos(a) * HUB;
        turn = 90 - angle;
      } else if (first) {
        x = tx;
        y = ty;
        turn = tr;
      } else if (mode === "story") {
        x += (tx - x) * 0.25;
        y += (ty - y) * 0.25;
        turn += (tr - turn) * 0.3;
      } else {
        // "page": after a launch this is the climb, so it eases up the rail
        x += (tx - x) * 0.25;
        y += (ty - y) * 0.11;
        turn += (tr - turn) * 0.3;
      }
      first = false;

      rocket.style.transform = `translate3d(${(x - 12).toFixed(1)}px, ${(y - 23).toFixed(1)}px, 0) rotate(${turn.toFixed(1)}deg)`;
      rocket.style.opacity = big ? "0" : "1";
      rocket.dataset["cursor"] = overall > 0.985 ? "landed. moon plots open for booking soon." : `next stop: the moon. ${Math.round(overall * 100)}% of the way there.`;
      const hub = hubRef.current;
      if (hub) {
        hub.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        hub.style.display = story ? "" : "none";
      }
      const trail = trailRef.current;
      if (trail) {
        trail.style.transform = `translate(-50%, -50%) rotate(${(180 - angle).toFixed(1)}deg)`;
        trail.style.opacity = `${big ? 0 : Math.min(1, whirl * 1.8)}`;
      }
      const flat = flatRef.current;
      if (flat) {
        flat.style.left = `${left}px`;
        flat.style.width = `${Math.max(0, cx - left)}px`;
        flat.style.top = `${baseY}px`;
      }
      const rise = riseRef.current;
      if (rise) {
        rise.style.left = `${railX}px`;
        rise.style.top = `${top - 12}px`;
        rise.style.height = `${Math.max(0, cy - top + 12)}px`;
      }
      const shown = mode === "unspin" ? "spin" : mode;
      setPhase((was) => (was === shown ? was : shown));
      setLaunched(overall > 0.004);
      setArrived(overall > 0.985);
    };

    const onScroll = () => burn(200);
    frame = requestAnimationFrame(tick);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const spinning = phase === "spin";
  return (
    <div ref={rootRef} aria-hidden="true" className={cn("pointer-events-none fixed inset-0 z-[60] hidden text-foreground transition-opacity duration-700 wide:block", visible ? "opacity-100" : "opacity-0", className)}>
      {/* where it's headed: the moon, with one plot already flagged */}
      <svg ref={moonRef} viewBox="0 0 24 28" className={cn("absolute right-2 top-24 w-6 overflow-visible transition-transform duration-700", arrived && "scale-125")}>
        <path d="M17 9 V1 l5 1.8 l-5 1.8" fill="var(--cursor)" stroke="var(--cursor)" strokeWidth="1.2" strokeLinejoin="round" className={cn("transition-opacity duration-500", arrived ? "opacity-100" : "opacity-0")} />
        <circle cx="12" cy="16" r="10" fill={hull} stroke="currentColor" strokeWidth="1.8" />
        <circle cx="8.5" cy="13" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.1" opacity=".55" />
        <circle cx="14.5" cy="19.5" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.1" opacity=".55" />
        <circle cx="16" cy="11.5" r="1.2" fill="none" stroke="currentColor" strokeWidth="1.1" opacity=".55" />
      </svg>

      {/* the two flight paths: along the bottom during the story, then up the edge */}
      <div ref={flatRef} className={cn("absolute border-t border-dashed border-current transition-opacity duration-700", phase === "story" ? "opacity-25" : "opacity-0")} />
      <div ref={riseRef} className={cn("absolute border-l border-dashed border-current transition-opacity duration-700", phase === "story" ? "opacity-10" : "opacity-25")} />
      <p className={cn("absolute bottom-[3px] left-[66px] whitespace-nowrap font-hand text-sm tracking-[0.12em] transition-opacity duration-500", phase === "story" && !launched ? "opacity-60" : "opacity-0")}>scroll to launch →</p>

      {/* the spin launcher, in the corner where the two paths meet */}
      <div ref={hubRef} className="absolute left-0 top-0">
        <div data-cursor={LAUNCH_VOICE} className="pointer-events-auto absolute rounded-full" style={{ width: HUB * 2 + 14, height: HUB * 2 + 14, left: -HUB - 7, top: -HUB - 7 }} />
        <div className={cn("absolute rounded-full border border-dashed border-current transition-opacity duration-500", spinning ? "animate-spin opacity-70 [animation-direction:reverse] [animation-duration:.5s]" : "opacity-30")} style={{ width: HUB * 2 + 14, height: HUB * 2 + 14, left: -HUB - 7, top: -HUB - 7 }} />
        <div className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current opacity-60" />
        {/* the streak behind the rocket as it whirls */}
        <div ref={trailRef} className="absolute rounded-full opacity-0" style={{ width: HUB * 2 + 6, height: HUB * 2 + 6, background: "conic-gradient(var(--cursor) 0deg, transparent 150deg, transparent 360deg)", mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))" }} />
        {/* the ring that bursts out as it lets go */}
        {blasts > 0 && <div key={blasts} className="animate-shockwave absolute rounded-full border-2 border-cursor" style={{ width: HUB * 2, height: HUB * 2 }} />}
      </div>

      <div ref={rocketRef} data-cursor="" className="pointer-events-auto absolute left-0 top-0 transition-opacity duration-200 will-change-transform" style={{ width: 24, height: 46 }}>
        <svg viewBox="0 0 24 46" className="block h-full w-full overflow-visible">
          <path d="M8.5 33 C7 38 10.5 40 12 46 C13.5 40 17 38 15.5 33 Z" fill="var(--signal-orange)" className={cn("transition-opacity duration-150", burning || spinning ? "animate-pulse opacity-100" : "opacity-0")} />
          <path d="M6 26 L2 35 H6 Z M18 26 L22 35 H18 Z" fill="currentColor" />
          <path d="M12 2 C7 9 6 16 6 22 V33 H18 V22 C18 16 17 9 12 2 Z" fill={hull} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="12" cy="17" r="3" fill="var(--cursor)" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
      {cinema && <LaunchCinema onDone={() => setCinema(false)} />}
    </div>
  );
}
