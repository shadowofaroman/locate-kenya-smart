/**
 * Shared domain types. Pure data shapes — no UI, no data-access concerns.
 */

export type AdminLevel =
  | "county"
  | "constituency"
  | "ward"
  | "location"
  | "sub_location"
  | "village";

export interface AdminUnit {
  id: string;
  name: string;
  level: AdminLevel;
}

/** A unit plus its full ancestry, as names. */
export interface AdminPath {
  county?: string;
  constituency?: string;
  ward?: string;
  location?: string;
  sub_location?: string;
  village?: string;
}

export type Confidence = "likely" | "needs_confirmation";

export interface RankedMatch {
  /** The deepest unit this match resolves to. */
  level: AdminLevel;
  unitId: string | null;
  path: AdminPath;
  confidence: Confidence;
  /** Short human explanation of why this was suggested. */
  reason: string;
  /** Whether this came from stored reference data or from AI interpretation. */
  source: "reference_data" | "ai_suggestion";
  score: number;
}

export interface Institution {
  id: string;
  name: string;
  level: string;
  town: string | null;
  path: AdminPath;
}

/** What the user has confirmed so far. */
export interface Selection {
  county?: AdminUnit;
  constituency?: AdminUnit;
  ward?: AdminUnit;
  location?: AdminUnit;
  sub_location?: AdminUnit;
  village?: AdminUnit;
  /** Free-typed village / estate when it is not in the reference data. */
  villageFreeText?: string;
  /** Levels that were filled from an AI suggestion rather than picked from data. */
  aiAssistedLevels: AdminLevel[];
}
