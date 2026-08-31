/**
 * Pure fuzzy-matching helpers. No React, no database, no network.
 */

export function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/['`’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const NOISE = new Set([
  "near",
  "next",
  "to",
  "the",
  "of",
  "at",
  "in",
  "around",
  "my",
  "home",
  "place",
  "i",
  "think",
  "its",
  "it",
  "is",
  "am",
  "from",
  "somewhere",
  "county",
  "ward",
  "location",
  "sublocation",
  "sub",
  "estate",
  "village",
]);

export function tokens(value: string): string[] {
  return normalise(value)
    .split(" ")
    .filter((token) => token.length > 1 && !NOISE.has(token));
}

/** Levenshtein distance, capped for speed on short administrative names. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost);
    }
    previous = current;
  }
  return previous[b.length]!;
}

/** 0..1 similarity between a loose user phrase and a candidate name. */
export function similarity(query: string, candidate: string): number {
  const q = normalise(query);
  const c = normalise(candidate);
  if (!q || !c) return 0;
  if (q === c) return 1;
  if (c.startsWith(q) || q.startsWith(c)) return 0.92;
  if (c.includes(q) || q.includes(c)) return 0.85;

  const queryTokens = tokens(query);
  const candidateTokens = tokens(candidate);
  if (!queryTokens.length || !candidateTokens.length) return 0;

  let best = 0;
  for (const qt of queryTokens) {
    for (const ct of candidateTokens) {
      const distance = editDistance(qt, ct);
      const local = 1 - distance / Math.max(qt.length, ct.length);
      if (local > best) best = local;
    }
  }
  const overlap =
    queryTokens.filter((qt) => candidateTokens.includes(qt)).length /
    Math.max(queryTokens.length, candidateTokens.length);
  return Math.max(best * 0.8, overlap);
}

export interface Scored<T> {
  item: T;
  score: number;
}

/** Ranks candidates against a loose query, keeping only plausible matches. */
export function rankByName<T>(
  query: string,
  candidates: T[],
  getName: (item: T) => string,
  options: { limit?: number; minScore?: number } = {},
): Scored<T>[] {
  const { limit = 8, minScore = 0.34 } = options;
  if (!query.trim()) {
    return candidates.slice(0, limit).map((item) => ({ item, score: 0 }));
  }
  return candidates
    .map((item) => ({ item, score: similarity(query, getName(item)) }))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function confidenceFromScore(score: number): "likely" | "needs_confirmation" {
  return score >= 0.75 ? "likely" : "needs_confirmation";
}
