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


export const toSiteView = (s: any) => {
  const types: string[] =
    s.siteTypes ?? s.types ?? (s.type && s.type !== "—" ? [s.type] : []);
  return {
    _dbId: s._dbId,
    id: s.siteCode ?? s.id ?? "—",
    name: s.name,
    barangay: s.barangay ?? "—",
    depth: s.depthRange ?? s.depth ?? "—",
    difficulty: s.difficulty ?? "—",
    type: types[0] ?? "—",
    types,
    status: s.status,
    dives: s.dives ?? 0,
    description: s.description ?? "",
    photo: s.photo ?? null,
    photoPath: s.photoUrl ?? null,
    lat: s.lat,
    lng: s.lng,
    createdAt: s.createdAt ?? null,
  };
};
