// Canonical dive taxonomies — the single source of truth for every
// difficulty / diving-type dropdown, filter, and form select. Kept as
// explicit ORDERED lists (never .sort()ed) so progression order survives:
// Intro → Open Water → Advanced → Rescue → Divemaster → Instructor.
export const DIVE_DIFFICULTIES = [
  "Intro",
  "Open Water",
  "Advanced",
  "Rescue",
  "Divemaster",
  "Instructor",
];

export const DIVING_TYPES = [
  "Scuba",
  "Intro Dive",
  "Fun Dive",
  "Training",
  "Freediver",
];

// Space-free keys for datasets that index by type (e.g. per-site
// breakdowns), mapped back to display labels.
export const DIVING_TYPE_KEYS = [
  "scuba",
  "introDive",
  "funDive",
  "training",
  "freediver",
] as const;

export type DivingTypeKey = (typeof DIVING_TYPE_KEYS)[number];

export const DIVING_TYPE_LABELS: Record<DivingTypeKey, string> = {
  scuba: "Scuba",
  introDive: "Intro Dive",
  funDive: "Fun Dive",
  training: "Training",
  freediver: "Freediver",
};
