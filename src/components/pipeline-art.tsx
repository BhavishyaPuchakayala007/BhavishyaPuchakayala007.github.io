import { HandGlyph, useHandRoutine } from "@/components/tendon-hand";

// Sense and think, drawn as the first two stages of one pipeline. Together
// with the robot hand (act) they share a pose: the camera sees it, the model
// turns it into five numbers a beat later, and the hand follows a beat after
// that. `lag` is how far behind the camera each stage runs, in ms.

const ink = { fill: "var(--background)", stroke: "var(--foreground)", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

// What the webcam sees: your hand, reduced to 21 dots.
export function SenseArt({ lag = 0 }: { lag?: number }) {
  const pose = useHandRoutine(lag, 1500);
  return (
    <svg aria-hidden="true" viewBox="0 0 240 240" className="h-full w-full overflow-visible">
      <rect x="30" y="38" width="180" height="192" rx="16" {...ink} />
      <path d="M46 72 V54 H64 M176 54 H194 V72 M46 196 V214 H64 M176 214 H194 V196" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" opacity=".4" />
      <g transform="translate(46 2) scale(0.61)">
        <HandGlyph pose={pose} variant="skeleton" />
      </g>
      <line x1="40" x2="200" stroke="var(--cursor)" strokeWidth="2" strokeLinecap="round" className="animate-scan" />
      {/* the webcam itself, clipped to the top of the frame */}
      <rect x="90" y="8" width="60" height="30" rx="15" {...ink} />
      <circle cx="120" cy="23" r="8" fill="var(--cursor)" stroke="var(--foreground)" strokeWidth="2.4" />
      <circle cx="117.5" cy="20.5" r="2.2" fill="var(--background)" />
      <circle cx="141" cy="17" r="2.4" fill="var(--signal-red)" className="animate-pulse" />
    </svg>
  );
}

// What the model does with it: dots in, one number per finger out.
const inputs = [66, 104, 142, 180];
const hidden = [44, 82, 120, 158, 196];
const outputs = [44, 82, 120, 158, 196];

export function ThinkArt({ lag = 0 }: { lag?: number }) {
  const pose = useHandRoutine(lag, 1500);
  return (
    <svg aria-hidden="true" viewBox="0 0 240 240" className="h-full w-full overflow-visible">
      {inputs.flatMap((y0) => hidden.map((y1) => <line key={`a${y0}-${y1}`} x1="30" y1={y0} x2="92" y2={y1} stroke="var(--foreground)" strokeWidth="1.2" opacity=".28" />))}
      {hidden.flatMap((y0, i) => outputs.filter((_, j) => Math.abs(i - j) <= 1).map((y1) => <line key={`b${y0}-${y1}`} x1="92" y1={y0} x2="150" y2={y1} stroke="var(--foreground)" strokeWidth="1.2" opacity=".28" />))}
      {/* a few connections light up, carrying the signal across */}
      {[[30, 66, 92, 82], [30, 142, 92, 120], [30, 180, 92, 196], [92, 82, 150, 44], [92, 120, 150, 120], [92, 196, 150, 158]].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--cursor)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 8" className="animate-dash-flow" style={{ animationDelay: `${i * -0.23}s` }} />
      ))}
      {inputs.map((y) => <circle key={y} cx="30" cy={y} r="7.5" fill="var(--cursor)" stroke="var(--background)" strokeWidth="2" />)}
      {hidden.map((y) => <circle key={y} cx="92" cy={y} r="8" {...ink} strokeWidth="2.6" />)}
      {outputs.map((y, i) => (
        <g key={y}>
          <circle cx="150" cy={y} r="8" {...ink} strokeWidth="2.6" />
          {/* how far this finger should curl, right now */}
          <rect x="166" y={y - 7} width="64" height="14" rx="7" {...ink} strokeWidth="2.2" />
          <rect x="169" y={y - 4} width={Math.max(8, 58 * Math.min(1, pose[i] ?? 0))} height="8" rx="4" fill="var(--cursor)" />
        </g>
      ))}
    </svg>
  );
}
