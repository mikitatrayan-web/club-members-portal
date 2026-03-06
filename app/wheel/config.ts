export type WheelSegment = {
  label: string;
  value: string | null;
  probability: number;
  /** Background fill for the wheel slice. */
  color: string;
  /** Label text color (defaults to white if not set). */
  labelColor?: string;
};

// Order here defines the index that the server returns.
// Keep it in sync with any visual labels used by the wheel.
export const wheelSegments: WheelSegment[] = [
  { label: "No prize",        value: "none",          probability: 0.2,  color: "#4b5563", labelColor: "#d1d5db" },
  { label: "Mascotte",        value: "mascotte",      probability: 0.15, color: "#c4a265", labelColor: "#1c1008" },
  { label: "Free Drink",      value: "drink",         probability: 0.15, color: "#0284c7", labelColor: "#e0f2fe" },
  { label: "Snack",           value: "snack",         probability: 0.1,  color: "#16a34a", labelColor: "#f0fdf4" },
  { label: "Pure Pre-roll",   value: "preroll-pure",   probability: 0.1,  color: "#e11d48", labelColor: "#fff1f2" },
  { label: "Blue Pre-roll",   value: "preroll-blue",   probability: 0.1,  color: "#4f46e5", labelColor: "#eef2ff" },
  { label: "Yellow Pre-roll", value: "preroll-yellow", probability: 0.1,  color: "#ca8a04", labelColor: "#fefce8" },
  { label: "Orange Pre-roll", value: "preroll-orange", probability: 0.1,  color: "#ea580c", labelColor: "#fff7ed" }
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

