export type WheelSegment = {
  label: string;
  value: string | null;
  probability: number;
};

// Order here defines the index that the server returns.
// Keep it in sync with any visual labels used by the wheel.
export const wheelSegments: WheelSegment[] = [
  { label: "No win", value: "none", probability: 0.2 },
  { label: "Paper", value: "paper", probability: 0.15 },
  { label: "Drink", value: "drink", probability: 0.15 },
  { label: "Pre-roll Orange", value: "preroll-orange", probability: 0.15 },
  { label: "Pre-roll Blue", value: "preroll-blue", probability: 0.15 },
  { label: "Pre-roll Yellow", value: "preroll-yellow", probability: 0.1 },
  { label: "Pre-roll Brown", value: "preroll-brown", probability: 0.1 }
];

export function pickWeightedOutcome(segments: WheelSegment[]): number {
  const total = segments.reduce((sum, seg) => sum + seg.probability, 0);
  if (total <= 0) {
    return 0;
  }

  const r = Math.random() * total;
  let acc = 0;

  for (let i = 0; i < segments.length; i++) {
    acc += segments[i].probability;
    if (r <= acc) {
      return i;
    }
  }

  return segments.length - 1;
}

