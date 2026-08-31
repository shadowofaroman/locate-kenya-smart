import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { AdminLevel, AdminPath, AdminUnit } from "@/features/shared/types";
import { resolvePathByNames } from "@/features/location-search/data/administrative.repository";
import { matchLocationFreeText } from "../ai-match.functions";
import type { AiMatchResult } from "../domain/contract";

interface Props {
  onApply: (units: Partial<Record<AdminLevel, AdminUnit>>, aiAssisted: boolean) => void;
}

function pathSummary(path: AdminPath): string {
  return [path.county, path.constituency, path.ward, path.location, path.sub_location, path.village]
    .filter(Boolean)
    .join(" › ");
}

export function SmartSearch({ onApply }: Props) {
  const [term, setTerm] = useState("");
  const [result, setResult] = useState<AiMatchResult | null>(null);
  const runMatch = useServerFn(matchLocationFreeText);

  const match = useMutation({
    mutationFn: (query: string) => runMatch({ data: { query } }),
    onSuccess: (data) => setResult(data),
  });

  const apply = useMutation({
    mutationFn: async (path: AdminPath) => resolvePathByNames(path),
    onSuccess: (units) => onApply(units, true),
  });

  return (
    <section className="surface-card p-5" aria-labelledby="smart-search-heading">
      <h2 id="smart-search-heading" className="flex items-center gap-2 text-xl font-semibold">
        <Sparkles className="size-5 text-ai" aria-hidden />
        Not sure? Describe where you live
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A landmark, market, estate, school or “near Ruiru” is enough. You will always confirm the
        match yourself.
      </p>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (term.trim().length > 1) match.mutate(term.trim());
        }}
      >
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="e.g. near Kikuyu town, next to Alliance"
          className="h-12 text-base"
          inputMode="search"
        />
        <Button type="submit" className="h-12" disabled={match.isPending || term.trim().length < 2}>
          {match.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Find match"}
        </Button>
      </form>

      {match.isError && (
        <p className="mt-3 text-sm text-destructive">
          The matcher could not run just now. Try again, or use the step-by-step picker below.
        </p>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Reading your input as: </span>
            {result.interpretation}
          </p>
          {result.suggestions.length === 0 && (
            <p className="text-sm">No confident match. Try adding a nearby town or your county.</p>
          )}
          <ul className="space-y-2">
            {result.suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      suggestion.confidence >= 0.75
                        ? "border-success text-success"
                        : "border-warning text-warning"
                    }
                  >
                    {suggestion.confidence >= 0.75 ? "Likely match" : "Needs confirmation"}
                  </Badge>
                  <Badge variant="outline" className="border-ai text-ai">
                    {suggestion.matchedFromData ? "AI + stored data" : "AI suggestion only"}
                  </Badge>
                </div>
                <p className="mt-2 text-base font-medium">{pathSummary(suggestion.path)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{suggestion.reason}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  disabled={apply.isPending || !suggestion.path.county}
                  onClick={() => apply.mutate(suggestion.path)}
                >
                  Use this and continue
                </Button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            AI suggestions are not official records. Confirm each field before submitting a form.
          </p>
        </div>
      )}
    </section>
  );
}
