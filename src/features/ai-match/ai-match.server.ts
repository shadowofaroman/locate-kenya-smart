/**
 * Server-only AI service. Wraps the LLM call behind a strict typed contract and
 * grounds it in candidate rows from the reference data.
 */
import { supabase } from "@/integrations/supabase/client";
import { aiMatchResultSchema, type AiMatchResult } from "./domain/contract";

const MODEL = "google/gemini-3.5-flash";
const ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface Candidate {
  label: string;
  path: Record<string, string | undefined>;
}

async function loadCandidates(query: string): Promise<Candidate[]> {
  const pattern = `%${query.replace(/[%_]/g, "").trim()}%`;
  const [wards, locations, subLocations, villages, institutions] = await Promise.all([
    supabase
      .from("wards")
      .select("name,constituencies(name,counties(name))")
      .ilike("name", pattern)
      .limit(10),
    supabase
      .from("locations")
      .select("name,wards(name,constituencies(name,counties(name)))")
      .ilike("name", pattern)
      .limit(10),
    supabase
      .from("sub_locations")
      .select("name,locations(name,wards(name,constituencies(name,counties(name))))")
      .ilike("name", pattern)
      .limit(10),
    supabase
      .from("villages")
      .select(
        "name,sub_locations(name,locations(name,wards(name,constituencies(name,counties(name)))))",
      )
      .ilike("name", pattern)
      .limit(10),
    supabase
      .from("institutions")
      .select("name,town,wards(name,constituencies(name,counties(name)))")
      .ilike("name", pattern)
      .limit(8),
  ]);

  const candidates: Candidate[] = [];

  for (const row of wards.data ?? []) {
    candidates.push({
      label: `ward ${row.name}`,
      path: {
        county: row.constituencies?.counties?.name,
        constituency: row.constituencies?.name,
        ward: row.name,
      },
    });
  }
  for (const row of locations.data ?? []) {
    candidates.push({
      label: `location ${row.name}`,
      path: {
        county: row.wards?.constituencies?.counties?.name,
        constituency: row.wards?.constituencies?.name,
        ward: row.wards?.name,
        location: row.name,
      },
    });
  }
  for (const row of subLocations.data ?? []) {
    candidates.push({
      label: `sub-location ${row.name}`,
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
    candidates.push({
      label: `village ${row.name}`,
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
  for (const row of institutions.data ?? []) {
    candidates.push({
      label: `institution ${row.name}${row.town ? ` (${row.town})` : ""}`,
      path: {
        county: row.wards?.constituencies?.counties?.name,
        constituency: row.wards?.constituencies?.name,
        ward: row.wards?.name,
      },
    });
  }

  return candidates;
}

const SYSTEM_PROMPT = `You help Kenyan students identify their administrative location for HELB, KUCCPS and NEMIS forms.
The hierarchy is: County > Constituency > Ward > Location > Sub-location > Village/Estate.
The user types something loose: a landmark, estate, market, town, school name or "near X".
Return 2 or 3 ranked possibilities. Never invent a single silent answer.
Rules:
- Prefer the supplied candidate rows from the reference data; set matchedFromData true for those.
- If no candidate fits, you may propose from general knowledge of Kenya, set matchedFromData false and lower confidence.
- Only fill a field you are reasonably sure about. Leave deeper fields out rather than guessing.
- reason must be one short sentence in plain English explaining why this match fits.
- confidence is 0..1.`;

export async function matchFreeText(query: string): Promise<AiMatchResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI service is not configured");

  const candidates = await loadCandidates(query);

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `User input: "${query}"\n\nCandidate rows from reference data (may be empty):\n${
            candidates.length
              ? candidates.map((c) => `- ${c.label}: ${JSON.stringify(c.path)}`).join("\n")
              : "(none)"
          }`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "location_match",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["interpretation", "suggestions"],
            properties: {
              interpretation: { type: "string" },
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["path", "confidence", "reason", "matchedFromData"],
                  properties: {
                    path: {
                      type: "object",
                      additionalProperties: false,
                      required: [
                        "county",
                        "constituency",
                        "ward",
                        "location",
                        "sub_location",
                        "village",
                      ],
                      properties: {
                        county: { type: ["string", "null"] },
                        constituency: { type: ["string", "null"] },
                        ward: { type: ["string", "null"] },
                        location: { type: ["string", "null"] },
                        sub_location: { type: ["string", "null"] },
                        village: { type: ["string", "null"] },
                      },
                    },
                    confidence: { type: "number" },
                    reason: { type: "string" },
                    matchedFromData: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI request failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned no content");

  const raw = JSON.parse(content) as unknown;
  const cleaned = stripNulls(raw);
  return aiMatchResultSchema.parse(cleaned);
}

/** The JSON schema requires all keys, so nulls come back for unknown fields. */
function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripNulls);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== null && item !== "")
        .map(([key, item]) => [key, stripNulls(item)]),
    );
  }
  return value;
}
