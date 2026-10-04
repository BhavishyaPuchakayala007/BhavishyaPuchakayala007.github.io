import { type ReactNode } from "react";

import { HandGlyph, useHandRoutine } from "@/components/tendon-hand";
import { cn } from "@/lib/utils";

// The projects are hardware and models, not websites, so there is nothing to
// screenshot. Each one gets a drawing of how it works instead, in the same ink
// and blue as the rest of the page.

function Sheet({ label, className, children }: { label: string; className?: string | undefined; children: ReactNode }) {
  return (
    <svg role="img" aria-label={label} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className={cn("block h-full w-full select-none", className)}>
      <rect width="800" height="600" fill="var(--muted)" />
      {children}
    </svg>
  );
}

const caption = { className: "font-hand", fontSize: 25, textAnchor: "middle" as const, fill: "var(--foreground)", opacity: 0.8, letterSpacing: 1 };
const ink = { fill: "none", stroke: "var(--foreground)", strokeWidth: 2.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

// HandSync: your hand on the left as a webcam sees it (21 landmarks), the
// printed hand on the right copying it a beat later.
export function HandSyncArt({ className }: { className?: string }) {
  const you = useHandRoutine(0);
  const robot = useHandRoutine(280);
  return (
    <Sheet className={className} label="a hand tracked as 21 landmarks on the left, and a tendon-driven robot hand copying its pose on the right">
      <rect x="70" y="96" width="280" height="372" rx="18" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2.6" />
      <path d="M92 142 L92 118 L116 118 M304 118 L328 118 L328 142 M92 422 L92 446 L116 446 M304 446 L328 446 L328 422" {...ink} strokeWidth="2" opacity=".45" />
      <circle cx="306" cy="136" r="5" fill="var(--signal-red)" className="animate-pulse" />
      <g transform="translate(70.9 31.3) scale(1.15)"><HandGlyph pose={you} variant="skeleton" /></g>

      {["YOLOv8", "MediaPipe", "SmolVLA"].map((stage, i) => (
        <g key={stage}>
          <rect x="361" y={206 + i * 54} width="102" height="34" rx="17" fill="var(--background)" stroke="var(--foreground)" strokeWidth="1.8" />
          <text x="412" y={228 + i * 54} textAnchor="middle" fontSize="15" fontWeight="500" fill="var(--foreground)">{stage}</text>
          {i < 2 && <path d={`M412 ${243 + i * 54} L412 ${256 + i * 54} M407 ${251 + i * 54} L412 ${257 + i * 54} L417 ${251 + i * 54}`} {...ink} strokeWidth="1.8" />}
        </g>
      ))}
      <path d="M352 190 C380 176 440 176 470 190 M461 181 L471 190 L459 196" {...ink} strokeWidth="2" strokeDasharray="1 7" />

      <g transform="translate(450.9 -4.4) scale(1.15)"><HandGlyph pose={robot} /></g>
      <text x="210" y="520" {...caption}>your hand · 21 landmarks</text>
      <text x="590" y="520" {...caption}>its hand · 10 DOF, a beat later</text>
    </Sheet>
  );
}

// TensorTribe: speech most recognisers give up on goes in, a self-supervised
// encoder with small LoRA adapters listens, and plain words come out.
const bars = [18, 44, 26, 70, 12, 52, 88, 30, 16, 64, 40, 96, 22, 58, 34, 10, 46];

export function TensorTribeArt({ className }: { className?: string }) {
  return (
    <Sheet className={className} label="an uneven speech waveform passing through a transformer encoder with LoRA adapters and coming out as clear text">
      <path d="M78 150 H282 Q304 150 304 172 V372 Q304 394 282 394 H140 L96 430 L104 394 H78 Q56 394 56 372 V172 Q56 150 78 150 Z" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2.6" strokeLinejoin="round" />
      {bars.map((h, i) => (
        <line key={i} x1={78 + i * 12.6} x2={78 + i * 12.6} y1={272 - h / 2} y2={272 + h / 2} stroke="var(--foreground)" strokeWidth="5.5" strokeLinecap="round" opacity={i % 5 === 4 ? 0.3 : 1} className="animate-wave-bar" style={{ animationDelay: `${(i * 137) % 900}ms` }} />
      ))}
      <path d="M312 272 H336 M329 265 L337 272 L329 279" {...ink} />

      <text x="410" y="140" textAnchor="middle" fontSize="15" fontWeight="500" fill="var(--foreground)">SSL encoder</text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="350" y={156 + i * 56} width="120" height="44" rx="9" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2.2" />
          <path d={`M368 ${178 + i * 56} H452`} stroke="var(--foreground)" strokeWidth="1.4" opacity=".3" />
          <rect x="478" y={164 + i * 56} width="18" height="28" rx="5" fill="var(--cursor)" />
        </g>
      ))}
      <text x="487" y="146" textAnchor="middle" fontSize="20" className="font-hand" fill="var(--cursor)">LoRA</text>
      <rect x="376" y="392" width="68" height="30" rx="15" fill="var(--foreground)" />
      <text x="410" y="412" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--background)">CTC</text>
      <path d="M506 272 H530 M523 265 L531 272 L523 279" {...ink} />

      <rect x="542" y="186" width="206" height="172" rx="14" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2.6" />
      <text className="font-serif" fontSize="27" fontStyle="italic" fill="var(--foreground)">
        <tspan x="564" y="240">“i'd like</tspan>
        <tspan x="564" y="278">some water,</tspan>
        <tspan x="564" y="316">please.”</tspan>
      </text>
      <rect x="664" y="294" width="3" height="26" fill="var(--cursor)" className="animate-pulse" />

      <text x="180" y="490" {...caption}>what was said</text>
      <text x="645" y="490" {...caption}>what was meant</text>
    </Sheet>
  );
}

// Drug-interaction detection: medicines as a graph. Attention decides which
// neighbours matter (thicker lines), and the risky pair gets flagged.
const nodes: [number, number][] = [[150, 150], [300, 96], [470, 136], [650, 110], [210, 300], [380, 270], [570, 286], [690, 400], [300, 430], [490, 430], [104, 420]];
const edges: [number, number, number][] = [[0, 1, 2], [1, 2, 1.2], [2, 3, 2.6], [0, 4, 1.4], [1, 5, 3.2], [2, 5, 1.2], [2, 6, 2], [3, 6, 1], [4, 5, 1.4], [6, 7, 1.6], [4, 8, 1], [5, 8, 2.4], [5, 9, 1.2], [6, 9, 2.8], [8, 9, 1], [4, 10, 1.8], [8, 10, 1], [7, 9, 1]];
const RISKY: [number, number] = [5, 6];

export function DrugGraphArt({ className }: { className?: string }) {
  const [a, b] = [nodes[RISKY[0]]!, nodes[RISKY[1]]!];
  return (
    <Sheet className={className} label="a graph of medicines joined by lines of different weight, with one risky pair highlighted">
      {edges.map(([from, to, weight]) => (
        <line key={`${from}-${to}`} x1={nodes[from]![0]} y1={nodes[from]![1]} x2={nodes[to]![0]} y2={nodes[to]![1]} stroke="var(--foreground)" strokeWidth={weight * 1.5} strokeLinecap="round" opacity={0.25 + weight * 0.2} />
      ))}
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="var(--signal-red)" strokeWidth="7" strokeLinecap="round" className="animate-pulse" />
      {nodes.map(([x, y], i) => {
        const risky = RISKY.includes(i);
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r="25" fill="var(--background)" stroke={risky ? "var(--signal-red)" : "var(--foreground)"} strokeWidth={risky ? 4 : 2.6} />
            {/* a little capsule, half filled */}
            <g transform={`rotate(${-35 + ((i * 47) % 70)})`}>
              <line x1="-10" x2="10" stroke="var(--foreground)" strokeWidth="11" strokeLinecap="round" />
              <line x1="-10" x2="-1" stroke="var(--background)" strokeWidth="7" strokeLinecap="round" />
              <line x1="1" x2="10" stroke={i % 3 === 0 ? "var(--cursor)" : "var(--foreground)"} strokeWidth="7" strokeLinecap="round" />
            </g>
          </g>
        );
      })}
      <rect x="412" y="208" width="126" height="34" rx="17" fill="var(--signal-red)" />
      <text x="475" y="231" textAnchor="middle" fontSize="15" fontWeight="600" fill="white">interaction ⚠</text>
      <text x="400" y="514" {...caption}>which pairs shouldn't be taken together?</text>
    </Sheet>
  );
}
