import type { AdminLevel } from "@/features/shared/types";
import { LEVEL_META } from "../domain/levels";

export function LevelExplainer({ level }: { level: AdminLevel }) {
  return (
    <p className="rounded-lg bg-secondary/70 px-3 py-2 text-sm text-secondary-foreground">
      <span className="font-semibold">What is a {LEVEL_META[level].label.toLowerCase()}? </span>
      {LEVEL_META[level].explainer}
    </p>
  );
}
