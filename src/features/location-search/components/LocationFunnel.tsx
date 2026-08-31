import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { AdminLevel, AdminUnit, Selection } from "@/features/shared/types";
import { LEVEL_META, LEVEL_ORDER } from "../domain/levels";
import { confidenceFromScore } from "../domain/fuzzy";
import { SelectionBreadcrumb } from "./SelectionBreadcrumb";
import { LevelExplainer } from "./LevelExplainer";

interface Props {
  selection: Selection;
  currentLevel: AdminLevel | null;
  query: string;
  onQueryChange: (value: string) => void;
  options: { item: AdminUnit; score: number }[];
  isLoadingOptions: boolean;
  hasNoData: boolean;
  confirmedCount: number;
  onChoose: (level: AdminLevel, unit: AdminUnit) => void;
  onVillageFreeText: (value: string) => void;
  onEdit: (level: AdminLevel) => void;
  onReset: () => void;
}

export function LocationFunnel({
  selection,
  currentLevel,
  query,
  onQueryChange,
  options,
  isLoadingOptions,
  hasNoData,
  confirmedCount,
  onChoose,
  onVillageFreeText,
  onEdit,
  onReset,
}: Props) {
  const total = LEVEL_ORDER.length;

  return (
    <section className="surface-card p-5" aria-labelledby="funnel-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="funnel-heading" className="text-xl font-semibold">
            Step through your location
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {confirmedCount} of {total} fields confirmed
          </p>
        </div>
        {confirmedCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Start over
          </Button>
        )}
      </div>

      <Progress value={(confirmedCount / total) * 100} className="mt-4 h-2" />

      <div className="mt-4 border-t pt-4">
        <SelectionBreadcrumb selection={selection} onEdit={onEdit} />
      </div>

      {currentLevel ? (
        <div className="mt-5 space-y-3">
          <label htmlFor="level-input" className="block text-base font-semibold">
            {LEVEL_META[currentLevel].label}
          </label>
          <LevelExplainer level={currentLevel} />
          <Input
            id="level-input"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={LEVEL_META[currentLevel].placeholder}
            autoComplete="off"
            inputMode="search"
            className="h-12 text-base"
          />

          {isLoadingOptions && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Loading options…
            </p>
          )}

          {hasNoData && (
            <div className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm">
              <p className="font-medium">No records stored below this level yet.</p>
              <p className="mt-1 text-muted-foreground">
                Coverage is still being extended. Use the smart search above, or type your own
                {currentLevel === "village" ? " village" : " answer"} below.
              </p>
            </div>
          )}

          {!isLoadingOptions && options.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {options.map(({ item, score }) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onChoose(currentLevel, item)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-3 text-left text-base transition-colors hover:border-primary hover:bg-secondary"
                  >
                    <span>{item.name}</span>
                    {query.trim().length > 1 && (
                      <Badge
                        variant="outline"
                        className={
                          confidenceFromScore(score) === "likely"
                            ? "border-success text-success"
                            : "border-warning text-warning"
                        }
                      >
                        {confidenceFromScore(score) === "likely" ? "Likely" : "Check"}
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {currentLevel === "village" && (
            <div className="rounded-lg border border-dashed border-border p-3">
              <p className="text-sm font-medium">Not listed?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Villages and estates change often. Type yours exactly as you would write it on the
                form.
              </p>
              <Button
                className="mt-3"
                variant="secondary"
                disabled={query.trim().length < 2}
                onClick={() => onVillageFreeText(query.trim())}
              >
                Use “{query.trim() || "…"}” as my village
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-5 rounded-lg bg-success/10 px-3 py-3 text-sm font-medium text-success">
          All six fields are filled. Check your summary below before copying it onto your form.
        </p>
      )}
    </section>
  );
}
