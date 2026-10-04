import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, X } from "lucide-react";
import { useEffect, useRef, useState, type ComponentType, type MouseEvent } from "react";

import iitmGate from "@/assets/iit-madras-gate.webp";
import earth from "@/assets/rabbit-hole/earth.webp";
import astronautFalling from "@/assets/rabbit-hole/astronaut-falling.webp";
import { builds, BuildStory, type Build } from "@/components/builds";
import { ArrivalFade, ClimbBackButton } from "@/components/rabbit-hole";
import { Ascent } from "@/components/space";
import { FIRST_NAME, LINKS, NAME } from "@/lib/profile";
import { jsonLd, pageMeta, SITE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/work")({
  head: () => ({
    ...pageMeta({
      title: `The whole notebook | ${NAME}`,
      description:
        "Everything Bhavishya Puchakayala has built and written so far: HandSync (a tendon-driven robotic hand teleoperated from a webcam), TensorTribe (speech recognition for dysarthric speech), drug-interaction graph networks, field notes on engineering, and milestones.",
      path: "/work",
    }),
    scripts: [
      jsonLd({
        "@type": "CollectionPage",
        url: `${SITE_URL}/work`,
        name: `Projects and notes by ${NAME}`,
        author: { "@id": `${SITE_URL}/#person` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: entries
            .filter((p) => p.tags.includes("Builds"))
            .map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "CreativeWork",
                name: p.title,
                description: p.long,
                ...(p.link ? { url: p.link.href } : {}),
                ...(p.code ? { codeRepository: p.code } : {}),
                author: { "@type": "Person", name: NAME, url: SITE_URL },
              },
            })),
        },
      }),
    ],
  }),
  component: WorkPage,
});

// The first tag is the shelf it sits on (and what the filters match).
type Entry = {
  title: string;
  tags: string[];
  blurb: string;
  long: string;
  // A build gets a drawing of how it works; everything else gets a `mark`,
  // a few characters written large over a loose thread.
  Art?: ComponentType<{ className?: string }>;
  mark?: string;
  // Or a photograph, with whoever took it.
  photo?: { src: string; alt: string; credit: string; href: string };
  link?: { label: string; href: string };
  code?: string;
  // The builds carry their full step-by-step story (see components/builds.tsx).
  build?: Build;
};

// The posts live on LinkedIn; until each has its own address here, they point
// at the profile.
const onLinkedIn = { label: "find it on linkedin", href: LINKS.linkedin };

const entries: Entry[] = [
  ...builds.map((build): Entry => ({
    title: build.title,
    tags: ["Builds", ...build.tags, ...(build.status ? [build.status] : [])],
    Art: build.Art,
    blurb: build.short,
    long: build.summary,
    build,
    ...(build.link ? { link: { label: "see it up close", href: build.link } } : {}),
    ...(build.code ? { code: build.code } : {}),
  })),
  { title: "The infinite-energy phase", tags: ["Field notes", "Thermodynamics"], mark: "∞ ?", link: onLinkedIn, blurb: "physics is annoyingly consistent.", long: "every engineering student goes through it once: you discover motors, then dynamos, and you're convinced you've found a loophole in physics. if the wheel spins a dynamo and the dynamo charges the battery, why can't it run forever? then you meet thermodynamics, which doesn't care how clever the idea sounds. a little heat, a little friction, a little resistance. the lesson that stuck: the hardest part is figuring out which constraints you don't get to negotiate with." },
  { title: "Survival of the smartest", tags: ["Field notes", "JEE"], mark: "485", link: onLinkedIn, blurb: "why JEE Advanced can't be leaked.", long: "JEE Advanced might be the only exam where, even if someone hands you the paper early, you still need to know how to solve it. the real security layer is the difficulty itself. i wrote this a year after walking into that exam hall myself. 485 people reacted, which i'm still processing." },
  { title: "Scope first", tags: ["Field notes", "Engineering"], mark: "scope ≠ solve", link: onLinkedIn, blurb: "what first year actually taught me.", long: "most people enter engineering thinking the hard part is solving problems. my first year at IIT Madras taught me it's often scoping them. you can spend hours discussing solutions before realising everyone understood the problem differently. change one constraint and the approach, the trade-offs, even what “good” looks like all change." },
  { title: "The Cambrian explosion", tags: ["Field notes", "Physical AI"], mark: "see · touch · adapt", link: onLinkedIn, blurb: "why physical AI, and why now.", long: "at Intel's Navigating the Age of Intelligence webinar, Srikanth Vidapanakal called this moment a “Cambrian explosion” of physical AI. it stayed with me, because the Cambrian explosion wasn't the beginning of life; it was when evolution accelerated. we've had robots for decades. what's changing is that they're beginning to see, touch, reason and adapt. we're no longer just building machines that move. we're building machines that understand the world before they move." },
  { title: "Where's the line?", tags: ["Field notes", "Responsible AI"], mark: "AI × class", link: onLinkedIn, blurb: "AI in classrooms, and a pledge.", long: "we use AI to debug code, understand tough concepts and explore ideas faster. industry expects that literacy; classrooms are still negotiating it. capability is racing ahead of clarity, and the real question is whether we're defining responsible norms fast enough. so i took the AI Impact Pledge under the India AI Impact Summit 2026, by IndiaAI, MeitY and Intel." },
  { title: "Practice shouldn't cost ₹5,000", tags: ["Field notes", "JEE"], mark: "₹5,000 → ₹0", link: onLinkedIn, blurb: "what actually got me into IIT.", long: "i spent two years paying for JEE test series. some helped, many didn't. what actually helped was practice adapted to my weak spots, with explanations i could question and dig into. now Gemini generates JEE Main-style practice tests for free, and that's the point: practice no longer has to be artificially expensive." },
  { title: "Idea → build", tags: ["Field notes", "Hardware"], mark: "idea → build", link: onLinkedIn, blurb: "an AI that wires your Arduino.", long: "i tried blueprint.am, which is basically Claude Code for electronics: describe what you want and it generates wiring diagrams, a bill of materials and assembly steps. i asked for an ESP32-based quadcopter and it one-shotted a reasonable palm-sized build. it isn't full hardware design, but the gap between “i have an idea” and “i built it” keeps shrinking." },
  { title: "JEE Advanced 2025", tags: ["Milestones", "June 2025"], mark: "cracked ✓", blurb: "survival of the smartest.", long: "after two years of late-night study sessions, i cracked JEE Advanced 2025 and earned a seat in mechanical engineering at IIT Madras." },
  { title: "987 / 1000", tags: ["Milestones", "Intermediate"], blurb: "and a rank of 583, the same summer.", long: "intermediate (MPC) at New Vision Junior College, 2023 to 2025, finishing with 987 out of 1000. the same summer: rank 583 in TG EAPCET 2025." },
  { title: "IIT Madras", tags: ["Milestones", "B.Tech, 2025–2029"], photo: { src: iitmGate, alt: "the entrance sign of IIT Madras in daylight, the institute's name and emblem in gold above a bed of flowers", credit: "photo: Raydann · CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:Facade_of_IIT_Madras_(cropped).jpg" }, blurb: "mechanical engineering, class of 2029.", long: "i walked through these gates in July 2025 as part of the freshie batch, a mechie from day one. four years to learn, build and grow alongside some of the brightest minds." },
  { title: "Data Science in Python", tags: ["Milestones", "DataCamp"], mark: "df.head()", blurb: "certified, june 2026.", long: "a DataCamp certification in data science with Python, issued June 2026. it sits under most of what i build: Python, NumPy, Matplotlib, scikit-learn, OpenCV and MediaPipe, plus AutoCAD and Fusion 360 for the parts you can hold." },
];

const filters = ["All", "Builds", "Field notes", "Milestones"];

// A fixed scatter of stars, so the sky looks the same on server and client.
// (A proper hash, so the stars scatter instead of lining up in little rows.)
const hash = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
// (Rounded, so the server and the browser write the same numbers.)
const round = (n: number) => Math.round(n * 100) / 100;
const stars = Array.from({ length: 32 }, (_, i) => ({
  x: round(hash(i * 4 + 1) * 100),
  y: round(hash(i * 4 + 2) * 100),
  s: round(1 + hash(i * 4 + 3) * 2),
  d: round(hash(i * 4 + 4) * 4),
}));

function Sky({ count = stars.length }: { count?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.slice(0, count).map((st, i) => (
        <span key={i} className="animate-twinkle-rare absolute rounded-full bg-white" style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, animationDelay: `${st.d * 2}s`, animationDuration: `${6 + st.d * 1.5}s` }} />
      ))}
    </div>
  );
}

// A little four-point sparkle, drawn like the doodles on the rest of the site.
function Spark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={cn("absolute h-5 w-5 text-white/80", className)}>
      <path d="M12 1 C13 9 15 11 23 12 C15 13 13 15 12 23 C11 15 9 13 1 12 C9 11 11 9 12 1Z" fill="currentColor" />
    </svg>
  );
}

function WorkPage() {
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState<number | null>(null);
  const shown = entries.map((p, i) => ({ p, i })).filter(({ p }) => filter === "All" || p.tags.includes(filter));
  // where the open entry sits among the cards on show, so prev and next step
  // through what the filter is showing and nothing else
  const at = open === null ? -1 : shown.findIndex(({ i }) => i === open);
  const step = (d: number) => {
    const next = shown[(at + d + shown.length) % shown.length];
    if (at >= 0 && next) setOpen(next.i);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    // the page around the work is space too, not paper
    const body = document.body.style.background;
    document.body.style.background = "#0b0b0d";
    return () => {
      document.body.style.background = body;
    };
  }, []);

  return (
    <main className="dark-page relative min-h-screen select-none overflow-hidden bg-[#0b0b0d] text-white">
      <ArrivalFade />
      <Ascent hull="#0b0b0d" className="text-white" />
      {/* the same links as the home page; a fade behind them, so the cards can scroll underneath */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-gradient-to-b from-[#0b0b0d] via-[#0b0b0d]/85 to-transparent px-5 pb-8 pt-5 sm:px-8 sm:pt-7">
        <Link to="/" className="font-serif text-3xl font-medium">{FIRST_NAME}</Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-white/70 md:flex" aria-label="Main navigation">
          <Link to="/" className="hover:text-white">brain</Link>
          <Link to="/" hash="work" className="hover:text-white">work</Link>
          <Link to="/" hash="notes" className="hover:text-white">notes</Link>
          <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className="hover:text-white">linkedin</a>
          <Link to="/" hash="hi" className="hover:text-white">let's talk</Link>
        </nav>
        <ClimbBackButton className="text-sm font-medium text-white/80 hover:text-white md:hidden">escape ↑</ClimbBackButton>
      </header>

      {/* 8. arrival: you crossed over. */}
      <section className="relative grid min-h-[100svh] place-items-center px-5">
        <Sky />
        <img src={earth} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute bottom-0 right-0 w-[110vw] max-w-none translate-x-[8%] translate-y-[38%] md:w-[52vw] md:translate-x-[6%] md:translate-y-[30%] [mask-image:linear-gradient(to_top,black_60%,transparent)]" />
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="M-20 300 C120 200 180 420 260 470 C340 520 300 640 420 680 C560 730 700 620 780 700 C860 780 900 860 1020 820" fill="none" stroke="white" strokeOpacity=".55" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        </svg>
        <img src={astronautFalling} alt="an astronaut drifting through space" draggable={false} className="animate-float-object absolute left-[6%] top-[14%] w-[38vw] max-w-[360px] md:left-[8%] md:top-[30%] md:w-[24vw] landscape:left-[8%] landscape:top-[30%] landscape:w-[24vw]" />
        {/* the words sit up in the dark sky, clear of the earth */}
        <div className="absolute left-6 top-[44%] md:left-[36vw] md:top-[20vh] landscape:left-[36vw] landscape:top-[20vh]">
          <h1 className="font-serif text-[clamp(3.2rem,6.5vw,6.5rem)] leading-none">you crossed over.</h1>
          <p className="mt-4 font-hand text-[clamp(1.3rem,1.9vw,1.8rem)] tracking-wide text-white/80">relax. the physics still works down here.</p>
        </div>
        <p className="absolute bottom-[12%] left-[30%] hidden -rotate-6 font-hand text-xl leading-snug tracking-wide text-white/80 md:block">
          every build,<br />every field note,<br />and a few numbers<br />i'm quietly proud of.
        </p>
        <Spark className="left-[12%] top-[18%]" />
        <Spark className="right-[30%] top-[24%] h-4 w-4" />
        <Spark className="bottom-[26%] right-[44%] h-3 w-3" />
        <Spark className="left-[46%] top-[70%] h-4 w-4" />
      </section>

      {/* 9. the whole notebook. */}
      <section className="relative mx-auto max-w-[1300px] px-5 pb-28 pt-24 sm:px-8">
        <Sky />
        <div className="relative flex items-end gap-4">
          <h2 className="font-serif text-[clamp(3rem,6vw,5.5rem)] leading-none">the whole notebook.</h2>
          <svg aria-hidden="true" viewBox="0 0 60 60" className="animate-spin-slow mb-3 h-14 w-14 text-white/70">
            <path d="M30 30 m0 -2 a2 2 0 1 1 -2 3 a6 6 0 1 1 9 -6 a11 11 0 1 1 -18 6 a17 17 0 1 1 28 -12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <div className="relative mt-8 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn("rounded-full border px-4 py-2 text-sm transition-colors", filter === f ? "border-white bg-white text-[#0b0b0d]" : "border-white/20 text-white/80 hover:border-white/60")}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map(({ p, i }) => (
            <button
              key={p.title}
              onClick={() => setOpen(i)}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.07]"
            >
              <Thumb p={p} />
              <div className="min-w-0 p-4 pr-10 sm:p-5 sm:pr-10">
                <p className="text-lg font-medium">{p.title}</p>
                <p className="mt-1 text-sm leading-snug text-white/60">{p.blurb}</p>
              </div>
              <ArrowUpRight className="absolute bottom-5 right-4 h-4 w-4 text-white/50 transition-colors group-hover:text-white" />
            </button>
          ))}
        </div>
      </section>

      <footer className="relative mx-auto flex max-w-[1300px] flex-wrap items-center justify-between gap-6 border-t border-white/10 px-5 py-10 sm:px-8">
        <p className="font-serif text-3xl">
          the long versions live on <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className="italic underline-offset-8 hover:underline">linkedin ↗</a>
        </p>
        <ClimbBackButton className="rounded-full border border-white/60 px-6 py-3 text-white transition-colors hover:bg-white hover:text-[#0b0b0d]">reach escape velocity ↑</ClimbBackButton>
      </footer>

      {open !== null && at >= 0 && <Spotlight entry={entries[open]!} position={at + 1} count={shown.length} onClose={() => setOpen(null)} onMove={step} />}
    </main>
  );
}

// An entry's picture: the drawing of how it works or, for a note or a
// milestone, its mark over a loose hand-drawn thread.
function Thumb({ p, big = false }: { p: Entry; big?: boolean }) {
  if (p.Art) {
    return <div className="aspect-[16/10] w-full overflow-hidden"><p.Art className="transition-transform duration-700 group-hover:scale-[1.03]" /></div>;
  }
  if (p.photo) {
    return <img src={p.photo.src} alt={p.photo.alt} draggable={false} className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />;
  }
  const mark = p.mark ?? p.title;
  return (
    <div className="relative grid aspect-[16/10] w-full place-items-center overflow-hidden bg-white/[0.03]">
      <svg aria-hidden="true" viewBox="0 0 200 125" className="absolute inset-0 h-full w-full text-white/15 transition-colors duration-500 group-hover:text-white/30">
        <path d="M-10 95 C40 15 70 120 100 60 C120 20 160 35 130 78 C110 105 70 70 110 52 C150 35 170 105 215 50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className={cn("relative px-4 text-center font-serif leading-tight", mark.length > 9 ? (big ? "text-5xl" : "text-2xl") : big ? "text-7xl" : "text-4xl")}>{mark}</span>
    </div>
  );
}

// 11. an entry, up close. The text scrolls; the close button and the prev/next
// bar stay put on top of it. Prev and next step through whatever the filter is
// showing, and every entry opens from its top.
function Spotlight({ entry, position, count, onClose, onMove }: { entry: Entry; position: number; count: number; onClose: () => void; onMove: (d: number) => void }) {
  const p = entry;
  const scrollRef = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  const move = useRef(onMove);
  close.current = onClose;
  move.current = onMove;

  // Keys, and the page behind stays still while this is open.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key === "ArrowRight") move.current(1);
      if (e.key === "ArrowLeft") move.current(-1);
    };
    window.addEventListener("keydown", key);
    document.documentElement.style.overflow = "hidden";
    // so the up/down keys and the space bar scroll the text straight away
    scrollRef.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", key);
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [entry]);

  const stop = (e: MouseEvent) => e.stopPropagation();
  return (
    <div role="dialog" aria-modal="true" aria-label={p.title} className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-[#0b0b0d]/95 backdrop-blur-sm" />
      <div ref={scrollRef} data-closeup-scroll tabIndex={-1} className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain outline-none" onClick={onClose}>
        <div key={p.title} className={cn("animate-reveal relative mx-auto grid min-h-full max-w-[1300px] gap-10 px-5 pb-32 pt-24 sm:px-8 md:grid-cols-[1fr_1.1fr]", p.build ? "content-start md:items-start" : "content-center items-center")}>
          {/* the picture comes first on a phone, and stays in view beside a long read on a wide screen */}
          <div className={cn("relative md:order-2", p.build && "md:[@media(min-height:640px)]:sticky md:[@media(min-height:640px)]:top-24")} onClick={stop}>
            <div className="overflow-hidden rounded-xl border border-white/10 shadow-2xl">
              <Thumb p={p} big />
            </div>
            <Spark className="-right-2 -top-6" />
          </div>
          <div onClick={stop}>
            <p className="text-xs tracking-wide text-white/50">{String(position).padStart(2, "0")} / {p.tags.join(" · ")}</p>
            <h3 className="mt-2 font-serif text-[clamp(2.6rem,6vw,5.5rem)] leading-none">{p.title}</h3>
            {p.build ? (
              <>
                <p className="mt-5 max-w-xl font-serif text-2xl leading-snug">{p.build.simple}</p>
                <div className="mt-6"><BuildStory build={p.build} dark /></div>
              </>
            ) : (
              <p className="mt-5 max-w-md text-lg leading-relaxed text-white/75">{p.long}</p>
            )}
            {(p.link || p.code) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {p.link && (
                  <a href={p.link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[#0b0b0d] transition-opacity hover:opacity-85">
                    {p.link.label} <ArrowRight className="h-4 w-4" />
                  </a>
                )}
                {p.code && (
                  <a href={p.code} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 transition-colors hover:bg-white/10">
                    code <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
            {p.photo && <a href={p.photo.href} target="_blank" rel="noreferrer license" className="mt-4 block text-xs text-white/50 hover:underline">{p.photo.credit}</a>}
            {!p.build && (
              <div className="mt-6 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <span key={t} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-[#0b0b0d]/80 text-white backdrop-blur hover:bg-white/10 sm:right-8 sm:top-7">
        <X className="h-5 w-5" />
      </button>
      {/* a fade behind the bar, so text scrolling past it stays readable */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 bg-gradient-to-t from-[#0b0b0d] via-[#0b0b0d]/90 to-transparent pb-6 pt-12 [&>button]:pointer-events-auto">
        {count > 1 && <button onClick={() => onMove(-1)} className="rounded-full border border-white/25 bg-[#0b0b0d] px-4 py-2 text-sm text-white/85 hover:bg-white/10">← prev</button>}
        <p className="min-w-12 text-center text-xs tabular-nums tracking-wide text-white/55">{position} / {count}</p>
        {count > 1 && <button onClick={() => onMove(1)} className="rounded-full border border-white/25 bg-[#0b0b0d] px-4 py-2 text-sm text-white/85 hover:bg-white/10">next →</button>}
      </div>
    </div>
  );
}
