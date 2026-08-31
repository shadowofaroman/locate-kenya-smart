import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { AdminLevel, AdminUnit, Selection } from "@/features/shared/types";
import { fetchChildren } from "../data/administrative.repository";
import { activeLevel, clearBelow, filledCount, LEVEL_ORDER, parentLevel } from "../domain/levels";
import { rankByName } from "../domain/fuzzy";

const EMPTY: Selection = { aiAssistedLevels: [] };

function parentId(selection: Selection, level: AdminLevel): string | undefined {
  const parent = parentLevel(level);
  if (!parent) return undefined;
  if (parent === "village") return selection.village?.id;
  return selection[parent as Exclude<AdminLevel, "village">]?.id;
}

/**
 * Holds funnel UI state and asks the data layer for the next level's options.
 * All matching/ordering logic lives in the domain layer.
 */
export function useLocationFunnel() {
  const [selection, setSelection] = useState<Selection>(EMPTY);
  const [query, setQuery] = useState("");

  const current = activeLevel(selection);
  const parent = current ? parentId(selection, current) : undefined;
  const enabled = Boolean(current && (current === "county" || parent));

  const optionsQuery = useQuery({
    queryKey: ["admin-options", current, parent],
    queryFn: () => fetchChildren(current!, parent),
    enabled,
    staleTime: 1000 * 60 * 60,
  });

  const options = useMemo(() => {
    const list = optionsQuery.data ?? [];
    return rankByName(query, list, (item) => item.name, { limit: 40, minScore: 0.3 });
  }, [optionsQuery.data, query]);

  const choose = useCallback(
    (level: AdminLevel, unit: AdminUnit) => {
      setSelection((previous) => {
        const base = clearBelow(previous, level);
        if (level === "village") {
          return { ...base, village: unit, villageFreeText: undefined };
        }
        return { ...base, [level]: unit };
      });
      setQuery("");
    },
    [],
  );

  const setVillageFreeText = useCallback((value: string) => {
    setSelection((previous) => ({ ...previous, village: undefined, villageFreeText: value }));
    setQuery("");
  }, []);

  const editLevel = useCallback((level: AdminLevel) => {
    setSelection((previous) => {
      const parentOf = parentLevel(level);
      return parentOf ? clearBelow(previous, parentOf) : EMPTY;
    });
    setQuery("");
  }, []);

  const applySelection = useCallback(
    (units: Partial<Record<AdminLevel, AdminUnit>>, aiAssisted: boolean) => {
      setSelection(() => {
        const next: Selection = { aiAssistedLevels: [] };
        for (const level of LEVEL_ORDER) {
          const unit = units[level];
          if (!unit) break;
          if (level === "village") next.village = unit;
          else next[level as Exclude<AdminLevel, "village">] = unit;
          if (aiAssisted) next.aiAssistedLevels.push(level);
        }
        return next;
      });
      setQuery("");
    },
    [],
  );

  const reset = useCallback(() => {
    setSelection(EMPTY);
    setQuery("");
  }, []);

  return {
    selection,
    currentLevel: current,
    query,
    setQuery,
    options,
    isLoadingOptions: optionsQuery.isLoading && enabled,
    hasNoData: enabled && !optionsQuery.isLoading && (optionsQuery.data ?? []).length === 0,
    confirmedCount: filledCount(selection),
    choose,
    setVillageFreeText,
    editLevel,
    applySelection,
    reset,
  };
}
