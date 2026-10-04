import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

import cad from "@/assets/doodle-cad.svg";
import crawler from "@/assets/doodle-crawler.svg";
import flywheel from "@/assets/doodle-flywheel.svg";
import garage from "@/assets/doodle-garage.svg";
import hpcStory from "@/assets/doodle-hpc-story.svg";
import launch from "@/assets/doodle-launch.svg";
import mechatronics from "@/assets/doodle-mechatronics.svg";
import moon from "@/assets/doodle-moon.svg";
import physicalAi from "@/assets/doodle-physical-ai.svg";
import iitmGate from "@/assets/iit-madras-gate.webp";
import { SenseArt, ThinkArt } from "@/components/pipeline-art";
import { builds, BuildStory } from "@/components/builds";
import { CLIMBED_OUT, RabbitHoleButton, takeFlag } from "@/components/rabbit-hole";
import { Ascent, Stars } from "@/components/space";
import { EYELET_FX, EYELET_FY, HAND_VIEW, POSES, TendonHand, useEasedPose, useHandRoutine, type HandPose } from "@/components/tendon-hand";
import { Button } from "@/components/ui/button";
import { EMAIL, FIRST_NAME, LINKS, NAME } from "@/lib/profile";
import { jsonLd, pageMeta, person, SITE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    ...pageMeta({
      title: `${NAME} | mechanical engineering at IIT Madras, building physical AI`,
      description:
        "Bhavishya Puchakayala studies mechanical engineering at IIT Madras and builds machines that sense, think and act: HandSync, a tendon-driven robotic hand you teleoperate with your own, and TensorTribe, speech recognition for dysarthric speech.",
      path: "/",
    }),
    scripts: [
      jsonLd({
        "@graph": [
          person,
          { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: NAME, publisher: { "@id": `${SITE_URL}/#person` } },
          { "@type": "ProfilePage", url: SITE_URL, name: `${NAME}: the anatomy of a curious mechie`, mainEntity: { "@id": `${SITE_URL}/#person` } },
        ],
      }),
    ],
  }),
  component: Portfolio,
});

// The cursor's comment bubble stays quiet until something has a reason to
// speak: a moment in the story, or hovering something that has a comment.
type CursorComment = { id: string; text: string; fade: boolean };
// Only one bubble speaks at a time: "figure-open" tells every other bubble
// (objects, the robot hand, the cursor/phone comment) to go quiet.
const quietOthers = (id: number) => window.dispatchEvent(new CustomEvent<number>("figure-open", { detail: id }));
const say = (id: string, text: string, fade = true) => {
  quietOthers(-1);
  window.dispatchEvent(new CustomEvent<CursorComment>("cursor-comment", { detail: { id, text, fade } }));
};

// The sideways story needs a landscape window at least a laptop wide. Anything
// else (a phone either way up, a tablet held upright, a small tablet) gets the
// vertical one.
// This must say the same thing as the `wide` variant in styles.css.
const WIDE = "(min-width: 1100px) and (min-aspect-ratio: 6/5)";
const isWide = () => window.matchMedia(WIDE).matches;

// The story canvas is CANVAS_VW wide and slides CANVAS_TRAVEL_VW across the
// scroll. Everything on it is placed in vw/vh, and the SVG uses a viewBox of
// (CANVAS_VW * 10) x 1000, so one vw is 10 units and one vh is 10 units.
const CANVAS_VW = 570;
const CANVAS_TRAVEL_VW = 470;

// Place something on the canvas by its vw/vh coordinates.
const at = (x: number, y: number) => ({ left: `${x}vw`, top: `${y}vh` });

// A waypoint for the thread, in vw/vh. `loop` ties a little loop-de-loop at
// that point (radius in vh; negative loops downward).
type Waypoint = [x: number, y: number, loop?: number];

// Horizontal units are ~1.8x wider on screen than vertical ones, so loops are
// narrowed to stay round rather than squashed.
const LOOP_ASPECT = 1.8;

// Where the thread finally ends: at the "see the work" button.
const BUTTON_X = 537;
const BUTTON_Y = 59;

// The big loop the habit is tied around, near the end of the story.
const LOOP_X = 474;
const LOOP_Y = 70;
const LOOP_R = 17;

// The thread is a Catmull-Rom curve through the waypoints (plus the extra
// points each loop adds), written out as cubic Béziers in viewBox units.
type Segment = [x0: number, y0: number, c1x: number, c1y: number, c2x: number, c2y: number, x1: number, y1: number];

// `scale` maps waypoint units to path units (vw/vh → viewBox is 10; pixels
// are 1), and `aspect` squeezes loops to stay round on a stretched canvas.
function threadSegments(waypoints: Waypoint[], scale = 10, aspect = LOOP_ASPECT): Segment[] {
  const pts: [number, number][] = [];
  for (const [wx, wy, loop] of waypoints) {
    const x = wx * scale;
    const y = wy * scale;
    pts.push([x, y]);
    if (loop) {
      const r = loop * scale;
      const rx = Math.abs(r) / aspect;
      pts.push([x + rx, y - r], [x, y - 2 * r], [x - rx, y - r], [x + rx * 0.5, y + r * 0.15]);
    }
  }
  const segments: Segment[] = [];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    segments.push([p1[0], p1[1], p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]]);
  }
  return segments;
}

function threadPath(waypoints: Waypoint[]) {
  return segmentsPath(threadSegments(waypoints));
}

function segmentsPath(segments: Segment[]) {
  const f = (n: number) => n.toFixed(1);
  let d = `M${segments[0]?.[0] ?? 0} ${segments[0]?.[1] ?? 0}`;
  for (const [, , c1x, c1y, c2x, c2y, x1, y1] of segments) d += ` C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(x1)} ${f(y1)}`;
  return d;
}

// Points along the thread, evaluated straight from the Bézier maths, with the
// running arc length at each one. This replaces thousands of browser
// getPointAtLength calls, which froze the page for seconds on load.
type ThreadSamples = { xs: Float32Array; ys: Float32Array; lengths: Float32Array; total: number };

function sampleSegments(segments: Segment[], perSegment = 48): ThreadSamples {
  const n = segments.length * perSegment + 1;
  const xs = new Float32Array(n);
  const ys = new Float32Array(n);
  const lengths = new Float32Array(n);
  let k = 0;
  let total = 0;
  segments.forEach(([x0, y0, c1x, c1y, c2x, c2y, x1, y1], index) => {
    for (let step = index === 0 ? 0 : 1; step <= perSegment; step += 1) {
      const t = step / perSegment;
      const u = 1 - t;
      const x = u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x1;
      const y = u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y1;
      if (k > 0) total += Math.hypot(x - xs[k - 1]!, y - ys[k - 1]!);
      xs[k] = x;
      ys[k] = y;
      lengths[k] = total;
      k += 1;
    }
  });
  return { xs, ys, lengths, total };
}

// The thread leaves the tangle and loops wildly between the things I tinker
// with, smooths out through sense, think and act, runs along the timeline,
// ties the loop, and stops at the work.
const THREAD_WAYPOINTS: Waypoint[] = [
  [56.9, 19.9], [80, 58], [98, 50], [110, 44, 8], [120, 66], [132, 68], [142, 66, -6],
  [153, 57], [156, 40], [164, 29], [171, 33], [174.5, 35.6], [181, 42], [186, 62], [198, 68],
  [205, 68], [216, 50], [229, 34], [233, 50], [250, 58], [262, 70], [271, 88], [286, 88], [297, 62],
  [304, 48], [322, 51], [340, 52], [358, 50], [376, 46], [394, 43], [410, 46],
  [422, 60], [440, 70], [458, 71], [LOOP_X, LOOP_Y, LOOP_R], [496, 76], [514, 78], [528, 70], [BUTTON_X, BUTTON_Y],
];
const THREAD = threadPath(THREAD_WAYPOINTS);

// Sampled once, the first time anything needs points along the thread.
let threadSamples: ThreadSamples | null = null;
const getThreadSamples = () => (threadSamples ??= sampleSegments(threadSegments(THREAD_WAYPOINTS)));

// A deliberately messy scribble ball: the "free-body diagram" of my brain.
// It draws itself once on load before the rest of the page appears.
const TANGLE = "M412 441 C515 397 634 254 612 324 C514 323 496 516 405 384 C462 554 503 411 563 536 C550 451 352 221 429 252 C463 251 542 590 592 462 C722 444 518 320 633 498 C733 324 559 351 502 325 C451 436 535 231 665 369 C653 189 542 154 453 252 C356 135 579 427 545 447 C580 505 551 553 468 379 C518 265 542 377 549 499 C417 489 679 300 622 421 C560 362 446 473 393 465 C424 562 372 482 401 372 C511 215 515 477 398 393 C299 375 474 580 439 424 C406 450 754 502 668 389 C754 375 628 135 588 240 C647 360 527 578 489 496 C412 647 637 651 506 469 C517 579 481 408 530 253 C626 196 462 257 574 279 C588 381 649 162 652 341 C736 176 676 270 595 393 C551 502 511 179 608 312 C612 397 708 447 616 375 C736 373 748 312 627 469 C552 479 478 362 535 275 C572 284 689 483 596 461 C546 415 740 502 646 350 C568 483 705 479 578 470 C598 357 572 439 563 438 C591 259 667 301 541 295 C514 408 442 336 425 339 C477 175 577 532 566 565 C690 668 539 510 601 520 C501 495 679 640 594 488 C588 419 456 553 539 509 C654 369 727 177 651 357 C569 254 524 516 473 584 C434 629 437 615 543 528 C442 532 526 141 593 255 C601 231 606 485 639 519 C647 390 459 557 538 507 C576 518 628 307 533 264 C629 164 569 587 504 469 C613 399 567 642 617 482 C541 668 630 423 525 561 C455 646 384 347 449 499 C539 470 700 212 622 354 C596 424 286 189 397 302 C446 458 674 337 547 482 C549 579 634 356 633 287 C549 135 414 322 520 498 C534 503 529 135 511 184 C425 135 660 668 568 590 C683 437 488 449 606 279 C596 379 420 421 467 434 C471 407 689 259 661 443 C716 574 443 556 529 573 C594 538 432 461 514 588 C517 405 556 436 450 322 C505 459 612 520 577 556 C604 558 721 555 590 440 C525 596 458 425 392 320 C477 284 564 456 457 313 C510 414 656 303 584 339 C645 177 559 393 602 405 C470 350 507 466 470 418 C398 587 607 453 562 514 C605 541 471 310 462 352 C597 406 484 646 429 547 C559 367 672 461 640 371 C574 334 357 135 479 238 C445 135 484 601 551 447 C565 450 754 442 661 416 C754 468 560 135 476 191 C502 289 516 578 638 416 C547 405 304 412 394 413 C423 246 578 558 458 588 C465 625 583 385 619 466 C661 489 450 271 508 189 C453 135 441 135 510 212 C417 308 529 344 558 194 C625 135 578 668 446 536 C331 668 614 267 632 276 C754 178 412 653 405 488 C465 476 724 388 594 268 C622 135 486 278 453 295 C373 135 426 166 418 308 C403 372 613 387 625 476 C647 446 734 396 660 384 C754 555 570 156 507 255 C403 404 586 275 509 227 C471 141 443 489 393 465 C418 515 700 369 632 486 C564 668 746 567 634 424 C510 258 381 378 443 406 C476 256 497 135 486 246 C374 313 426 307 413 257 C379 248 440 397 518 456 C584 584 366 418 481 562 C565 608 613 381 540 489 C520 398 704 245 621 295 C662 479 342 484 389 465 C455 624 444 499 463 549 C354 668 438 372 552 530 C569 524 619 135 569 199";

function Portfolio() {
  const storyRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const listeners = useRef(new Set<(progress: number) => void>());
  const [noteRevealed, setNoteRevealed] = useState(false);
  const [scrollReady, setScrollReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // The header floats over the sideways story, but gets the page colour from
  // the work section on, so the links don't sit on top of project images. On
  // the vertical layout the story scrolls up underneath it, so there it has a
  // backing from the start.
  const [solidHeader, setSolidHeader] = useState(false);
  useEffect(() => {
    const check = () => {
      const work = document.getElementById("work");
      if (work) setSolidHeader(window.scrollY >= work.offsetTop - 80);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);
  const [filter, setFilter] = useState("All");

  // First the mind arrives, then its note, and only then does scrolling take over.
  useEffect(() => {
    const root = document.documentElement;
    // Climbing back out of the rabbit hole lands straight on the work, no intro.
    // So does any link straight to a section further down (the notebook page
    // has three of them).
    const section = ["#work", "#notes", "#hi"].includes(window.location.hash) ? window.location.hash.slice(1) : null;
    if (takeFlag(CLIMBED_OUT) || section) {
      setNoteRevealed(true);
      setScrollReady(true);
      requestAnimationFrame(() => document.getElementById(section ?? "work")?.scrollIntoView({ behavior: "instant" }));
      return;
    }
    root.style.overflow = "hidden";
    window.scrollTo(0, 0);
    let greet = 0;
    const unlock = () => {
      root.style.overflow = "";
      setNoteRevealed(true);
      setScrollReady(true);
      window.clearTimeout(greet);
      greet = window.setTimeout(() => say("intro", "hi, bhavishya here. scroll to launch."), 1800);
      window.clearTimeout(noteTimer);
      window.clearTimeout(unlockTimer);
      skipEvents.forEach((name) => window.removeEventListener(name, unlock));
    };
    const noteTimer = window.setTimeout(() => setNoteRevealed(true), 2200);
    const unlockTimer = window.setTimeout(unlock, 2600);
    // Anyone who tries to scroll early skips the rest of the intro.
    const skipEvents = ["wheel", "touchmove", "keydown"] as const;
    skipEvents.forEach((name) => window.addEventListener(name, unlock, { passive: true }));
    return () => {
      window.clearTimeout(greet);
      window.clearTimeout(noteTimer);
      window.clearTimeout(unlockTimer);
      skipEvents.forEach((name) => window.removeEventListener(name, unlock));
      root.style.overflow = "";
    };
  }, []);

  // One animation-frame loop runs the whole story. It eases toward the scroll
  // position, so wheel steps become a glide, and then moves the canvas, draws
  // the thread and reveals whatever the thread has reached, all directly on
  // the DOM, without asking React to re-render the page every frame.
  useEffect(() => {
    let frame = 0;
    let current = -1;
    const spoken = new Set<string>();
    const tick = () => {
      const section = storyRef.current;
      const canvas = canvasRef.current;
      if (section) {
        const distance = section.offsetHeight - window.innerHeight;
        const target = Math.min(1, Math.max(0, (window.scrollY - section.offsetTop) / Math.max(distance, 1)));
        const next = current < 0 || Math.abs(target - current) < 0.00005 ? target : current + (target - current) * SCROLL_EASE;
        if (next !== current) {
          current = next;
          if (canvas && isWide()) {
            canvas.style.transform = `translate3d(-${current * CANVAS_TRAVEL_VW}vw,0,0)`;
            const tip = current * CANVAS_TRAVEL_VW + TIP_SCREEN_ANCHOR * 100;
            const edge = current * CANVAS_TRAVEL_VW + 100 - REVEAL_INSET;
            canvas.querySelectorAll<HTMLElement>("[data-at]").forEach((el) => {
              // Most things reveal as they enter the screen; "thread" ones wait
              // for the thread itself (the loop's steps, the story comments).
              const shown = (el.dataset["mode"] === "thread" ? tip : edge) >= Number(el.dataset["at"]);
              el.toggleAttribute("data-shown", shown);
              // Story comments are said once, the first time the thread arrives.
              const line = el.dataset["say"];
              if (shown && line && !spoken.has(line)) {
                spoken.add(line);
                say(`story:${line}`, line);
              }
            });
          }
          listeners.current.forEach((listen) => listen(current));
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const subscribe = (listen: (progress: number) => void) => {
    listeners.current.add(listen);
    return () => {
      listeners.current.delete(listen);
    };
  };

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <main>
      <header className={cn("fixed inset-x-0 top-0 z-50 grid grid-cols-[minmax(0,1fr)_auto] items-center px-5 py-5 transition-opacity duration-700 sm:px-8 sm:py-7", solidHeader ? "bg-background" : "bg-transparent narrow:bg-background/90 narrow:backdrop-blur-sm", scrollReady ? "opacity-100" : "pointer-events-none animate-reveal [animation-delay:2.6s]")}>
        <button aria-label="Back to introduction" onClick={() => go("brain")} className="w-fit bg-transparent font-serif text-3xl font-medium">
          {FIRST_NAME}
        </button>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Main navigation">
          <button onClick={() => go("brain")} className="story-link bg-transparent">brain</button>
          <button onClick={() => go("work")} className="story-link bg-transparent">work</button>
          <button onClick={() => go("notes")} className="story-link bg-transparent" data-cursor="thinking, out loud.">notes</button>
          <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className="story-link" data-cursor="the formal version of all this.">linkedin</a>
          <button onClick={() => go("hi")} className="story-link bg-transparent" data-cursor="i reply. promise.">let's talk</button>
        </nav>
        <button className="relative h-10 w-10 md:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((open) => !open)}>
          <span className={cn("absolute left-1/2 top-1/2 h-[2px] w-7 -translate-x-1/2 rounded-full bg-foreground transition-all duration-300", menuOpen ? "rotate-45" : "-translate-y-[5px]")} />
          <span className={cn("absolute left-1/2 top-1/2 h-[2px] w-7 -translate-x-1/2 rounded-full bg-foreground transition-all duration-300", menuOpen ? "-rotate-45" : "translate-y-[4px]")} />
        </button>
        {menuOpen && (
          <nav className="absolute inset-x-4 top-16 grid gap-1 border border-border bg-background p-3 text-lg shadow-xl md:hidden">
            <button onClick={() => go("brain")} className="p-3 text-left">brain</button>
            <button onClick={() => go("work")} className="p-3 text-left">work</button>
            <button onClick={() => go("notes")} className="p-3 text-left">notes</button>
            <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className="p-3">linkedin</a>
            <button onClick={() => go("hi")} className="p-3 text-left">let's talk</button>
          </nav>
        )}
      </header>

      <section id="brain" ref={storyRef} className="relative wide:h-[720vh]">
        <div className="sticky top-0 hidden h-screen overflow-hidden wide:block">
          <div ref={canvasRef} className="relative h-full will-change-transform narrow:hidden" style={{ width: `${CANVAS_VW}vw` }}>
            <StringLine subscribe={subscribe} />
            <div className="absolute inset-0 z-10">
              {/* stars the whole length of the story; click one and it splits */}
              <Stars count={64} seed={3} width={CANVAS_VW} height={95} top={13} xUnit="vw" yUnit="vh" />
              <IntroScene contentRevealed={noteRevealed} noteRevealed={noteRevealed} />
              <TinkerScene />
              <HeartScene />
              <TimelineScene />
              <ApparentlyScene />
              <EnoughScene onWork={() => go("work")} />
            </div>
          </div>
        </div>
        <MobileStory ready={noteRevealed} onWork={() => go("work")} />
      </section>

      <Works filter={filter} setFilter={setFilter} />
      <Thoughts />
      <OhHi />
      <Ascent visible={scrollReady} />
      <CuriousCursor visible={scrollReady} />
      <PhoneComment />
    </main>
  );
}

// While scrolling, the string's tip is anchored to ~55% of the viewport width,
// so the freshly drawn thread always stays on screen instead of lagging behind.
const TIP_SCREEN_ANCHOR = 0.55;
// How quickly the story catches up with the scrollbar each frame (0–1).
const SCROLL_EASE = 0.085;
// Content sharpens in as it enters from the right edge: it's revealed once
// its x is this far (vw) inside the screen, so it's clear by the time you read it.
const REVEAL_INSET = 4;

type Subscribe = (listen: (progress: number) => void) => () => void;

function StringLine({ subscribe }: { subscribe: Subscribe }) {
  const pathRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    const tip = tipRef.current;
    if (!path || !tip) return;
    const { xs, ys, lengths, total } = getThreadSamples();
    const count = xs.length - 1;

    const draw = (progress: number) => {
    // Where the tip should sit: viewport's left edge (in viewBox units) plus
    // 55% of the visible width (1000 units).
    // Over the last stretch the tip runs ahead of its anchor, so the thread
    // reaches the button at the very end instead of stopping mid-screen.
    const catchUp = Math.max(0, (progress - 0.9) / 0.1) * 150;
    const targetX = progress * CANVAS_TRAVEL_VW * 10 + TIP_SCREEN_ANCHOR * 1000 + catchUp;
    let i = 0;
    while (i < count && (xs[i] ?? 0) < targetX) i += 1;
    const length = lengths[i] ?? total;

    path.style.strokeDashoffset = `${1 - length / total}`;
    tip.setAttribute("cx", `${xs[i]}`);
    tip.setAttribute("cy", `${ys[i]}`);
    tip.style.opacity = length <= 0 || length >= total * 0.999 ? "0" : "1";
    };
    draw(0);
    return subscribe(draw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${CANVAS_VW * 10} 1000`} preserveAspectRatio="none">
      <path ref={pathRef} pathLength="1" style={{ strokeDashoffset: 1 }} d={THREAD} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1" />
      <path className="animate-draw-string" style={{ animationDuration: "2.6s" }} pathLength="1" strokeDasharray="1" d={TANGLE} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle ref={tipRef} r="9" cx="569" cy="199" style={{ opacity: 0 }} className="fill-foreground" />
    </svg>
  );
}

function IntroScene({ contentRevealed, noteRevealed }: { contentRevealed: boolean; noteRevealed: boolean }) {
  return (
    <div className="pointer-events-none absolute left-0 top-0 h-full w-screen">
      <div className={cn("absolute bottom-14 left-8 transition-all duration-700", contentRevealed ? "opacity-100" : "animate-reveal [animation-delay:2.2s]")}>
        <p className="text-4xl font-semibold leading-[0.95] sm:text-5xl">the<br />anatomy of a<br /><span className="font-serif italic">curious mechie.</span></p>
      </div>
      <div className={cn("absolute left-[62%] top-28 flex max-w-56 origin-bottom-left items-start gap-2 text-sm text-muted-foreground transition-all duration-500", noteRevealed ? "opacity-100" : "animate-reveal [animation-delay:2.2s]")}>
        <svg aria-hidden="true" viewBox="0 0 40 30" className="mt-1 h-6 w-8 shrink-0"><path d="M38 4 C24 6 12 14 4 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M4 24 L13 22 M4 24 L7 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        <span>free-body diagram of my brain. forces not to scale.</span>
      </div>
      <div className={cn("pointer-events-auto absolute bottom-14 right-20 hidden text-right transition-all delay-150 duration-700 sm:block", contentRevealed ? "opacity-100" : "animate-reveal [animation-delay:2.35s]")}>
        <p className="mb-4 text-sm">in plain english: hi, this is my portfolio :)</p>
        <Button asChild variant="paper" className="mr-2"><a href="#work">view work</a></Button>
        <Button asChild variant="ink"><a href="#hi" data-cursor="the hand at the end waves back.">let's talk</a></Button>
      </div>
    </div>
  );
}

// A piece of text pinned to the canvas.
// `at` is the canvas x (in vw) the thread must reach before a `.reveal` note shows.
function Note({ x, y, className, at: revealAt, children }: { x: number; y: number; className?: string; at?: number; children: ReactNode }) {
  return <div className={cn("absolute", className)} style={at(x, y)} data-at={revealAt}>{children}</div>;
}

// What I'm breaking into, one sketch each: a name tag you can always read, and
// a confession on hover. Shared by both layouts.
const tinker = {
  hpc: { src: hpcStory, alt: "two sketches: a girl panicking as her laptop catches fire, then the same girl calmly holding a cup beside an HPC cluster", tag: "HPC", label: "no macbook here. my jobs queue on a supercomputer." },
  mechatronics: { src: mechatronics, alt: "a girl with a screwdriver at a workbench: a controller board drives a motor, the motor turns a pair of gears, and a sensor watching the gears reports back to the board", tag: "mechatronics", sub: "code tells the motor. the sensor tells the code.", label: "no print statements here. when my code is wrong, a motor tells me." },
  physicalAi: { src: physicalAi, alt: "a camera spots a block on a table, a neural network decides, and a robot arm reaches for it while a girl watches with a cup in her hand", tag: "physical AI", sub: "it sees, it decides, it moves", label: "no chatbot here. my models have to pick things up." },
  product: { src: launch, alt: "a rocket on a launch pad: five lights on the tower turn on one by one, then it lifts off", tag: "product development", sub: "idea → design → build → test → launch", label: "it isn't rocket science. the launch sequence is the same, though." },
  cad: { src: cad, alt: "a drawing sheet with a single-cylinder engine in section, its piston and crank running, with the stroke and bore dimensioned", tag: "CAD", sub: "AutoCAD · Fusion 360", label: "no “roughly” here. if i can imagine it, i can dimension it." },
};
const crawlerBot = { src: crawler, alt: "a small robot hanging from the thread by a pulley", label: "thread inspector. takes the job very seriously." };

// i refuse to stay in one lane: a quiet line in the middle, the objects
// scattered around it, and the thread looping between them.
function TinkerScene() {
  return (
    <div>
      <span hidden data-mode="thread" data-at={112} data-say="careful. moving parts ahead." />
      <Note x={116} y={42} className="reveal w-[38vw] text-center" at={122}>
        <p className="text-lg text-muted-foreground">i refuse to stay in one lane.</p>
        <h2 className="whitespace-nowrap font-serif text-6xl leading-tight">a jack of all trades</h2>
        <p className="mx-auto mt-2 max-w-[21rem] text-lg leading-snug text-muted-foreground">breaking into mechatronics, physical AI & product development.</p>
      </Note>
      <Object {...tinker.hpc} style={at(114, 12)} size="wide" delay="0s" />
      <Object {...tinker.mechatronics} style={at(100.5, 67)} size="mid" delay=".6s" />
      <Object {...tinker.physicalAi} style={at(121, 69)} size="mid" delay="1.2s" />
      <Object {...tinker.product} style={at(139.5, 12)} size="sm" delay=".3s" />
      <Object {...tinker.cad} style={at(147.5, 66)} size="sm" delay="1.5s" />
      <Climber />
    </div>
  );
}

// The stretch of thread the crawler can travel along, in vw.
const CLIMB_FROM = 157;
// Down the slope past the heading, all the way to the camera.
const CLIMB_TO = 197;
// How close (vh) the pointer must be to the thread for it to follow.
const CLIMB_REACH = 14;
const CLIMB_START = 174.5;
// Where its pulley sits inside the drawing, as a fraction of its box.
const GRIP_X = 0.5;
const GRIP_Y = 0.143;
const CLIMBER_W = 9;
const CLIMBER_H = 18;

// Points on the thread between two x positions, as (x, y) pairs in vw/vh.
function sampleThread(from: number, to: number) {
  const { xs: allX, ys: allY } = getThreadSamples();
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < allX.length; i += 1) {
    const x = allX[i]! / 10;
    if (x >= from - 1 && x <= to + 1) {
      xs.push(x);
      ys.push(allY[i]! / 10);
    }
  }
  return { xs, ys };
}

// The crawler hangs from the thread itself and swings gently from its pulley.
// Move the pointer along the thread and it rolls after it, tilting with the
// slope, as far as the camera. It listens to the whole window rather than a
// hit box, so it never blocks the heading or the camera.
function Climber() {
  const originRef = useRef<HTMLDivElement>(null);
  const samples = useRef<{ xs: number[]; ys: number[] } | null>(null);
  const target = useRef(CLIMB_START);
  const current = useRef(CLIMB_START);
  const frame = useRef(0);
  const [pose, setPose] = useState({ x: CLIMB_START, y: 35.6, angle: 0, reach: 0 });

  const yAt = (x: number) => {
    const s = samples.current;
    if (!s || s.xs.length === 0) return 35.6;
    let i = 0;
    while (i < s.xs.length - 1 && (s.xs[i + 1] ?? 0) < x) i += 1;
    return s.ys[i] ?? 35.6;
  };

  const place = (x: number, reach: number) => {
    const y = yAt(x);
    // Slope in screen pixels, so the tilt matches what you see.
    const dy = (yAt(x + 0.5) - yAt(x - 0.5)) * window.innerHeight;
    const dx = window.innerWidth;
    // Follow the slope, but not so far it's lying flat on the steep drop.
    const angle = Math.max(-28, Math.min(28, ((Math.atan2(dy, dx) * 180) / Math.PI) * 0.6));
    setPose({ x, y, angle, reach });
  };

  useEffect(() => {
    samples.current = sampleThread(CLIMB_FROM, CLIMB_TO);
    place(CLIMB_START, 0);
    // The origin div sits at CLIMB_FROM on the canvas, so its left edge maps
    // the pointer into canvas vw; the canvas is viewport-tall, so y is just vh.
    const follow = (event: PointerEvent) => {
      const origin = originRef.current;
      if (!origin) return;
      const x = CLIMB_FROM + ((event.clientX - origin.getBoundingClientRect().left) / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      if (x < CLIMB_FROM - 2 || x > CLIMB_TO + 2 || Math.abs(y - yAt(Math.min(CLIMB_TO, Math.max(CLIMB_FROM, x)))) > CLIMB_REACH) return;
      target.current = Math.min(CLIMB_TO, Math.max(CLIMB_FROM, x));
      if (!frame.current) frame.current = requestAnimationFrame(climb);
    };
    window.addEventListener("pointermove", follow, { passive: true });
    return () => {
      window.removeEventListener("pointermove", follow);
      cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move a little each frame, like pulling along the thread, not teleporting.
  const climb = () => {
    const gap = target.current - current.current;
    if (Math.abs(gap) < 0.05) {
      place(current.current, 0);
      frame.current = 0;
      return;
    }
    current.current += Math.sign(gap) * Math.min(Math.abs(gap), 0.12);
    place(current.current, Math.sin(current.current * 3));
    frame.current = requestAnimationFrame(climb);
  };

  return (
    <div ref={originRef} className="pointer-events-none absolute" style={at(CLIMB_FROM, 22)}>
      <div
        className="pointer-events-auto absolute"
        style={{
          left: `${pose.x - CLIMB_FROM - GRIP_X * CLIMBER_W}vw`,
          top: `${pose.y - 22 - GRIP_Y * CLIMBER_H}vh`,
          width: `${CLIMBER_W}vw`,
          height: `${CLIMBER_H}vh`,
          transformOrigin: `${GRIP_X * 100}% ${GRIP_Y * 100}%`,
          // While rolling it rocks side to side, like a cable car on the move.
          transform: `rotate(${pose.angle + pose.reach * 7}deg) translateY(${Math.abs(pose.reach) * -0.6}vh)`,
        }}
      >
        <div className={cn("h-full w-full", pose.reach === 0 && "animate-hang")}>
          <Figure {...crawlerBot} size="fill" still labelStyle={{ rotate: `${-(pose.angle + pose.reach * 7)}deg` }} />
        </div>
      </div>
    </div>
  );
}

// Sense, think and act are one pipeline here: the same pose passes through all
// three drawings, each a beat behind the last (see pipeline-art.tsx).
function BusyHand() {
  return <TendonHand pose={useHandRoutine(460, 1500)} className="h-full w-full" />;
}

const heart: { art: ReactNode; alt: string; x: number; y: number; title: string; body: string; label: string }[] = [
  { art: <SenseArt />, alt: "a webcam looking at a hand, which it sees as 21 dots", x: 200, y: 56, title: "sense.", body: "one webcam, 21 hand landmarks. the world, turned into numbers.", label: "this is all the camera sees of your hand." },
  { art: <ThinkArt lag={230} />, alt: "a small neural network turning those dots into five bars, one per finger", x: 224, y: 22, title: "think.", body: "models that look, reason, and decide what each finger should do next.", label: "five numbers out. one per finger." },
  { art: <BusyHand />, alt: "a robot hand copying the pose", x: 260, y: 54, title: "and act.", body: "tendons pull, fingers curl. my favourite part.", label: "10 degrees of freedom. zero chill." },
];

// obsessed with intelligent machines that can sense, think and act: each verb
// a drawing with a big line and a quiet one beside it, and the thread running
// calmly between them.
function HeartScene() {
  return (
    <div>
      <span hidden data-mode="thread" data-at={184} data-say="okay. the part i'm obsessed with." />
      <Note x={181} y={18} className="reveal" at={182}><h2 className="whitespace-nowrap font-serif text-5xl leading-none">obsessed with<br />intelligent machines<br />that can…</h2></Note>
      {heart.map((h, index) => (
        <Note key={h.title} x={h.x} y={h.y} className="reveal flex items-center gap-5" at={h.x + 2}>
          <Figure art={h.art} alt={h.alt} label={h.label} delay={`${index * 0.5}s`} />
          <div className="w-64">
            <p className="font-serif text-4xl leading-tight">{h.title}</p>
            <p className="mt-2 text-muted-foreground">{h.body}</p>
          </div>
        </Note>
      ))}
    </div>
  );
}

// Only the moments that changed the plot (the builds have their own section).
// Each one has a keepsake pegged to the thread beneath it, like prints on a line.
type Keepsake = "rank" | "gate" | "now";
const timeline: { year: string; title: string; line: string; keepsake: Keepsake }[] = [
  { year: "june 2025", title: "cracked JEE Advanced.", line: "survival of the smartest, apparently.", keepsake: "rank" },
  { year: "july 2025", title: "walked into IIT Madras.", line: "mechanical engineering. officially a mechie.", keepsake: "gate" },
  { year: "now", title: "breaking into mechatronics, physical AI & product development.", line: "one build at a time.", keepsake: "now" },
];

// What the cursor says about each keepsake, and how wide it hangs on laptops
// and on phones.
const keepsakes: Record<Keepsake, { note: string; laptop: string; phone: string }> = {
  rank: { note: "two years of late nights. six hours of exam.", laptop: "26vh", phone: "w-48" },
  gate: { note: "the gates i dreamt of for two years.", laptop: "23vh", phone: "w-44" },
  now: { note: "T-minus a few semesters.", laptop: "38vh", phone: "w-[17.5rem]" },
};

// Photo: "Facade of IIT Madras (cropped)" by Raydann, CC BY-SA 4.0, Wikimedia Commons.
const GATE_PHOTO = "https://commons.wikimedia.org/wiki/File:Facade_of_IIT_Madras_(cropped).jpg";

// A keepsake on its peg: a white card, slightly askew, that straightens up
// when you look at it.
function Pinned({ kind, small = false, className, style }: { kind: Keepsake; small?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <figure className={cn("border border-border/70 bg-white text-center shadow-[0_12px_26px_rgb(0_0_0/0.16)] transition-transform duration-500 hover:z-10 hover:scale-110 hover:rotate-0", small ? "p-2" : "p-[1vh]", className)} style={style} data-cursor={keepsakes[kind].note}>
      <span aria-hidden="true" className={cn("absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-cursor", small ? "h-4 w-3" : "h-[2.2vh] w-[1.6vh]")} />
      {kind === "rank" && (
        <div className={small ? "px-2 py-3" : "px-[1vh] py-[1.6vh]"}>
          <p className={cn("font-medium uppercase tracking-[0.18em] text-muted-foreground", small ? "text-[0.6rem]" : "text-[1.25vh]")}>JEE Advanced 2025</p>
          <p className={cn("whitespace-nowrap font-serif italic leading-none", small ? "mt-2 text-4xl" : "mt-[1vh] text-[5.4vh]")}>cracked.</p>
          <p className={cn("inline-block -rotate-3 whitespace-nowrap rounded-[4px] border-2 border-cursor-border font-hand tracking-[0.08em] text-cursor-border", small ? "mt-3 px-2 text-sm" : "mt-[1.4vh] px-[1vh] text-[2vh]")}>6 hours. survived ✓</p>
        </div>
      )}
      {kind === "gate" && (
        <>
          <img src={iitmGate} alt="the entrance sign of IIT Madras in daylight, the institute's name and emblem in gold above a bed of flowers" decoding="async" draggable={false} className="aspect-[4/3] w-full object-cover" />
          <figcaption>
            <span className={cn("block font-hand tracking-[0.06em] text-foreground/85", small ? "pt-2 text-base" : "pt-[1vh] text-[2.1vh]")}>IIT Madras · july 2025</span>
            <a href={GATE_PHOTO} target="_blank" rel="noreferrer license" className={cn("block text-muted-foreground/80 hover:underline", small ? "text-[0.6rem]" : "text-[1.1vh]")}>photo: Raydann · CC BY-SA 4.0</a>
          </figcaption>
        </>
      )}
      {kind === "now" && (
        <div className={small ? "px-1 py-2" : "px-[0.6vh] py-[1vh]"}>
          <div className="flex items-center justify-between">
            <img src={mechatronics} alt="" draggable={false} className={small ? "h-12 w-24" : "h-[6.6vh] w-[13.2vh]"} />
            <img src={physicalAi} alt="" draggable={false} className={small ? "h-12 w-24" : "h-[6.6vh] w-[13.2vh]"} />
            <img src={launch} alt="" draggable={false} className={small ? "h-12 w-12" : "h-[6.6vh] w-[6.6vh]"} />
          </div>
          <div className={cn("overflow-hidden rounded-full border border-foreground/50", small ? "mt-2 h-2" : "mt-[1.2vh] h-[1vh]")}><div className="h-full w-1/3 animate-pulse bg-cursor" /></div>
          <p className={cn("font-hand tracking-[0.06em] text-foreground/85", small ? "pt-1.5 text-base" : "pt-[0.8vh] text-[2.1vh]")}>in progress…</p>
        </div>
      )}
    </figure>
  );
}

const TIMELINE_FROM = 304;
const TIMELINE_STEP = 36;
const STEM = 11;

// The thread curves gently through the moments. Each one sits above it on a
// thin stem, with its keepsake hanging below, and only appears once the thread
// arrives. Underneath, what all of it keeps adding up to.
function TimelineScene() {
  const [ys, setYs] = useState<number[] | null>(null);

  // Hang each stem from exactly where the thread passes.
  useEffect(() => {
    const { xs, ys: samples } = sampleThread(TIMELINE_FROM - 2, TIMELINE_FROM + TIMELINE_STEP * timeline.length);
    setYs(timeline.map((_, index) => {
      const x = TIMELINE_FROM + index * TIMELINE_STEP;
      let k = 0;
      while (k < xs.length - 1 && (xs[k + 1] ?? 0) < x) k += 1;
      return samples[k] ?? 50;
    }));
  }, []);

  return (
    <div>
      <span hidden data-mode="thread" data-at={306} data-say="the short version. i'm only a second-year." />
      {ys && timeline.map((stop, index) => {
        const x = TIMELINE_FROM + index * TIMELINE_STEP;
        const y = ys[index] ?? 50;
        return (
          <div key={stop.title} className="reveal" data-at={x}>
            <span className="absolute w-px bg-muted-foreground/60" style={{ left: `${x}vw`, top: `${y - STEM}vh`, height: `${STEM}vh` }} />
            <span className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground" style={{ left: `calc(${x}vw + 0.5px)`, top: `${y - STEM}vh` }} />
            <Note x={x} y={y - STEM - 2} className="w-72 -translate-x-1/2 -translate-y-full text-center leading-snug">
              <p className="text-lg">{stop.title}</p>
              <p className="text-muted-foreground">{stop.line}</p>
              <p className="mt-1 text-sm text-muted-foreground/80">{stop.year}</p>
            </Note>
            <span className="absolute w-px bg-foreground" style={{ left: `${x}vw`, top: `${y}vh`, height: "5vh" }} />
            <Pinned kind={stop.keepsake} className={cn("absolute -translate-x-1/2", index % 2 ? "rotate-2" : "-rotate-2")} style={{ left: `${x}vw`, top: `${y + 5}vh`, width: keepsakes[stop.keepsake].laptop }} />
          </div>
        );
      })}
      {/* Each phrase fades in as the thread passes over it, like the years. */}
      <Note x={302} y={86} className="reveal" at={302}><p className="whitespace-nowrap font-serif text-5xl">every time, <span className="text-muted-foreground">it came down to...</span></p></Note>
      <Note x={346} y={86} className="reveal" at={346}><p className="whitespace-nowrap font-serif text-5xl"><span className="text-muted-foreground">the</span> constraints.</p></Note>
      <Note x={380} y={83.5} className="reveal w-[25rem] text-lg leading-snug" at={380}>
        <p>engineering is all about learning from them.</p>
        <p className="text-muted-foreground">the trick is knowing which ones you don't get to negotiate with.</p>
      </Note>
    </div>
  );
}

// The habit that keeps repeating, told as a cycle: the thread ties one big
// loop beside the line, and the four steps sit around it in the order the
// thread draws them (bottom, right, top, left) with "repeat." in the middle.
const LOOP_RX = LOOP_R / LOOP_ASPECT;
const habit = [
  { step: "scope it.", x: LOOP_X, y: LOOP_Y, place: "below" },
  { step: "build it.", x: LOOP_X + LOOP_RX, y: LOOP_Y - LOOP_R, place: "right" },
  { step: "break it.", x: LOOP_X, y: LOOP_Y - 2 * LOOP_R, place: "above" },
  { step: "learn the constraint.", x: LOOP_X - LOOP_RX, y: LOOP_Y - LOOP_R, place: "left" },
] as const;

const habitLabel = {
  below: "-translate-x-1/2 translate-y-4",
  right: "translate-x-5 -translate-y-1/2",
  above: "-translate-x-1/2 -translate-y-[calc(100%+1rem)]",
  left: "-translate-x-[calc(100%+1.25rem)] -translate-y-1/2",
};

function ApparentlyScene() {
  // The loop is drawn in one go once the thread reaches it, so its steps
  // arrive one after another, in drawing order.
  const looped = LOOP_X + LOOP_RX + 1;
  return (
    <div>
      <span hidden data-mode="thread" data-at={looped} data-say="closed loop. with feedback, obviously." />
      <Note x={428} y={16} className="reveal w-[32rem]" at={428}>
        <p className="font-serif text-6xl leading-[1.05]">turns out, <span className="text-muted-foreground">solving the problem was never the hard part.</span></p>
      </Note>
      {habit.map(({ step, x, y, place }, index) => (
        <div key={step} className="reveal" data-mode="thread" data-at={looped} style={{ "--reveal-delay": `${index * 0.25}s` } as CSSProperties}>
          <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" style={at(x, y)} />
          <p className={cn("absolute whitespace-nowrap text-lg", habitLabel[place])} style={at(x, y)}>{step}</p>
        </div>
      ))}
      <p className="reveal absolute -translate-x-1/2 -translate-y-1/2 font-serif text-4xl italic" data-mode="thread" data-at={looped} style={{ ...at(LOOP_X, LOOP_Y - LOOP_R), "--reveal-delay": "1s" } as CSSProperties}>repeat.</p>
    </div>
  );
}

// The thread stops. Whitespace. Then the turn into the work.
function EnoughScene({ onWork }: { onWork: () => void }) {
  // The button is pinned to the thread's end point (its left edge, halfway
  // down), so the thread meets it on every screen size; the words sit above.
  return (
    <>
      <span hidden data-mode="thread" data-at={BUTTON_X - 8} data-say="go on. the lab is this way." />
      <Note x={BUTTON_X + 4.6} y={BUTTON_Y - 6} className="reveal w-[46vw] -translate-x-1/2 -translate-y-full text-center" at={BUTTON_X - 14}>
        <p className="text-lg text-muted-foreground">that's the theory.</p>
        <h2 className="mt-3 font-serif text-6xl">now for what actually got built.</h2>
      </Note>
      <div className="absolute -translate-y-1/2" style={at(BUTTON_X, BUTTON_Y)}>
        <Button variant="ink" onClick={onWork} data-cursor="to the lab ↓">see the work <ArrowDown className="ml-2 h-4 w-4" /></Button>
      </div>
    </>
  );
}

const figureSizes = { fill: "h-full w-full", wide: "h-36 w-72 wide:h-[min(12vw,21vh)] wide:w-[min(24vw,42vh)]", mid: "h-36 w-72 wide:h-[min(9.75vw,18vh)] wide:w-[min(19.5vw,36vh)]", sm: "h-36 w-36 lg:h-44 lg:w-44", md: "h-44 w-44 lg:h-56 lg:w-56", lg: "h-52 w-52 lg:h-64 lg:w-64" };

// Each object keeps its own little confession. It types itself out on hover and
// springs back into hiding the moment the cursor leaves. The object tilts toward
// the pointer and floats above a soft ground shadow so it reads as 3D.
// An object is usually a picture (`src`); `art` puts a live drawing there instead.
function Figure({ src, art, alt, label, className, delay, size = "md", still = false, hang = false, labelBelow = false, labelStyle }: { src?: string | undefined; art?: ReactNode; alt: string; label?: string | undefined; className?: string; delay?: string; size?: keyof typeof figureSizes | undefined; still?: boolean; hang?: boolean; labelBelow?: boolean | undefined; labelStyle?: CSSProperties }) {
  const [hovered, setHovered] = useState(false);
  const [typed, setTyped] = useState("");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  // On phones, objects near an edge open their bubble toward the middle of
  // the screen instead of centred, so the words never run off-screen.
  const [align, setAlign] = useState<"center" | "left" | "right">("center");
  const hideTimer = useRef(0);

  const open = (el: HTMLElement) => {
    quietOthers(id.current);
    setHovered(true);
    if (isWide()) return;
    const r = el.getBoundingClientRect();
    const middle = r.left + r.width / 2;
    setAlign(middle < 140 ? "left" : middle > window.innerWidth - 140 ? "right" : "center");
  };

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  // Only one confession at a time: opening this one closes any other.
  const id = useRef(Math.random());
  useEffect(() => {
    const close = (e: Event) => {
      if ((e as CustomEvent<number>).detail !== id.current) setHovered(false);
    };
    window.addEventListener("figure-open", close);
    return () => window.removeEventListener("figure-open", close);
  }, []);

  // A tap anywhere else closes the confession.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hovered) return;
    const away = (e: PointerEvent) => {
      if (e.pointerType === "touch" && !rootRef.current?.contains(e.target as Node)) setHovered(false);
    };
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [hovered]);

  useEffect(() => {
    if (!hovered || !label) {
      setTyped("");
      return;
    }
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(label.slice(0, index));
      if (index >= label.length) window.clearInterval(timer);
    }, 26);
    return () => window.clearInterval(timer);
  }, [hovered, label]);

  return (
    <div
      ref={rootRef}
      className={cn("relative shrink-0 [perspective:900px]", figureSizes[size], className)}
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") open(e.currentTarget);
      }}
      // A tap opens the confession and keeps it up for a moment; a touch
      // "leaves" as soon as the finger lifts, so it can't rely on hover.
      onPointerDown={(e) => {
        if (e.pointerType !== "touch") return;
        open(e.currentTarget);
        window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => setHovered(false), 2500);
      }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 });
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "touch") return;
        setHovered(false);
        setTilt({ x: 0, y: 0 });
      }}
    >
      <div aria-hidden="true" className="absolute bottom-[6%] left-1/2 h-4 w-1/2 rounded-[50%] bg-foreground/20 blur-md transition-all duration-500" style={{ transform: `translateX(-50%) scale(${hovered ? 0.8 : 1})`, opacity: hovered ? 0.6 : 1 }} />
      <div className={cn("h-full w-full", hang ? "animate-hang" : !still && "animate-float-object")} style={{ animationDelay: delay }}>
        {art ? (
          <div role="img" aria-label={alt} style={{ transform: `rotateY(${tilt.x * 16}deg) rotateX(${-tilt.y * 14}deg) scale(${hovered ? 1.08 : 1}) translateZ(0)`, transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }} className="h-full w-full select-none transition-transform duration-500">
            {art}
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            decoding="async"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            style={{ transform: `rotateY(${tilt.x * 16}deg) rotateX(${-tilt.y * 14}deg) scale(${hovered ? 1.08 : 1}) translateZ(0)`, transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }}
            className="h-full w-full select-none object-contain transition-transform duration-500"
          />
        )}
      </div>
      {label && (
        <div
          aria-hidden="true"
          style={{ transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)", ...labelStyle }}
          className={cn(
            "pointer-events-none absolute z-40 w-max max-w-[min(16rem,calc(100vw-2rem))] whitespace-pre-line",
            align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2",
            labelBelow ? "top-[calc(100%+4px)] rounded-[5px_18px_18px_18px]" : align === "right" ? "bottom-[calc(100%+4px)] rounded-[18px_18px_5px_18px]" : "bottom-[calc(100%+4px)] rounded-[18px_18px_18px_5px]",
            " border border-cursor-border bg-cursor px-4 py-2 text-sm text-cursor-foreground shadow-lg transition-all duration-300",
            hovered ? "translate-y-0 scale-100 opacity-100" : cn(labelBelow ? "-translate-y-3" : "translate-y-3", "scale-90 opacity-0"),
          )}
        >
          {typed}
          <span className="animate-pulse">|</span>
        </div>
      )}
    </div>
  );
}

// The name written under a sketch, so it reads without hovering, with an
// optional smaller line spelling out what's in the drawing.
function Tag({ sub, children }: { sub?: string | undefined; children: ReactNode }) {
  return (
    <div className="text-center font-hand tracking-[0.08em] text-foreground/75">
      {/* the thread runs behind these, so the words get a paper backing */}
      <p className="text-[1.05rem]"><span className="rounded bg-background/90 px-1.5">{children}</span></p>
      {sub && <p className="w-0 min-w-full text-[0.85rem] leading-tight text-foreground/55 wide:-mx-24 wide:w-auto wide:min-w-0 wide:whitespace-nowrap"><span className="rounded bg-background/90 box-decoration-clone px-1.5">{sub}</span></p>}
    </div>
  );
}

function Object({ src, alt, label, tag, sub, style, delay, size, labelBelow }: { src: string; alt: string; label?: string | undefined; tag?: string; sub?: string; style: CSSProperties; delay: string; size?: keyof typeof figureSizes; labelBelow?: boolean }) {
  return (
    <div className="absolute" style={style}>
      <Figure src={src} alt={alt} label={label} delay={delay} size={size} labelBelow={labelBelow} />
      {tag && <Tag sub={sub}>{tag}</Tag>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile: the same story told vertically. The thread falls from the tangle and
// weaves down the page between the objects, the years hang off it on little
// stems, and it ties the habit loop before ending at the work button. Anchor
// points are read from the laid-out page, so the thread fits any phone.

// Radius (px) of the habit loop on mobile.
const MOBILE_LOOP = 70;

// An object pinned in a mobile block, with the thread passing through its middle.
function MobileObject({ src, alt, label, tag, sub, style, delay, size = "sm" }: { src: string; alt: string; label: string; tag?: string; sub?: string; style: CSSProperties; delay: string; size?: keyof typeof figureSizes }) {
  return (
    <div className="absolute" style={style}>
      <Figure src={src} alt={alt} label={label} size={size} delay={delay} />
      {tag && <Tag sub={sub}>{tag}</Tag>}
      <span data-anchor className="absolute left-1/2 top-[72px]" />
    </div>
  );
}

// An invisible point the thread must pass through, placed within its block.
function Anchor({ x, y, loop }: { x: string; y: number | string; loop?: number }) {
  return <span data-anchor={loop ?? ""} className="absolute" style={{ left: x, top: y }} />;
}

// The crawler's stretch of thread on mobile: it runs from left to right
// between these heights (px within the tinker block).
const CLIMB_Y0 = 1260;
const CLIMB_Y1 = 1300;
// The mobile thread's points (in story coordinates), shared with the crawler.
let mobileThread: ThreadSamples | null = null;

// On phones, hold the crawler and drag it along its stretch of thread.
// Only it captures the finger, so the rest of the page still scrolls.
function MobileClimber() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0.55);
  const [grip, setGrip] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  // Put its pulley on the drawn thread, at the point nearest the finger
  // along its stretch.
  const move = (clientX: number) => {
    const block = ref.current?.parentElement;
    const root = block?.parentElement;
    if (!block || !root || !mobileThread) return;
    const r = block.getBoundingClientRect();
    const x = Math.min(r.width * 0.84, Math.max(r.width * 0.2, clientX - r.left));
    const { xs, ys } = mobileThread;
    const top = block.offsetTop;
    let best = -1;
    for (let i = 0; i < xs.length; i += 1) {
      const y = (ys[i] ?? 0) - top;
      const px = xs[i] ?? 0;
      if (y < CLIMB_Y0 - 90 || y > CLIMB_Y1 + 90 || px < r.width * 0.2 || px > r.width * 0.84) continue;
      if (best < 0 || Math.abs((xs[i] ?? 0) - x) < Math.abs((xs[best] ?? 0) - x)) best = i;
    }
    if (best < 0) return;
    setPos((xs[best] ?? 0) / r.width);
    setGrip({ x: xs[best] ?? 0, y: (ys[best] ?? 0) - top });
  };
  const y = grip ? grip.y : CLIMB_Y0 + (CLIMB_Y1 - CLIMB_Y0) * pos + Math.sin(pos * Math.PI) * 14;
  return (
    <div
      ref={ref}
      className="absolute h-[156px] w-24 touch-none"
      style={{ left: grip ? grip.x : `${pos * 100}%`, top: y, translate: `-${GRIP_X * 100}% -${GRIP_Y * 100}%`, transition: dragging ? "none" : "left .4s, top .4s" }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }}
      onPointerMove={(e) => dragging && move(e.clientX)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      <Figure
        {...crawlerBot}
        size="fill"
        hang={!dragging}
        still={dragging}
        // wherever it has rolled to, keep its bubble on screen
        labelStyle={pos < 0.35 ? { left: 0, translate: "none" } : pos > 0.65 ? { left: "auto", right: 0, translate: "none" } : {}}
      />
    </div>
  );
}

function MobileStory({ ready, onWork }: { ready: boolean; onWork: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tangleRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGCircleElement>(null);
  const samplesRef = useRef<ThreadSamples | null>(null);
  const [geo, setGeo] = useState<{ d: string; w: number; h: number } | null>(null);

  // Trace the thread through every anchor, starting at the tangle's loose end.
  useEffect(() => {
    const measure = () => {
      const root = rootRef.current;
      const svg = tangleRef.current;
      if (!root || !svg || root.offsetParent === null) return;
      const r = root.getBoundingClientRect();
      const t = svg.getBoundingClientRect();
      // The tangle's viewBox is 550×600 from (250,100), scaled to fit and
      // centred; its loose end is at (569,199).
      const k = Math.min(t.width / 550, t.height / 600);
      const points: Waypoint[] = [[t.left - r.left + (t.width - 550 * k) / 2 + 319 * k, t.top - r.top + (t.height - 600 * k) / 2 + 99 * k]];
      root.querySelectorAll<HTMLElement>("[data-anchor]").forEach((el) => {
        const a = el.getBoundingClientRect();
        const loop = Number(el.dataset["anchor"]);
        points.push(loop ? [a.left - r.left, a.top - r.top, loop] : [a.left - r.left, a.top - r.top]);
      });
      const segments = threadSegments(points, 1, 1);
      samplesRef.current = sampleSegments(segments, 24);
      mobileThread = samplesRef.current;
      setGeo({ d: segmentsPath(segments), w: r.width, h: r.height });
    };
    measure();
    void document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Draw the thread down to ~70% of the screen as you scroll, like a pen
  // following your thumb; scrolling back up rewinds it.
  useEffect(() => {
    if (!geo) return;
    let frame = 0;
    const draw = () => {
      frame = 0;
      const root = rootRef.current;
      const path = pathRef.current;
      const tip = tipRef.current;
      const samples = samplesRef.current;
      if (!root || !path || !tip || !samples) return;
      const { xs, ys, lengths, total } = samples;
      // Nothing leaves the tangle until you scroll; then the thread grows with
      // the scroll until it catches up with ~70% down the screen.
      const top = root.getBoundingClientRect().top;
      const reach = Math.min(window.innerHeight * 0.7 - top, (ys[0] ?? 0) + Math.max(0, -top) * 1.4);
      let i = 0;
      while (i < xs.length - 1 && (ys[i] ?? 0) < reach) i += 1;
      const length = lengths[i] ?? 0;
      path.style.strokeDashoffset = `${1 - length / total}`;
      tip.setAttribute("cx", `${xs[i]}`);
      tip.setAttribute("cy", `${ys[i]}`);
      tip.style.opacity = length > 0 && length < total * 0.999 ? "1" : "0";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [geo]);

  // Things sharpen in as they scroll into view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.setAttribute("data-shown", "");
        io.unobserve(e.target);
      }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.15 },
    );
    root.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    // Story comments, said once each as their moment scrolls up the screen.
    const talk = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        const line = (e.target as HTMLElement).dataset["say"];
        if (!e.isIntersecting || !line) return;
        say(`story:${line}`, line);
        talk.unobserve(e.target);
      }),
      { rootMargin: "0px 0px -40% 0px" },
    );
    root.querySelectorAll("[data-say]").forEach((el) => talk.observe(el));
    return () => {
      io.disconnect();
      talk.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className="relative mx-auto max-w-[34rem] overflow-hidden wide:hidden">
      <Stars count={38} seed={7} className="z-[5]" />
      {geo && (
        <svg aria-hidden="true" className={cn("pointer-events-none absolute left-0 top-0 transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")} width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`}>
          <path ref={pathRef} d={geo.d} pathLength="1" strokeDasharray="1" style={{ strokeDashoffset: 1 }} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle ref={tipRef} r="4.5" cx="0" cy="0" style={{ opacity: 0 }} className="fill-foreground" />
        </svg>
      )}

      {/* the anatomy of a curious mechie */}
      <div className="relative h-[132svh]">
        <svg ref={tangleRef} aria-hidden="true" viewBox="250 100 550 600" className="absolute inset-x-0 top-[27svh] h-[50svh] w-full overflow-visible">
          <path className="animate-draw-string" style={{ animationDuration: "2.6s" }} pathLength="1" strokeDasharray="1" d={TANGLE} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <div className={cn("absolute right-5 top-[17svh] flex w-44 items-start gap-1.5 text-[0.8rem] leading-snug text-muted-foreground", ready ? "opacity-100" : "animate-reveal [animation-delay:2.2s]")}>
          <svg aria-hidden="true" viewBox="0 0 40 30" className="mt-4 h-5 w-7 shrink-0"><path d="M38 4 C24 6 12 14 4 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M4 24 L13 22 M4 24 L7 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <span>free-body diagram of my brain. forces not to scale.</span>
        </div>
        <p className={cn("absolute left-5 top-[90svh] text-[2.6rem] font-semibold leading-[0.95]", ready ? "opacity-100" : "animate-reveal [animation-delay:2.2s]")}>the<br />anatomy of a<br /><span className="font-serif italic">curious mechie.</span></p>
        <Anchor x="86%" y="66svh" />
        <Anchor x="93%" y="122svh" />
      </div>

      {/* i refuse to stay in one lane: objects spread out on alternating sides */}
      <div className="relative h-[1500px]">
        <span data-say="careful. moving parts ahead." className="absolute left-0 top-0 h-px w-px" />
        <MobileObject {...tinker.hpc} style={{ left: "3%", top: 20 }} size="wide" delay="0s" />
        <MobileObject {...tinker.product} style={{ right: "5%", top: 180 }} delay=".4s" />
        <Anchor x="95%" y={400} />
        <div className="reveal absolute inset-x-0 top-[420px] mx-auto max-w-[17rem] text-center">
          <p className="text-muted-foreground">i refuse to stay in one lane.</p>
          <h2 className="mt-1 whitespace-nowrap font-serif text-[2.1rem] leading-tight">a jack of all trades</h2>
          <p className="mt-1 text-sm text-muted-foreground">breaking into mechatronics, physical AI & product development.</p>
        </div>
        <Anchor x="95%" y={590} />
        <MobileObject {...tinker.mechatronics} style={{ left: "3%", top: 630 }} size="wide" delay=".8s" />
        <MobileObject {...tinker.physicalAi} style={{ right: "3%", top: 850 }} size="wide" delay="1.2s" />
        <MobileObject {...tinker.cad} style={{ left: "6%", top: 1050 }} delay="1.6s" />
        {/* the crawler gets its own stretch of thread to be dragged along */}
        <Anchor x="4%" y={CLIMB_Y0} />
        <MobileClimber />
        <Anchor x="96%" y={CLIMB_Y1} />
      </div>

      {/* obsessed with intelligent machines that can…: object above its words, alternating sides */}
      <div className="relative px-5 pt-6">
        <span data-say="okay. the part i'm obsessed with." className="absolute left-0 top-0 h-px w-px" />
        <Anchor x="5%" y={0} />
        <Anchor x="5%" y={110} />
        <h2 className="reveal text-center font-serif text-[2.2rem] leading-none">obsessed with<br />intelligent machines<br />that can…</h2>
        {heart.map((h, index) => {
          const right = index % 2 === 1;
          return (
            <div key={h.title} className={cn("reveal relative mt-10 w-[66%]", right && "ml-auto text-right")}>
              <div className={cn("relative w-fit", right && "ml-auto")}>
                <Figure art={h.art} alt={h.alt} label={h.label} size="sm" delay={`${index * 0.5}s`} />
                <span data-anchor className="absolute left-1/2 top-1/2" />
              </div>
              <p className="font-serif text-2xl leading-tight">{h.title}</p>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{h.body}</p>
              {/* leave along the outer edge, below the words */}
              <Anchor x={right ? "calc(100% + 0.25rem)" : "-0.25rem"} y="calc(100% + 0.75rem)" />
            </div>
          );
        })}
      </div>

      {/* every time, it came down to...: the years hang off the thread */}
      <div className="relative mt-20 px-5">
        <span data-say="the short version. i'm only a second-year." className="absolute left-0 top-20 h-px w-px" />
        <Anchor x="6%" y={-20} />
        <p className="reveal mx-auto max-w-[18rem] text-center font-serif text-[2rem] leading-tight">every time,<br /><span className="text-muted-foreground">it came down to...</span></p>
        <ol className="relative mt-10 pl-9">
          {timeline.map((stop) => (
            <li key={stop.title} className="reveal relative pb-9">
              <span data-anchor className="absolute -left-[1.1rem] top-[0.7rem]" />
              <span aria-hidden="true" className="absolute -left-[1.1rem] top-[0.7rem] h-px w-3 bg-muted-foreground/60" />
              <span aria-hidden="true" className="absolute left-[-0.4rem] top-[0.55rem] h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <p>{stop.title}</p>
              <p className="text-sm leading-snug text-muted-foreground">{stop.line}</p>
              <p className="mt-0.5 text-xs text-muted-foreground/80">{stop.year}</p>
              <Pinned kind={stop.keepsake} small className={cn("relative mt-5 -rotate-2", keepsakes[stop.keepsake].phone)} />
            </li>
          ))}
        </ol>
        <Anchor x="6%" y="100%" />
      </div>
      <div className="relative px-5 pt-4">
        <p className="reveal text-center font-serif text-[2rem]"><span className="text-muted-foreground">...the</span> constraints.</p>
        <div className="reveal mx-auto mt-3 max-w-[19rem] text-center text-sm leading-snug">
          <p>engineering is all about learning from them.</p>
          <p className="text-muted-foreground">the trick is knowing which ones you don't get to negotiate with.</p>
        </div>
        <Anchor x="5%" y="calc(100% + 1rem)" />
      </div>

      {/* turns out, solving the problem was never the hard part: tied in a loop */}
      <div className="relative mt-16 px-5">
        <Anchor x="89%" y={-24} />
        <Anchor x="90%" y={150} />
        <p className="reveal font-serif text-[2.3rem] leading-[1.05]">turns out, <span className="text-muted-foreground">solving the problem was never the hard part.</span></p>
        <div className="reveal relative mt-4 h-[270px]">
          <span data-say="closed loop. with feedback, obviously." className="absolute left-0 top-1/2 h-px w-px" />
          <Anchor x="86%" y={205} />
          <Anchor x="50%" y={230} loop={MOBILE_LOOP} />
          <span className="absolute -translate-x-1/2 translate-y-3 whitespace-nowrap text-sm" style={{ left: "50%", top: 230 }}>{habit[0].step}</span>
          <span className="absolute -translate-y-1/2 whitespace-nowrap text-sm" style={{ left: `calc(50% + ${MOBILE_LOOP + 10}px)`, top: 230 - MOBILE_LOOP }}>{habit[1].step}</span>
          <span className="absolute -translate-x-1/2 -translate-y-[calc(100%+0.6rem)] whitespace-nowrap text-sm" style={{ left: "50%", top: 230 - 2 * MOBILE_LOOP }}>{habit[2].step}</span>
          <span className="absolute w-20 -translate-x-[calc(100%+0.6rem)] -translate-y-1/2 text-right text-sm leading-tight" style={{ left: `calc(50% - ${MOBILE_LOOP}px)`, top: 230 - MOBILE_LOOP }}>{habit[3].step}</span>
          <span className="absolute -translate-x-1/2 -translate-y-1/2 font-serif text-2xl italic" style={{ left: "50%", top: 230 - MOBILE_LOOP }}>repeat.</span>
        </div>
      </div>

      {/* that's the theory: the thread ends at the button */}
      <div className="relative px-5 pb-24 pt-14 text-center">
        <span data-say="go on. the lab is this way." className="absolute left-0 top-10 h-px w-px" />
        <Anchor x="94%" y={40} />
        <p className="reveal text-sm text-muted-foreground">that's the theory.</p>
        <h2 className="reveal mt-2 font-serif text-[2.3rem] leading-tight">now for what<br />actually got built.</h2>
        <div className="relative mt-7 inline-block">
          <span data-anchor className="absolute left-[calc(100%+2.75rem)] top-[-0.25rem]" />
          <span data-anchor className="absolute left-full top-1/2" />
          <Button variant="ink" onClick={onWork}>see the work <ArrowDown className="ml-2 h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}

function Works({ filter, setFilter }: { filter: string; setFilter: (filter: string) => void }) {
  const filtered = filter === "All" ? builds : builds.filter((build) => build.tags.includes(filter));
  return (
    <section id="work" className="relative min-h-screen border-t border-foreground bg-background px-5 pb-24 pt-28 sm:px-8">
      <Stars count={16} seed={21} />
      <div className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden" aria-hidden="true"><p data-backdrop className="translate-y-[-38%] whitespace-nowrap text-[26vw] font-semibold leading-none text-muted">WORKS</p></div>
      <div className="relative mx-auto grid max-w-[1500px] gap-16 pt-[18vw] lg:grid-cols-[minmax(280px,0.65fr)_minmax(0,1.35fr)]">
        <aside className="h-fit lg:sticky lg:top-28">
          <p className="text-sm text-muted-foreground">selected work / 2025 to now</p>
          <h2 className="mt-4 max-w-md font-serif text-5xl leading-none sm:text-6xl">three builds,<br /><em>each with a job to do.</em></h2>
          <p className="mt-8 max-w-sm text-muted-foreground">physical AI, speech AI and graph ML, all built at IIT Madras. each one is explained twice: in plain words first, then in the proper terms underneath.</p>
          <p className="mb-3 mt-10 text-sm">show me</p>
          <div className="flex flex-wrap gap-2">
            {["All", "Physical AI", "Speech AI", "Graph ML"].map((item) => <Button key={item} variant="filter" data-active={filter === item} onClick={() => setFilter(item)} data-cursor={`filter: ${item.toLowerCase()}`}>{item}</Button>)}
          </div>
        </aside>
        <div className="grid gap-20">
          {/* each build is drawn rather than screenshotted (see project-art.tsx), then
              explained by BuildStory. Give one a `link` and its drawing opens it;
              give it `code` and the arrow appears. */}
          {filtered.map((build) => {
            const art = <build.Art className="aspect-[4/3] transition-transform duration-700 ease-out group-hover:scale-[1.025]" />;
            return (
              <article key={build.title} className="group">
                {build.link ? (
                  <a href={build.link} target="_blank" rel="noreferrer" className="block overflow-hidden border border-border bg-muted" data-cursor="see it up close ↗">{art}</a>
                ) : (
                  <div className="overflow-hidden border border-border bg-muted">{art}</div>
                )}
                <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-5">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{String(builds.indexOf(build) + 1).padStart(2, "0")} / {build.tags.join(" · ")}{build.status && <span className="ml-2 rounded-full border border-cursor-border px-2 py-0.5 text-cursor-border">{build.status}</span>}</p>
                    <h3 className="mt-1 font-serif text-4xl">{build.title}</h3>
                    <p className="mt-3 max-w-2xl font-serif text-2xl leading-snug">{build.simple}</p>
                    <div className="mt-6"><BuildStory build={build} /></div>
                  </div>
                  {build.code && <Button asChild variant="paper" size="icon"><a href={build.code} target="_blank" rel="noreferrer" aria-label={`${build.title} on GitHub`} data-cursor="read the code ↗"><ArrowUpRight className="h-5 w-5" /></a></Button>}
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && <p className="py-24 text-muted-foreground">Nothing on that bench yet. Try another filter.</p>}
          {/* the way down to everything else */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-10">
            <p className="font-serif text-3xl">still curious? <span className="text-muted-foreground">it goes deeper.</span></p>
            <RabbitHoleButton />
          </div>
        </div>
      </div>
    </section>
  );
}

// What I've written down on LinkedIn, told the way it actually happened: the
// thing everyone assumes, the moment it falls apart, the line I kept from the
// post, and one joke at my own expense.
const thoughts = [
  {
    topic: "thermodynamics",
    assumed: "the wheel spins a dynamo, the dynamo charges the battery, the battery spins the wheel. forever. i have solved energy.",
    clicked: "then you meet thermodynamics, which is incredibly boring in one specific way: it doesn't care how clever the idea sounds.",
    quote: "physics is annoyingly consistent.",
    aside: "a little heat. a little friction. a little of my pride.",
  },
  {
    topic: "JEE Advanced",
    assumed: "an exam stays secure because of locks, seals and strong rooms.",
    clicked: "then there's the one where, even if someone hands you the paper early, you still need to know how to solve it.",
    quote: "the real security layer is the difficulty itself.",
    aside: "the internet can train LLMs. this paper still humbles everyone for 6 hours straight.",
  },
  {
    topic: "physical AI",
    assumed: "robots are the shiny new thing.",
    clicked: "we've had robots for decades. the Cambrian explosion wasn't the beginning of life either; it's just when life got interesting.",
    quote: "we're no longer just building machines that move. we're building machines that understand the world before they move.",
    aside: "moving was the easy part, apparently.",
  },
  {
    topic: "problem scoping",
    assumed: "the hard part of engineering is solving the problem.",
    clicked: "hours into debating solutions, you realise everyone understood the problem differently.",
    quote: "the hard part is often problem scoping, not just problem defining.",
    aside: "five people. five solutions. five different problems.",
  },
  {
    topic: "idea → build",
    assumed: "hardware is hard. you can't just ask for a drone.",
    clicked: "i typed “create an ESP32-based quadcopter” and got back wiring diagrams, a parts list and assembly steps. in one shot.",
    quote: "the barrier between “i have an idea” and “i built it” keeps shrinking.",
    aside: "so are my excuses for not building it.",
  },
];

// The one assumption of my own that's still standing, and the plan after
// that. Change the year here and it changes everywhere.
const HUMANOID_GARAGE_YEAR = 2040;
const bets = [
  {
    topic: "my biggest assumption",
    status: `still standing. check back in ${HUMANOID_GARAGE_YEAR}.`,
    quote: `by ${HUMANOID_GARAGE_YEAR}, there will be garages and service centres for humanoid robots, the way there are for cars.`,
    aside: "your first 10,000-step service is on me.",
    art: garage,
    alt: "a humanoid robot up on a garage lift with its chest panel open, and a girl with a spanner working on its knee",
  },
  {
    topic: "the long game",
    status: "after all of the above.",
    quote: "become an astronaut. then, real estate on the moon.",
    aside: "great views. zero neighbours. the commute needs work.",
    art: moon,
    alt: "a girl in a space helmet standing on the moon with a flag, beside a for-sale board with a little house on it and plots marked out in dashed lines",
  },
];

// Thinking, out loud: five assumptions and the moment each one fell apart, on
// index cards pinned slightly askew, then the two bets underneath.
function Thoughts() {
  return (
    <section id="notes" className="relative border-t border-border bg-background px-5 py-24 sm:px-8">
      <Stars count={12} seed={33} />
      <div className="mx-auto grid max-w-[1500px] gap-14 lg:grid-cols-[minmax(280px,0.65fr)_minmax(0,1.35fr)]">
        <aside className="h-fit lg:sticky lg:top-28">
          <p className="text-sm text-muted-foreground">field notes / written on linkedin</p>
          <h2 className="mt-4 max-w-md font-serif text-5xl leading-none sm:text-6xl">thinking,<br /><em>out loud.</em></h2>
          <p className="mt-8 max-w-sm text-muted-foreground">five things everyone assumes, and the exact moment each one fell apart. then one of mine that hasn't. yet.</p>
          <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 border-b border-foreground pb-0.5 text-sm" data-cursor="the long versions ↗">read them in full on linkedin <ArrowUpRight className="h-4 w-4" /></a>
        </aside>
        <div>
          <ol className="grid gap-5 sm:grid-cols-2">
            {thoughts.map((thought, index) => (
              <li key={thought.topic} className={cn("border border-border bg-card p-7 shadow-[0_8px_20px_rgb(0_0_0/0.05)] transition-transform duration-500 hover:-translate-y-1 hover:rotate-0 sm:p-8", index % 2 ? "rotate-[0.7deg]" : "-rotate-[0.7deg]", index === 2 && "sm:col-span-2")}>
                <p className="font-hand text-sm tracking-[0.14em] text-muted-foreground">note {String(index + 1).padStart(2, "0")} · {thought.topic}</p>
                <dl className="mt-4 grid max-w-2xl gap-3 text-[0.95rem] leading-snug">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">the assumption</dt>
                    <dd className="mt-1 text-muted-foreground line-through decoration-foreground/40">{thought.assumed}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">the moment it fell apart</dt>
                    <dd className="mt-1">{thought.clicked}</dd>
                  </div>
                </dl>
                <blockquote className={cn("mt-6 font-serif leading-[1.1]", index === 2 ? "text-3xl sm:text-4xl" : "text-3xl")}>“{thought.quote}”</blockquote>
                <p className="mt-4 -rotate-1 font-hand text-[1.1rem] tracking-[0.06em] text-cursor-border">↳ {thought.aside}</p>
              </li>
            ))}
          </ol>
          <div className="mt-5 grid gap-5">
            {bets.map((bet, index) => (
              <article key={bet.topic} className="grid items-center gap-6 border-2 border-foreground bg-card p-7 shadow-[0_8px_20px_rgb(0_0_0/0.05)] sm:p-8 md:grid-cols-2">
                <img src={bet.art} alt={bet.alt} draggable={false} className={cn("w-full", index % 2 === 1 && "md:order-2")} />
                <div>
                  <p className="font-hand text-sm tracking-[0.14em] text-muted-foreground">note {String(thoughts.length + index + 1).padStart(2, "0")} · {bet.topic}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-cursor-border">{bet.status}</p>
                  <blockquote className="mt-2 font-serif text-3xl leading-[1.1]">“{bet.quote}”</blockquote>
                  <p className="mt-4 -rotate-1 font-hand text-[1.1rem] tracking-[0.06em] text-cursor-border">↳ {bet.aside}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-12 font-serif text-3xl leading-tight sm:text-4xl">why mechanical engineering? <span className="text-muted-foreground">give me some time. i'm still figuring out whether machines run me or i run them.</span></p>
        </div>
      </div>
    </section>
  );
}

// Where the closing thread ends (the eyelet on the robot hand's cuff), in
// vw/vh of the section's first screen. The hand is pinned by that eyelet, so
// the thread ties on at exactly this point on every screen.
const HAND_X = 76;
const HAND_Y = 71;
// How tall the hand stands on laptops, in vh.
const HAND_H = 60;
// How far (px) a pull has to travel to close the hand into a full fist.
const FULL_PULL = 240;

// What the hand says as people keep pulling its tendons: one line per pull,
// getting less patient, until it's time to just talk.
const handLines = [
  "oh, hi. you found the hand.",
  "that's a tendon. you're pulling it.",
  "10 degrees of freedom. you've found one.",
  "this is teleoperation, by the way.",
  "i'm a robot hand, not a stress ball.",
  EMAIL ? `okay, enough. let's talk? ↓ ${EMAIL}` : "okay, enough. let's talk? ↓",
];

const blendPose = (from: HandPose, to: HandPose, t: number) => from.map((v, i) => v + ((to[i] ?? 0) - v) * t) as HandPose;
// One frame of the hello: a curl that travels from the thumb to the pinky.
const wavePose = (step: number) => [...[0, 1, 2, 3, 4].map((i) => Math.max(0.03, 0.8 - Math.abs(step - 1 - i) * 0.5)), 0.5] as HandPose;

// A sketch of HandSync's hand, with the thread tied on as its tendon. It hangs
// limp until the thread arrives, then powers up and waves. Hover and it throws
// a peace sign; grab it and drag, and the further you pull the tighter it
// closes, springing open on release. Every pull gets a new (less patient) line.
function RobotHand({ awake, phone = false, boxRef, children }: { awake: boolean; phone?: boolean; boxRef?: RefObject<HTMLDivElement | null>; children?: ReactNode }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [pull, setPull] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pulls, setPulls] = useState(0);
  const [wave, setWave] = useState(-1);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!awake) return;
    let step = 0;
    setWave(0);
    const timer = window.setInterval(() => {
      step += 1;
      setWave(step > 6 ? -1 : step);
      if (step > 6) window.clearInterval(timer);
    }, 150);
    return () => window.clearInterval(timer);
  }, [awake]);

  const grip = Math.min(1, Math.hypot(pull.x, pull.y) / FULL_PULL);
  const lean = Math.max(-7, Math.min(7, pull.x / 30));
  const target = !awake ? POSES.limp : dragging ? blendPose(POSES.open, POSES.fist, grip) : wave >= 0 ? wavePose(wave) : hovered ? POSES.peace : POSES.relaxed;
  const pose = useEasedPose(target, dragging ? 0.45 : 0.2);

  const line = dragging && grip > 0.92 ? "full fist. please mind the actuators." : handLines[Math.min(pulls, handLines.length - 1)]!;
  const talking = awake && (hovered || dragging);
  useEffect(() => {
    if (talking) quietOthers(-2);
  }, [talking]);

  // Type each new line out, like the other objects' confessions.
  useEffect(() => {
    if (!talking) {
      setTyped("");
      return;
    }
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(line.slice(0, index));
      if (index >= line.length) window.clearInterval(timer);
    }, 26);
    return () => window.clearInterval(timer);
  }, [talking, line]);

  const letGo = () => {
    if (start.current && grip > 0.12) setPulls((n) => n + 1);
    start.current = null;
    setDragging(false);
    setPull({ x: 0, y: 0 });
  };

  return (
    <div
      ref={boxRef}
      className={cn(phone ? "relative w-full" : "pointer-events-auto absolute")}
      style={{ aspectRatio: `${HAND_VIEW.w} / ${HAND_VIEW.h}`, ...(phone ? {} : { left: `${HAND_X}vw`, top: `${HAND_Y}vh`, height: `${HAND_H}vh`, translate: `-${EYELET_FX * 100}% -${EYELET_FY * 100}%` }) }}
    >
      <div
        aria-live="polite"
        style={{ transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }}
        className={cn(
          "pointer-events-none absolute z-10 w-max whitespace-pre-line border border-cursor-border bg-cursor px-4 py-2 text-sm text-cursor-foreground shadow-lg transition-[opacity,scale] duration-300",
          phone ? "left-[78%] top-0 max-w-[40vw] rounded-[18px_18px_18px_5px]" : "right-[84%] top-[18%] max-w-[16rem] rounded-[18px_18px_5px_18px]",
          talking ? "scale-100 opacity-100" : "scale-90 opacity-0",
        )}
      >
        {typed}
        <span className="animate-pulse">|</span>
      </div>
      <div
        data-cursor=""
        onContextMenu={(e) => e.preventDefault()}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={(e) => {
          if (!awake) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          start.current = { x: e.clientX, y: e.clientY };
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          setPull({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
        }}
        onPointerUp={letGo}
        onPointerCancel={letGo}
        className={cn("h-full w-full touch-none select-none", dragging ? "cursor-grabbing" : "cursor-grab", awake ? "opacity-100" : "opacity-40")}
        style={{
          transformOrigin: "50% 100%",
          // On phones it's a right hand, so the thread can come in from the edge.
          transform: `rotate(${lean}deg) scale(${hovered && !dragging ? 1.03 : 1})${phone ? " scaleX(-1)" : ""}`,
          filter: talking ? "drop-shadow(0 22px 26px rgb(0 0 0 / 0.18))" : "drop-shadow(0 6px 10px rgb(0 0 0 / 0.06))",
          // Follow the pull instantly while dragging; wobble back when let go.
          transition: dragging ? "filter .3s" : "transform .9s cubic-bezier(.2,2.2,.4,.8), filter .3s, opacity .7s",
        }}
      >
        <TendonHand pose={pose} powered={awake} className="h-full w-full" />
      </div>
      {children}
    </div>
  );
}

// A handwritten margin note, like scribbles on the page.
function Scribble({ className, rotate = -10, children }: { className?: string; rotate?: number; children: ReactNode }) {
  return (
    <p className={cn("font-hand text-[1.05rem] leading-[1.3] tracking-[0.08em] text-foreground/75", className)} style={{ rotate: `${rotate}deg` }}>
      {children}
    </p>
  );
}

// A small hand-drawn arrow. `d` is the stroke; the head is drawn at its end.
function ScribbleArrow({ d, head, className, style }: { d: string; head: string; className?: string; style?: CSSProperties }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 60 60" className={cn("absolute h-10 w-10 overflow-visible text-foreground/70", className)} style={style}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d={head} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// The perpetual motion machine I was briefly sure about, as the closing fun fact.
const funFact = { src: flywheel, alt: "a sketch of an overbalanced wheel, the classic perpetual motion machine", label: "thermodynamics disagreed. politely." };

// Whichever profiles are filled in (see lib/profile.ts). LinkedIn becomes the
// main button when there's no email, so it isn't listed twice.
const contactLinks = [
  EMAIL && LINKS.linkedin ? { label: "linkedin", href: LINKS.linkedin, cursor: "the formal version of all this." } : null,
  LINKS.huggingface ? { label: "hugging face", href: LINKS.huggingface, cursor: "where the models live." } : null,
  LINKS.github ? { label: "github", href: LINKS.github, cursor: "where the code lives. judge gently." } : null,
  LINKS.x ? { label: "x", href: LINKS.x, cursor: "shorter thoughts. worse punctuation." } : null,
].filter((link) => link !== null);

const pill = "inline-flex items-center justify-between gap-10 rounded-xl px-5 text-[1.05rem] transition-colors";

// 10: the end. "end of thread. i'm bhavishya.", and the thread leaves those
// words, ties one last loop, and becomes the tendon of a robot hand. Margin
// notes scribbled around it.
function OhHi() {
  const ref = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const hiRef = useRef<HTMLSpanElement>(null);
  // Only the two moments that change the layout go through React: the words
  // arriving, and the thread reaching the hand.
  const [stage, setStage] = useState({ seen: false, reached: false });
  const [thread, setThread] = useState("");
  const seen = stage.seen;
  // Phones: the thread runs down the page from "end of thread." into the hand.
  const phoneImgRef = useRef<HTMLDivElement>(null);
  const phonePathRef = useRef<SVGPathElement>(null);
  const [phoneThread, setPhoneThread] = useState<{ d: string; y0: number; y1: number; w: number; h: number } | null>(null);
  const [phoneReached, setPhoneReached] = useState(false);

  // The thread starts right after "end of thread.", wherever the type lands
  // on this screen, so measure it, then wave through to the hand.
  useEffect(() => {
    const measure = () => {
      const hi = hiRef.current;
      const section = ref.current;
      if (!hi || !section) return;
      const r = hi.getBoundingClientRect();
      const q = section.getBoundingClientRect();
      const sx = ((r.right - q.left) / window.innerWidth) * 100 + 0.8;
      const sy = ((r.top - q.top + r.height * 0.55) / window.innerHeight) * 100;
      // On phones, trace it in pixels: out of the words, down the right edge,
      // under the thumb and into the eyelet on the cuff (the hand is mirrored
      // there, so the eyelet faces the edge the thread comes down).
      const box = phoneImgRef.current;
      if (!isWide() && box) {
        const m = box.getBoundingClientRect();
        const w = q.width;
        const start: Waypoint = [r.right - q.left + 6, r.top - q.top + r.height * 0.55];
        const hand: Waypoint = [m.left - q.left + m.width * (1 - EYELET_FX), m.top - q.top + m.height * EYELET_FY];
        const d = segmentsPath(threadSegments([start, [w * 0.9, start[1] + 36], [w * 0.95, (start[1] + hand[1]) / 2], [w * 0.93, hand[1] - m.height * 0.2], [hand[0] + m.width * 0.4, hand[1] + m.height * 0.1], [hand[0] + m.width * 0.1, hand[1] + m.height * 0.03], hand], 1, 1));
        setPhoneThread({ d, y0: start[1], y1: hand[1], w, h: q.height });
      }
      // One last loop on the way over, then in under the thumb to the eyelet.
      const crest = Math.max(sx + 6, 31);
      setThread(threadPath([[sx, sy], [crest, sy - 4], [crest + 4, sy + 10], [Math.max(crest + 7, 57), 52, 5], [HAND_X - 13, HAND_Y - 4], [HAND_X - 3.5, HAND_Y + 3.5], [HAND_X - 1, HAND_Y + 0.8], [HAND_X, HAND_Y]]));
    };
    measure();
    void document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!phoneThread) return;
    let frame = 0;
    const draw = () => {
      frame = 0;
      const node = ref.current;
      const path = phonePathRef.current;
      if (!node || !path) return;
      const top = node.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.72 - (top + phoneThread.y0)) / Math.max(1, phoneThread.y1 - phoneThread.y0)));
      path.style.strokeDashoffset = `${1 - p}`;
      setPhoneReached(p >= 0.98);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [phoneThread]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Arrive and the thread travels toward the hand; scroll back up and it
    // retraces its way out. It animates on its own rather than sticking to
    // the scrollbar, easing toward wherever it should be.
    let frame = 0;
    let current = 0;
    let greeted = false;
    const tick = () => {
      const { top } = node.getBoundingClientRect();
      const target = top < window.innerHeight * 0.45 ? 1 : 0;
      const gap = target - current;
      current = Math.abs(gap) < 0.002 ? target : current + gap * 0.045 + Math.sign(gap) * 0.004;
      current = Math.min(1, Math.max(0, current));
      if (pathRef.current) pathRef.current.style.strokeDashoffset = `${1 - current}`;
      const next = { seen: current > 0.3, reached: current >= 0.98 };
      if (next.reached && !greeted) {
        greeted = true;
        say("hi", "you scrolled the whole thread? respect.");
      }
      setStage((s) => (s.seen === next.seen && s.reached === next.reached ? s : next));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Fade and sharpen something in, merged with its own classes and style.
  const arrive = (on: boolean, delay: string, className: string, style?: CSSProperties) => ({
    className: cn(className, "transition-all duration-700", on ? "translate-y-0 opacity-100 blur-0" : "translate-y-3 opacity-0 blur-sm"),
    style: { ...style, transitionDelay: on ? delay : "0s" },
  });

  return (
    <section id="hi" ref={ref} className="relative min-h-screen overflow-hidden border-t border-border px-5 pb-10 pt-28 sm:px-8 wide:h-screen wide:min-h-[720px] wide:px-[4.5vw] wide:pb-0 wide:pt-[23vh]">
      <Stars count={12} seed={45} />
      {phoneThread && (
        <svg aria-hidden="true" className="pointer-events-none absolute left-0 top-0 wide:hidden" width={phoneThread.w} height={phoneThread.h} viewBox={`0 0 ${phoneThread.w} ${phoneThread.h}`}>
          <path ref={phonePathRef} d={phoneThread.d} pathLength="1" strokeDasharray="1" style={{ strokeDashoffset: 1 }} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-screen wide:block">
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <path ref={pathRef} pathLength="1" strokeDasharray="1" style={{ strokeDashoffset: 1 }} d={thread} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <RobotHand awake={stage.reached}>
          <div {...arrive(stage.reached, ".5s", "absolute left-[82%] top-[-10%]")}>
            <Scribble className="w-36" rotate={-9}>a sketch of HandSync.<br />10 DOF,<br />tendon-driven.</Scribble>
            <ScribbleArrow className="left-1 top-[5.2rem]" d="M34 4 C38 20 32 34 20 46" head="M20 46 L21 35 M20 46 L31 42" />
          </div>
          <div {...arrive(stage.reached, "1.2s", "absolute left-[62%] top-[101%]")}>
            <Scribble className="w-44" rotate={-4}>go on. grab it<br />and pull.</Scribble>
          </div>
        </RobotHand>
      </div>

      <div {...arrive(seen, "0s", "relative wide:max-w-[58vw]")}>
        <div className="relative w-fit">
          <Scribble className="absolute -left-1 -top-14 hidden wide:block" rotate={-12}>and this is the</Scribble>
          <ScribbleArrow className="-left-8 -top-7 hidden wide:block" d="M26 4 C12 10 6 22 10 36" head="M10 36 L4 27 M10 36 L16 29" />
          <h2 className="font-serif text-[clamp(3rem,min(6.6vw,11.7vh),7.5rem)] leading-[0.9] tracking-[-0.01em]">
            <span ref={hiRef}>end of thread.</span>
            <br />
            i'm <em>{FIRST_NAME.toLowerCase()}</em>.
          </h2>
        </div>
        <p className="mt-4 text-[clamp(1.05rem,min(1.25vw,2.2vh),1.35rem)] leading-[1.2] text-muted-foreground">still a mechie.<br />still planning to sell plots on the moon.<br />still not sure who's running whom.</p>
        <p className="mt-7 font-serif text-[clamp(1.75rem,min(2.75vw,4.9vh),3rem)] leading-[1.08]">let's build machines that<br className="narrow:hidden" /> understand<br className="wide:hidden" /> <em>before they move</em>.</p>
        <div className="relative mt-7 flex w-fit flex-col items-start gap-3">
          {EMAIL ? (
            <a href={`mailto:${EMAIL}`} className={cn(pill, "min-w-64 bg-foreground py-3 text-background hover:bg-foreground/85")} data-cursor="pitch me the weird idea.">{EMAIL} <ArrowUpRight className="h-4 w-4" /></a>
          ) : (
            <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className={cn(pill, "min-w-64 bg-foreground py-3 text-background hover:bg-foreground/85")} data-cursor="pitch me the weird idea.">say hi on linkedin <ArrowUpRight className="h-4 w-4" /></a>
          )}
          <div className="flex flex-wrap gap-3">
            {contactLinks.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className={cn(pill, "border border-foreground/50 py-2.5 hover:bg-foreground/5 narrow:bg-background")} data-cursor={link.cursor}>{link.label} <ArrowUpRight className="h-4 w-4" /></a>
            ))}
          </div>
          {/* the wheel sits just past the buttons, its fun fact scribbled beside it */}
          <div className="absolute left-[calc(100%+6vw)] top-[-0.75rem] hidden items-center gap-1 xl:flex">
            <div className="relative">
              <Scribble className="w-36" rotate={-10}>fun fact:<br />i once “solved”<br />infinite energy.</Scribble>
              <ScribbleArrow className="-right-8 top-[4.5rem]" d="M4 8 C8 22 18 30 34 30" head="M34 30 L25 24 M34 30 L26 37" />
            </div>
            <Figure {...funFact} size="sm" />
          </div>
        </div>
        <div className="relative mt-14 wide:hidden">
          <div className="ml-[6%] w-[60%] max-w-[19rem]">
            <RobotHand phone awake={phoneReached} boxRef={phoneImgRef} />
          </div>
          <Scribble className="ml-[10%] mt-5 w-48" rotate={-4}>a sketch of HandSync.<br />go on, pull it.</Scribble>
          {/* the wheel, with its fun fact beside it */}
          <div className="mt-12 flex items-center justify-end gap-2">
            <Scribble className="w-36 text-right" rotate={-6}>fun fact:<br />i once “solved”<br />infinite energy.</Scribble>
            <Figure {...funFact} size="sm" />
          </div>
        </div>
      </div>

      <button onClick={() => document.getElementById("brain")?.scrollIntoView({ behavior: "smooth" })} className="story-link mt-10 block bg-transparent text-xs text-muted-foreground/70 wide:absolute wide:bottom-5 wide:right-20 wide:mt-0" data-cursor="again, from the top ↑">© 2026 {FIRST_NAME.toLowerCase()} · back to top ↑</button>
    </section>
  );
}

// Phones have no cursor, so the story's comments pop up as a little chat
// bubble in the bottom corner instead: typed out, then gone.
function PhoneComment() {
  const [comment, setComment] = useState<CursorComment | null>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const onComment = (event: Event) => {
      const next = (event as CustomEvent<CursorComment>).detail;
      if (next.id !== "hover" && !isWide()) setComment(next);
    };
    const hush = (e: Event) => {
      if ((e as CustomEvent<number>).detail !== -1) setComment(null);
    };
    window.addEventListener("figure-open", hush);
    window.addEventListener("cursor-comment", onComment);
    return () => window.removeEventListener("figure-open", hush);
      window.removeEventListener("cursor-comment", onComment);
  }, []);

  useEffect(() => {
    setTyped("");
    if (!comment) return;
    let index = 0;
    let fade = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(comment.text.slice(0, index));
      if (index >= comment.text.length) {
        window.clearInterval(timer);
        fade = window.setTimeout(() => setComment((c) => (c === comment ? null : c)), 3800);
      }
    }, 32);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(fade);
    };
  }, [comment]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed bottom-5 left-4 z-[90] wide:hidden">
      <div
        className={cn(
          "origin-bottom-left whitespace-nowrap rounded-[24px_24px_24px_2px] border-2 border-cursor-border bg-cursor px-4 py-2 text-sm font-medium text-cursor-foreground transition-[opacity,scale] duration-300 [filter:drop-shadow(4px_4px_5px_rgb(46_144_250/0.16))]",
          comment ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }}
      >
        {typed || " "}
      </div>
    </div>
  );
}

// The cursor's comment bubble. It trails the pointer with a touch of easing
// and says nothing by default. It only speaks when the story or the thing
// under the pointer has something to say, types it out, and fades away.
function CuriousCursor({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [comment, setComment] = useState<CursorComment | null>(null);
  const [typed, setTyped] = useState("");
  const [moved, setMoved] = useState(false);
  // Re-places the bubble without the pointer moving (e.g. as text types out).
  const reposition = useRef(() => {});

  useEffect(() => {
    const target = { x: -200, y: -200 };
    const pos = { x: -200, y: -200 };
    let frame = 0;
    const tick = () => {
      pos.x += (target.x - pos.x) * 0.28;
      pos.y += (target.y - pos.y) * 0.28;
      const el = ref.current;
      if (el) {
        // Near the right or bottom edge, the bubble flips to the other side of
        // the pointer so it never runs off screen.
        const bubble = el.firstElementChild as HTMLElement | null;
        const w = bubble?.offsetWidth ?? 0;
        const h = bubble?.offsetHeight ?? 0;
        const left = pos.x + 14 + w > window.innerWidth - 8;
        const up = pos.y + 16 + h > window.innerHeight - 8;
        const x = left ? pos.x - 14 - w : pos.x + 14;
        const y = up ? pos.y - 16 - h : pos.y + 16;
        el.style.transform = `translate3d(${Math.max(8, x)}px, ${Math.max(8, y)}px, 0)`;
        // the sharp corner always points back at the cursor
        if (bubble) {
          const r = ["24px", "24px", "24px", "24px"];
          r[up ? (left ? 2 : 3) : left ? 1 : 0] = "2px";
          bubble.style.borderRadius = r.join(" ");
          bubble.style.transformOrigin = `${up ? "bottom" : "top"} ${left ? "right" : "left"}`;
        }
      }
      frame = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.3 ? requestAnimationFrame(tick) : 0;
    };
    reposition.current = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => {
      // The first move puts the bubble right at the pointer, no glide in.
      if (target.x === -200) {
        pos.x = event.clientX;
        pos.y = event.clientY;
      }
      target.x = event.clientX;
      target.y = event.clientY;
      setMoved(true);
      if (!frame) frame = requestAnimationFrame(tick);
    };
    // Hovering something with a comment says it; moving off it goes quiet.
    let hoverText = "";
    const over = (event: PointerEvent) => {
      const el = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-cursor]") : null;
      const text = el?.dataset["cursor"] ?? "";
      if (text === hoverText) return;
      hoverText = text;
      if (text) setComment({ id: "hover", text, fade: false });
      else setComment((c) => (c?.id === "hover" ? null : c));
    };
    const onComment = (event: Event) => setComment((event as CustomEvent<CursorComment>).detail);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    const hush = (e: Event) => {
      if ((e as CustomEvent<number>).detail !== -1) setComment(null);
    };
    window.addEventListener("figure-open", hush);
    window.addEventListener("cursor-comment", onComment);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("figure-open", hush);
      window.removeEventListener("cursor-comment", onComment);
    };
  }, []);

  // Type the comment out, then let story comments fade after a few seconds.
  // The bubble grows as it types, so keep checking it still fits on screen.
  useEffect(() => {
    reposition.current();
  }, [typed]);

  useEffect(() => {
    setTyped("");
    if (!comment) return;
    let index = 0;
    let fade = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(comment.text.slice(0, index));
      if (index >= comment.text.length) {
        window.clearInterval(timer);
        if (comment.fade) fade = window.setTimeout(() => setComment((c) => (c === comment ? null : c)), 4500);
      }
    }, 32);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(fade);
    };
  }, [comment]);

  const showing = visible && moved && comment !== null;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden will-change-transform motion-reduce:hidden wide:block"
      style={{ transform: "translate3d(-200px, -200px, 0)" }}
    >
      <div
        className={cn(
          "origin-top-left whitespace-nowrap rounded-[2px_24px_24px_24px] border-2 border-cursor-border bg-cursor px-4 py-2 text-sm font-medium text-cursor-foreground transition-[opacity,scale] duration-300 [filter:drop-shadow(4px_4px_5px_rgb(46_144_250/0.16))]",
          showing ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }}
      >
        {typed || " "}
      </div>
    </div>
  );
}
