import type { AdminLevel, Selection } from "@/features/shared/types";
import { LEVEL_META, LEVEL_ORDER, isFilled } from "@/features/location-search/domain/levels";

export interface SummaryRow {
  level: AdminLevel;
  label: string;
  value: string;
  confidence: "confirmed" | "needs_confirmation" | "missing";
  aiAssisted: boolean;
}

export function buildSummary(selection: Selection): SummaryRow[] {
  return LEVEL_ORDER.map((level) => {
    const filled = isFilled(selection, level);
    const value =
      level === "village"
        ? (selection.village?.name ?? selection.villageFreeText ?? "")
        : (selection[level as Exclude<AdminLevel, "village">]?.name ?? "");
    const aiAssisted = selection.aiAssistedLevels.includes(level);
    return {
      level,
      label: LEVEL_META[level].label,
      value,
      confidence: !filled ? "missing" : aiAssisted ? "needs_confirmation" : "confirmed",
      aiAssisted,
    } satisfies SummaryRow;
  });
}

/** Plain text a student can paste or screenshot straight onto a HELB form. */
export function summaryToText(rows: SummaryRow[]): string {
  const lines = rows
    .filter((row) => row.value)
    .map((row) => `${row.label}: ${row.value}${row.aiAssisted ? " (verify)" : ""}`);
  return ["My location details (PataLocation)", ...lines].join("\n");
}

export function isComplete(rows: SummaryRow[]): boolean {
  return rows.every((row) => row.confidence !== "missing");
}
