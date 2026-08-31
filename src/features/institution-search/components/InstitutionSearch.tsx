import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { AdminLevel, AdminUnit } from "@/features/shared/types";
import { resolvePathByNames } from "@/features/location-search/data/administrative.repository";
import { searchInstitutions } from "../data/institution.repository";

interface Props {
  onApply: (units: Partial<Record<AdminLevel, AdminUnit>>, aiAssisted: boolean) => void;
}

export function InstitutionSearch({ onApply }: Props) {
  const [term, setTerm] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const results = useQuery({
    queryKey: ["institutions", submitted],
    queryFn: () => searchInstitutions(submitted),
    enabled: submitted.trim().length > 1,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <section className="surface-card p-5" aria-labelledby="institution-heading">
      <h2 id="institution-heading" className="flex items-center gap-2 text-xl font-semibold">
        <GraduationCap className="size-5 text-primary" aria-hidden />
        Look up your school or college
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Know the school but not its formal location? Search a partial name — matches are separated by
        county and town.
      </p>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(term.trim());
        }}
      >
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="e.g. Moi Girls"
          className="h-12 text-base"
          inputMode="search"
        />
        <Button type="submit" className="h-12" disabled={term.trim().length < 2}>
          Search
        </Button>
      </form>

      {results.isLoading && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Searching…
        </p>
      )}

      {results.data?.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          No institution stored under that name yet. Try a shorter name, or use the step-by-step
          picker.
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {(results.data ?? []).map((institution) => (
          <li key={institution.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-medium">{institution.name}</p>
              <Badge variant="secondary">{institution.level}</Badge>
              <Badge variant="outline" className="border-success text-success">
                Verified record
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {[institution.town, institution.path.ward, institution.path.constituency, institution.path.county]
                .filter(Boolean)
                .join(" › ")}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              disabled={applyingId === institution.id}
              onClick={async () => {
                setApplyingId(institution.id);
                try {
                  const units = await resolvePathByNames(institution.path);
                  onApply(units, false);
                } finally {
                  setApplyingId(null);
                }
              }}
            >
              Use this location
            </Button>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-muted-foreground">
        A school's location is not always your home location. Use this only if you are filling in
        your institution's details.
      </p>
    </section>
  );
}
