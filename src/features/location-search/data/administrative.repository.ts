/**
 * Data layer. The ONLY place that talks to the database for administrative units.
 * UI components must never import the database client directly.
 */
import { supabase } from "@/integrations/supabase/client";
import type { AdminLevel, AdminPath, AdminUnit } from "@/features/shared/types";

function toUnits(
  rows: { id: string; name: string }[] | null,
  level: AdminLevel,
): AdminUnit[] {
  return (rows ?? []).map((row) => ({ id: row.id, name: row.name, level }));
}

export async function fetchCounties(): Promise<AdminUnit[]> {
  const { data, error } = await supabase
    .from("counties")
    .select("id,name")
    .order("name");
  if (error) throw error;
  return toUnits(data, "county");
}

export async function fetchConstituencies(countyId: string): Promise<AdminUnit[]> {
  const { data, error } = await supabase
    .from("constituencies")
    .select("id,name")
    .eq("county_id", countyId)
    .order("name");
  if (error) throw error;
  return toUnits(data, "constituency");
}

export async function fetchWards(constituencyId: string): Promise<AdminUnit[]> {
  const { data, error } = await supabase
    .from("wards")
    .select("id,name")
    .eq("constituency_id", constituencyId)
    .order("name");
  if (error) throw error;
  return toUnits(data, "ward");
}

export async function fetchLocations(wardId: string): Promise<AdminUnit[]> {
  const { data, error } = await supabase
    .from("locations")
    .select("id,name")
    .eq("ward_id", wardId)
    .order("name");
  if (error) throw error;
  return toUnits(data, "location");
}

export async function fetchSubLocations(locationId: string): Promise<AdminUnit[]> {
  const { data, error } = await supabase
    .from("sub_locations")
    .select("id,name")
    .eq("location_id", locationId)
    .order("name");
  if (error) throw error;
  return toUnits(data, "sub_location");
}

export async function fetchVillages(subLocationId: string): Promise<AdminUnit[]> {
  const { data, error } = await supabase
    .from("villages")
    .select("id,name")
    .eq("sub_location_id", subLocationId)
    .order("name");
  if (error) throw error;
  return toUnits(data, "village");
}

/** Children of the given parent unit, or counties when there is no parent. */
export function fetchChildren(level: AdminLevel, parentId?: string): Promise<AdminUnit[]> {
  if (level === "county") return fetchCounties();
  if (!parentId) return Promise.resolve([]);
  switch (level) {
    case "constituency":
      return fetchConstituencies(parentId);
    case "ward":
      return fetchWards(parentId);
    case "location":
      return fetchLocations(parentId);
    case "sub_location":
      return fetchSubLocations(parentId);
    case "village":
      return fetchVillages(parentId);
    default:
      return Promise.resolve([]);
  }
}

export interface AdminUnitWithPath extends AdminUnit {
  path: AdminPath;
}

/**
 * Loose lookup used by the smart search: matches ward, location, sub-location
 * and village names and returns them with their full ancestry.
 */
export async function searchUnitsByName(term: string, limit = 12): Promise<AdminUnitWithPath[]> {
  const pattern = `%${term.trim()}%`;
  if (term.trim().length < 2) return [];

  const [wards, locations, subLocations, villages, counties] = await Promise.all([
    supabase
      .from("wards")
      .select("id,name,constituencies(name,counties(name))")
      .ilike("name", pattern)
      .limit(limit),
    supabase
      .from("locations")
      .select("id,name,wards(name,constituencies(name,counties(name)))")
      .ilike("name", pattern)
      .limit(limit),
    supabase
      .from("sub_locations")
      .select("id,name,locations(name,wards(name,constituencies(name,counties(name))))")
      .ilike("name", pattern)
      .limit(limit),
    supabase
      .from("villages")
      .select(
        "id,name,sub_locations(name,locations(name,wards(name,constituencies(name,counties(name)))))",
      )
      .ilike("name", pattern)
      .limit(limit),
    supabase.from("counties").select("id,name").ilike("name", pattern).limit(limit),
  ]);

  const results: AdminUnitWithPath[] = [];

  for (const row of counties.data ?? []) {
    results.push({ id: row.id, name: row.name, level: "county", path: { county: row.name } });
  }
  for (const row of wards.data ?? []) {
    results.push({
      id: row.id,
      name: row.name,
      level: "ward",
      path: {
        county: row.constituencies?.counties?.name,
        constituency: row.constituencies?.name,
        ward: row.name,
      },
    });
  }
  for (const row of locations.data ?? []) {
    results.push({
      id: row.id,
      name: row.name,
      level: "location",
      path: {
        county: row.wards?.constituencies?.counties?.name,
        constituency: row.wards?.constituencies?.name,
        ward: row.wards?.name,
        location: row.name,
      },
    });
  }
  for (const row of subLocations.data ?? []) {
    results.push({
      id: row.id,
      name: row.name,
      level: "sub_location",
      path: {
        county: row.locations?.wards?.constituencies?.counties?.name,
        constituency: row.locations?.wards?.constituencies?.name,
        ward: row.locations?.wards?.name,
        location: row.locations?.name,
        sub_location: row.name,
      },
    });
  }
  for (const row of villages.data ?? []) {
    const location = row.sub_locations?.locations;
    results.push({
      id: row.id,
      name: row.name,
      level: "village",
      path: {
        county: location?.wards?.constituencies?.counties?.name,
        constituency: location?.wards?.constituencies?.name,
        ward: location?.wards?.name,
        location: location?.name,
        sub_location: row.sub_locations?.name,
        village: row.name,
      },
    });
  }

  return results;
}

/** Resolves a name-only path (e.g. from AI) into concrete units, top-down. */
export async function resolvePathByNames(path: AdminPath): Promise<Partial<Record<AdminLevel, AdminUnit>>> {
  const resolved: Partial<Record<AdminLevel, AdminUnit>> = {};
  if (!path.county) return resolved;

  const counties = await fetchCounties();
  const county = counties.find(
    (item) => item.name.toLowerCase() === path.county!.toLowerCase(),
  );
  if (!county) return resolved;
  resolved.county = county;

  if (path.constituency) {
    const list = await fetchConstituencies(county.id);
    const match = list.find((i) => i.name.toLowerCase() === path.constituency!.toLowerCase());
    if (!match) return resolved;
    resolved.constituency = match;

    if (path.ward) {
      const wards = await fetchWards(match.id);
      const ward = wards.find((i) => i.name.toLowerCase() === path.ward!.toLowerCase());
      if (!ward) return resolved;
      resolved.ward = ward;

      if (path.location) {
        const locations = await fetchLocations(ward.id);
        const location = locations.find(
          (i) => i.name.toLowerCase() === path.location!.toLowerCase(),
        );
        if (!location) return resolved;
        resolved.location = location;

        if (path.sub_location) {
          const subs = await fetchSubLocations(location.id);
          const sub = subs.find(
            (i) => i.name.toLowerCase() === path.sub_location!.toLowerCase(),
          );
          if (!sub) return resolved;
          resolved.sub_location = sub;

          if (path.village) {
            const villages = await fetchVillages(sub.id);
            const village = villages.find(
              (i) => i.name.toLowerCase() === path.village!.toLowerCase(),
            );
            if (village) resolved.village = village;
          }
        }
      }
    }
  }
  return resolved;
}

export async function reportDataProblem(input: {
  entityType: string;
  entityId?: string;
  suggestedName?: string;
  message: string;
}): Promise<void> {
  const { error } = await supabase.from("data_reports").insert({
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    suggested_name: input.suggestedName ?? null,
    message: input.message,
  });
  if (error) throw error;
}
