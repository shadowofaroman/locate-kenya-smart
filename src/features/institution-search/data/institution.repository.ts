/**
 * Data layer for institutions. Only this module queries the institutions table.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Institution } from "@/features/shared/types";

const SELECT =
  "id,name,level,town,counties(name),constituencies(name),wards(name,constituencies(name,counties(name)))";

type Row = {
  id: string;
  name: string;
  level: string;
  town: string | null;
  counties: { name: string } | null;
  constituencies: { name: string } | null;
  wards: { name: string; constituencies: { name: string; counties: { name: string } | null } | null } | null;
};

function toInstitution(row: Row): Institution {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    town: row.town,
    path: {
      county: row.counties?.name ?? row.wards?.constituencies?.counties?.name,
      constituency: row.constituencies?.name ?? row.wards?.constituencies?.name,
      ward: row.wards?.name,
    },
  };
}

/** Partial name matching, e.g. "Moi Girls" returns every school with that name. */
export async function searchInstitutions(term: string, limit = 15): Promise<Institution[]> {
  const query = term.trim();
  if (query.length < 2) return [];
  const { data, error } = await supabase
    .from("institutions")
    .select(SELECT)
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as unknown as Row[]).map(toInstitution);
}
