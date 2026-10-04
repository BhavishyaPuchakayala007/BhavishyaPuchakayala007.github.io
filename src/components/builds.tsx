import { type ComponentType } from "react";

import { DrugGraphArt, HandSyncArt, TensorTribeArt } from "@/components/project-art";
import { cn } from "@/lib/utils";

// The three builds, each told twice: once so anyone can follow it, and once in
// the real terms for the people who will check. The home page and the notebook
// both read from here.
export type Build = {
  title: string;
  tags: string[];
  status?: string;
  Art: ComponentType<{ className?: string }>;
  // a few words, for the notebook's cards
  short: string;
  // what it does, in one plain sentence
  simple: string;
  // why that's harder than it sounds
  hard: string;
  // how it works, in order: what happens in plain words, then what it's called
  steps: { plain: string; tech: string }[];
  // what I did on it
  role: string;
  // the terms an engineer scans for
  stack: string[];
  // one joke
  aside: string;
  // one dense paragraph, for search engines
  summary: string;
  link?: string;
  code?: string;
};

export const builds: Build[] = [
  {
    title: "HandSync",
    tags: ["Physical AI", "Robotics"],
    Art: HandSyncArt,
    short: "a robot hand that copies yours.",
    simple: "you move your hand, and a robot hand copies it. no glove, no sensors on you. just a webcam.",
    hard: "a camera only sees a flat picture. a robot hand needs to know exactly how far to bend each joint. turning one into the other fast enough to feel instant is the whole project.",
    steps: [
      { plain: "find the hand in the picture and mark it up.", tech: "YOLOv8 with MediaPipe on a single RGB camera (no depth sensor): 21 hand landmarks per frame" },
      { plain: "work out how bent each finger is.", tech: "finger joint kinematics inferred from the landmark geometry" },
      { plain: "tell the motors how far to pull.", tech: "landmarks mapped to low-latency actuator commands for a 10-DOF, tendon-driven, 3D-printed hand" },
      { plain: "start teaching it to act on instructions, not just imitate.", tech: "SmolVLA adapted to prototype vision-language-action policies that link perception to control" },
    ],
    role: "built the pipeline from camera to fingertip, then tuned it end to end so it holds up in real time.",
    stack: ["YOLOv8", "MediaPipe", "monocular RGB", "joint kinematics", "tendon-driven actuation", "10 DOF", "SmolVLA", "real-time control"],
    aside: "it also copies you when you wave it goodbye. slightly unsettling.",
    summary: "a physical AI pipeline for real-time robotic hand teleoperation. YOLOv8 and MediaPipe read 21 hand landmarks from a single RGB webcam and infer the finger joint angles; those become low-latency actuator commands for a 10-DOF, tendon-driven, 3D-printed hand. on top of that i adapted SmolVLA to prototype vision-language-action policies, so perception can turn into action. built at IIT Madras.",
  },
  {
    title: "TensorTribe",
    tags: ["Speech AI", "Assistive tech"],
    status: "in progress",
    Art: TensorTribeArt,
    short: "speech AI for the voices models ignore.",
    simple: "speech recognition for the people speech recognition usually fails.",
    hard: "dysarthria makes speech slurred or uneven, so assistants trained on typical voices mishear it. and there is very little recorded dysarthric speech to learn from, so “just train a bigger model” isn't an option.",
    steps: [
      { plain: "clean up every recording first.", tech: "voice activity detection, silence trimming, adaptive noise reduction, volume and transcript normalisation, speaker-aware dataset curation" },
      { plain: "start from a model that already understands speech in general.", tech: "self-supervised acoustic representations feeding a transformer ASR" },
      { plain: "teach it this kind of speech by adjusting a small part of it, not all of it.", tech: "parameter-efficient fine-tuning (LoRA), CTC, speaker-independent domain adaptation" },
      { plain: "measure it honestly, then make it quick enough to use.", tech: "WER and CER-driven evaluation, mixed-precision training, learning-rate scheduling, checkpointing, deployment-oriented inference" },
    ],
    role: "architecting the platform: the data pipeline, the training setup and the evaluation.",
    stack: ["self-supervised speech models", "transformer ASR", "LoRA / PEFT", "CTC", "domain adaptation", "VAD", "WER / CER", "mixed precision"],
    aside: "“sorry, i didn't catch that” is not an acceptable answer.",
    summary: "an assistive communication platform for dysarthric speech, the kind most speech recognisers give up on. i'm adapting self-supervised acoustic encoders and transformer ASR with LoRA and CTC, behind a preprocessing pipeline (voice activity detection, silence trimming, noise reduction, normalisation) and WER/CER-driven evaluation. in progress at IIT Madras.",
  },
  {
    title: "Drug-interaction graphs",
    tags: ["Graph ML", "Healthcare"],
    Art: DrugGraphArt,
    short: "which medicines shouldn't meet.",
    simple: "a model that warns you when two medicines shouldn't be taken together.",
    hard: "there are far too many possible pairs to test each one in a lab. but medicines aren't isolated: what one already reacts with says a lot about what else it might.",
    steps: [
      { plain: "draw every medicine as a point, and every known interaction as a line between two points.", tech: "drugs as nodes and interactions as edges in a graph" },
      { plain: "let each medicine learn from the ones it's connected to, paying most attention to the ones that matter.", tech: "attention-based graph network: learned attention weights over each node's neighbours" },
      { plain: "ask about any pair and get an answer straight away.", tech: "classifiers on top, aimed at real-time, low-cost, high-accuracy prediction" },
    ],
    role: "built as a team of two. it placed 3rd among the 2025 freshman batch at Problem Statement Maker 2026. what stayed with me was how much clearer the engineering got once the problem was scoped properly.",
    stack: ["graph neural networks", "attention", "classification", "drug-drug interaction", "problem scoping"],
    aside: "the pharmacist's “wait, you're taking what with what?”, as software.",
    summary: "attention-based graph networks and classifiers that detect drug interactions, aiming for real-time, low-cost, high-accuracy predictions. built as a team of two; it placed 3rd among the 2025 freshman batch at Problem Statement Maker 2026. what stayed with me wasn't the result. it was how much clarity comes from scoping the problem properly first.",
  },
];

// The four headings every build's story is told under. Change one here and it
// changes on all three builds, on both pages.
const HEADINGS = {
  hard: "the constraint that bites back",
  steps: "how i got around it, in order",
  role: "my fingerprints on it",
  stack: "receipts, for the engineers",
};

// A build, explained: why it's hard, how it works step by step (plain words
// first, the proper terms underneath), what I did, and the stack. `dark` is for
// the notebook page.
export function BuildStory({ build, dark = false }: { build: Build; dark?: boolean }) {
  const label = cn("text-xs uppercase tracking-[0.14em]", dark ? "text-white/50" : "text-muted-foreground");
  const quiet = dark ? "text-white/55" : "text-muted-foreground";
  return (
    <div className={cn("max-w-2xl text-[0.95rem] leading-snug", dark && "text-white/85")}>
      <dl className="grid gap-5">
        <div>
          <dt className={label}>{HEADINGS.hard}</dt>
          <dd className="mt-1">{build.hard}</dd>
        </div>
        <div>
          <dt className={label}>{HEADINGS.steps}</dt>
          <dd>
            <ol className="mt-2 grid gap-3">
              {build.steps.map((step, index) => (
                <li key={step.plain} className="grid grid-cols-[1.5rem_minmax(0,1fr)]">
                  <span className={cn("font-hand text-[1.05rem]", dark ? "text-[oklch(0.78_0.13_252)]" : "text-cursor-border")}>{index + 1}.</span>
                  <span>
                    <span className="block">{step.plain}</span>
                    <span className={cn("mt-0.5 block text-sm", quiet)}>{step.tech}</span>
                  </span>
                </li>
              ))}
            </ol>
          </dd>
        </div>
        <div>
          <dt className={label}>{HEADINGS.role}</dt>
          <dd className="mt-1">{build.role}</dd>
        </div>
        <div>
          <dt className={label}>{HEADINGS.stack}</dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {build.stack.map((term) => (
              <span key={term} className={cn("rounded-full border px-2.5 py-1 text-xs", dark ? "border-white/20 text-white/70" : "border-border")}>{term}</span>
            ))}
          </dd>
        </div>
      </dl>
      <p className={cn("mt-5 -rotate-1 font-hand text-[1.1rem] tracking-[0.06em]", dark ? "text-[oklch(0.78_0.13_252)]" : "text-cursor-border")}>↳ {build.aside}</p>
    </div>
  );
}
