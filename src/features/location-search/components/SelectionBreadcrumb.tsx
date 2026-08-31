import type { AdminLevel, Selection } from "@/features/shared/types";
import { LEVEL_META, LEVEL_ORDER, isFilled } from "../domain/levels";
import { Badge } from "@/components/ui/badge";

interface Props {
  selection: Selection;
  onEdit: (level: AdminLevel) => void;
}

export function SelectionBreadcrumb({ selection, onEdit }: Props) {
  const filled = LEVEL_ORDER.filter((level) => isFilled(selection, level));
  if (!filled.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing selected yet. Start with your county below.
      </p>
    );
  }

  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm">
      {filled.map((level, index) => {
        const value =
          level === "village"
            ? (selection.village?.name ?? selection.villageFreeText)
            : selection[level as Exclude<AdminLevel, "village">]?.name;
        const isAi = selection.aiAssistedLevels.includes(level);
        return (
          <li key={level} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-muted-foreground">/</span>}
            <button
              type="button"
              onClick={() => onEdit(level)}
              className="rounded-md px-2 py-1 font-medium text-secondary-foreground transition-colors hover:bg-secondary"
            >
              <span className="block text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                {LEVEL_META[level].label}
              </span>
              {value}
            </button>
            {isAi && (
              <Badge variant="outline" className="border-ai text-ai">
                AI
              </Badge>
            )}
          </li>
        );
      })}
    </ol>
  );
}
