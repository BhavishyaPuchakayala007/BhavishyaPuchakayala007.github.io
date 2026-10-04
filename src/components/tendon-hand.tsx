import { useEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

// A tendon-driven robot hand, drawn in the same ink as the thread. Each finger
// is three links on pin joints, and a blue tendon runs from the spool at the
// wrist to every fingertip. Wrist + four points per finger makes 21 landmarks,
// the same 21 HandSync reads off a webcam.

// How far each finger is curled (0 open, 1 closed), thumb first, plus how far
// the fingers fan apart.
export type HandPose = [thumb: number, index: number, middle: number, ring: number, pinky: number, spread: number];

export const POSES = {
  open: [0.06, 0.03, 0.02, 0.04, 0.06, 0.5],
  relaxed: [0.22, 0.14, 0.18, 0.22, 0.27, 0.15],
  limp: [0.5, 0.56, 0.6, 0.63, 0.66, 0],
  peace: [0.92, 0, 0, 0.96, 0.98, 1],
  point: [0.9, 0, 0.96, 0.98, 0.98, 0],
  fist: [0.95, 1, 1, 1, 1, 0],
} satisfies Record<string, HandPose>;

// The drawing's own coordinate box, and the eyelet on the cuff where the
// thread ties on, as a fraction of that box (so a page can pin the hand by it).
export const HAND_VIEW = { x: 2, y: 86, w: 238, h: 340 };
const EYELET = { x: 110, y: 362 };
export const EYELET_FX = (EYELET.x - HAND_VIEW.x) / HAND_VIEW.w;
export const EYELET_FY = (EYELET.y - HAND_VIEW.y) / HAND_VIEW.h;
const SPOOL = { x: 150, y: 336 };

// base: the knuckle; angle: degrees off straight up; sweep: how far the whole
// finger swings across the palm as it closes (only the thumb does).
const FINGERS = [
  { base: [96, 316], angle: -50, lengths: [40, 32, 26], width: 23, fan: -10, sweep: 78, flex: [20, 50, 60] },
  { base: [104, 222], angle: -9, lengths: [44, 30, 24], width: 21, fan: -9, sweep: 0, flex: [85, 100, 75] },
  { base: [136, 210], angle: 1, lengths: [48, 34, 26], width: 21, fan: 5, sweep: 0, flex: [85, 100, 75] },
  { base: [168, 214], angle: 9, lengths: [44, 31, 24], width: 20, fan: 4, sweep: 0, flex: [85, 100, 75] },
  { base: [198, 230], angle: 17, lengths: [34, 24, 20], width: 17, fan: 9, sweep: 0, flex: [85, 100, 75] },
] as const;

type Point = [x: number, y: number];

// The four landmarks of one finger: knuckle, two joints, tip. The hand is seen
// flat-on, so a link curling toward the viewer just gets shorter, and past 90°
// it folds back down over the palm.
function fingerPoints(finger: (typeof FINGERS)[number], curl: number, spread: number): Point[] {
  const a = ((finger.angle + finger.fan * spread + finger.sweep * curl) * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const points: Point[] = [[finger.base[0], finger.base[1]]];
  let bend = 0;
  let reach = 0;
  finger.lengths.forEach((length, k) => {
    bend += (finger.flex[k]! * curl * Math.PI) / 180;
    reach += length * Math.cos(bend);
    points.push([finger.base[0] + dx * reach, finger.base[1] + dy * reach]);
  });
  return points;
}

const f = (n: number) => n.toFixed(1);
const line = (points: Point[]) => points.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");

// The hand as SVG content, for dropping inside a bigger drawing.
// "robot" is the printed hand; "skeleton" is just the 21 landmarks, the way a
// hand-tracking model sees yours.
export function HandGlyph({ pose, variant = "robot", powered = true }: { pose: HandPose; variant?: "robot" | "skeleton" | undefined; powered?: boolean | undefined }) {
  const fingers = FINGERS.map((finger, i) => fingerPoints(finger, pose[i] ?? 0, pose[5]));
  const tendon = { stroke: powered ? "var(--cursor)" : "var(--border)", transition: "stroke .6s" };

  if (variant === "skeleton") {
    const knuckles = fingers.slice(1).map((points) => points[0]!);
    return (
      <g fill="none" stroke="var(--cursor)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points={line([[SPOOL.x, SPOOL.y], ...knuckles, [SPOOL.x, SPOOL.y]])} />
        {fingers.map((points, i) => <polyline key={i} points={line(i === 0 ? [[SPOOL.x, SPOOL.y], ...points] : points)} />)}
        {[[SPOOL.x, SPOOL.y] as Point, ...fingers.flat()].map(([x, y], i) => (
          <circle key={i} cx={f(x)} cy={f(y)} r="5" fill="var(--cursor)" stroke="var(--background)" strokeWidth="1.6" />
        ))}
      </g>
    );
  }

  // Index to pinky first, then the thumb, which closes over the others.
  const order = [1, 2, 3, 4, 0];
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {/* test stand, forearm and cuff */}
      <rect x="96" y="404" width="112" height="14" rx="7" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2.6" />
      <path d="M124 376 L124 404 M180 376 L180 404" fill="none" stroke="var(--foreground)" strokeWidth="2.6" />
      <path d="M120 352 L184 352 L190 376 L114 376 Z" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2.6" />
      {/* palm */}
      <path d="M90 232 Q88 208 108 208 L196 212 Q216 214 216 238 L208 322 Q204 350 178 352 L126 352 Q98 350 92 320 Z" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2.8" />
      <path d="M112 236 L194 240 L188 318 Q186 330 174 330 L128 330 Q114 328 112 316 Z" fill="none" stroke="var(--foreground)" strokeWidth="1.2" opacity=".35" />
      {/* the thread ties on at the eyelet and winds onto the spool */}
      <path d={`M${EYELET.x} ${EYELET.y} Q132 368 ${SPOOL.x} ${SPOOL.y}`} fill="none" strokeWidth="1.8" style={tendon} />
      <circle cx={EYELET.x} cy={EYELET.y} r="5.5" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2.4" />
      {order.map((i) => {
        const points = fingers[i]!;
        const width = FINGERS[i]!.width;
        return (
          <g key={i}>
            {points.slice(1).map((to, k) => {
              const from = points[k]!;
              const w = width - k * 2;
              return (
                <g key={k}>
                  <line x1={f(from[0])} y1={f(from[1])} x2={f(to[0])} y2={f(to[1])} stroke="var(--foreground)" strokeWidth={w + 5} />
                  <line x1={f(from[0])} y1={f(from[1])} x2={f(to[0])} y2={f(to[1])} stroke="var(--background)" strokeWidth={w} />
                </g>
              );
            })}
            <polyline points={line([[SPOOL.x, SPOOL.y], ...points])} fill="none" strokeWidth="1.8" style={tendon} />
            {points.slice(0, 3).map(([x, y], k) => <circle key={k} cx={f(x)} cy={f(y)} r="3.4" fill="var(--background)" stroke="var(--foreground)" strokeWidth="1.6" />)}
            <circle cx={f(points[3]![0])} cy={f(points[3]![1])} r="2.6" style={{ fill: tendon.stroke, transition: "fill .6s" }} />
          </g>
        );
      })}
      <circle cx={SPOOL.x} cy={SPOOL.y} r="9" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2.4" />
      <circle cx={SPOOL.x} cy={SPOOL.y} r="2.4" fill="var(--foreground)" />
    </g>
  );
}

export function TendonHand({ pose, variant, powered, className, style }: { pose: HandPose; variant?: "robot" | "skeleton" | undefined; powered?: boolean | undefined; className?: string | undefined; style?: CSSProperties | undefined }) {
  return (
    <svg aria-hidden="true" viewBox={`${HAND_VIEW.x} ${HAND_VIEW.y} ${HAND_VIEW.w} ${HAND_VIEW.h}`} className={cn("overflow-visible", className)} style={style}>
      <HandGlyph pose={pose} variant={variant} powered={powered} />
    </svg>
  );
}

// Glide toward a pose instead of snapping to it. The little fingers trail the
// thumb slightly, so a change ripples across the hand.
export function useEasedPose(target: HandPose, ease = 0.2): HandPose {
  const [pose, setPose] = useState(target);
  const current = useRef(target);
  const goal = useRef(target);
  const frame = useRef(0);
  goal.current = target;

  useEffect(() => {
    const tick = () => {
      let moving = false;
      const next = current.current.map((value, i) => {
        const gap = (goal.current[i] ?? 0) - value;
        if (Math.abs(gap) < 0.004) return goal.current[i] ?? 0;
        moving = true;
        return value + gap * ease * (i < 5 ? 1 - i * 0.09 : 1);
      }) as HandPose;
      current.current = next;
      setPose(next);
      frame.current = moving ? requestAnimationFrame(tick) : 0;
    };
    if (!frame.current) frame.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.join(","), ease]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      // so a remount (or strict mode's second pass) starts the glide again
      frame.current = 0;
    },
    [],
  );
  return pose;
}

// A hand that keeps itself busy: it runs through a few poses on a loop, each
// change starting `lag` ms late (the robot copying a person, a beat behind).
const ROUTINE: HandPose[] = [POSES.open, POSES.peace, POSES.relaxed, POSES.fist, POSES.open, POSES.point];

export function useHandRoutine(lag = 0, every = 1700): HandPose {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let late = 0;
    const timer = window.setInterval(() => {
      late = window.setTimeout(() => setStep((s) => (s + 1) % ROUTINE.length), lag);
    }, every);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(late);
    };
  }, [lag, every]);
  return useEasedPose(ROUTINE[step]!);
}
