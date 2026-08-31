import type { AdminLevel, AdminPath, Selection } from "@/features/shared/types";

export interface LevelMeta {
  level: AdminLevel;
  label: string;
  /** Plain-language explainer — this terminology is what trips applicants up. */
  explainer: string;
  placeholder: string;
}

export const LEVEL_ORDER: AdminLevel[] = [
  "county",
  "constituency",
  "ward",
  "location",
  "sub_location",
  "village",
];

export const LEVEL_META: Record<AdminLevel, LevelMeta> = {
  county: {
    level: "county",
    label: "County",
    explainer:
      "One of Kenya's 47 counties, headed by a Governor. This is the largest unit on your form.",
    placeholder: "Type your county, e.g. Kiambu",
  },
  constituency: {
    level: "constituency",
    label: "Constituency",
    explainer:
      "The area represented by a Member of Parliament (MP). Counties have several constituencies.",
    placeholder: "Type your constituency, e.g. Kikuyu",
  },
  ward: {
    level: "ward",
    label: "Ward",
    explainer:
      "The area represented by an MCA (County Assembly member). Wards sit inside a constituency and are political, not administrative.",
    placeholder: "Type your ward, e.g. Kinoo",
  },
  location: {
    level: "location",
    label: "Location",
    explainer:
      "An administrative area headed by a Chief. This is not the same as a ward — HELB forms usually want both.",
    placeholder: "Type your location, e.g. Kinoo",
  },
  sub_location: {
    level: "sub_location",
    label: "Sub-location",
    explainer:
      "The smallest administrative area, headed by an Assistant Chief. It sits inside a location.",
    placeholder: "Type your sub-location, e.g. Muthiga",
  },
  village: {
    level: "village",
    label: "Village / Estate",
    explainer:
      "The village, estate or trading centre where your home is. If it is not listed, you can type it in yourself.",
    placeholder: "Type your village or estate",
  },
};

export function nextLevel(level: AdminLevel): AdminLevel | null {
  const index = LEVEL_ORDER.indexOf(level);
  return index >= 0 && index < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[index + 1]! : null;
}

export function parentLevel(level: AdminLevel): AdminLevel | null {
  const index = LEVEL_ORDER.indexOf(level);
  return index > 0 ? LEVEL_ORDER[index - 1]! : null;
}

/** The first level that still needs an answer. */
export function activeLevel(selection: Selection): AdminLevel | null {
  return LEVEL_ORDER.find((level) => !isFilled(selection, level)) ?? null;
}

export function isFilled(selection: Selection, level: AdminLevel): boolean {
  if (level === "village") {
    return Boolean(selection.village ?? selection.villageFreeText);
  }
  return Boolean(selection[level as Exclude<AdminLevel, "village">]);
}

export function filledCount(selection: Selection): number {
  return LEVEL_ORDER.filter((level) => isFilled(selection, level)).length;
}

export function selectionToPath(selection: Selection): AdminPath {
  return {
    county: selection.county?.name,
    constituency: selection.constituency?.name,
    ward: selection.ward?.name,
    location: selection.location?.name,
    sub_location: selection.sub_location?.name,
    village: selection.village?.name ?? selection.villageFreeText,
  };
}

/** Clears every level below the given one — cascading, so stale children never survive. */
export function clearBelow(selection: Selection, level: AdminLevel): Selection {
  const cutoff = LEVEL_ORDER.indexOf(level);
  const next: Selection = { aiAssistedLevels: [...selection.aiAssistedLevels] };
  LEVEL_ORDER.forEach((candidate, index) => {
    if (index > cutoff) return;
    if (candidate === "village") {
      next.village = selection.village;
      next.villageFreeText = selection.villageFreeText;
      return;
    }
    const key = candidate as Exclude<AdminLevel, "village">;
    next[key] = selection[key];
  });
  next.aiAssistedLevels = next.aiAssistedLevels.filter(
    (candidate) => LEVEL_ORDER.indexOf(candidate) <= cutoff,
  );
  return next;
}
