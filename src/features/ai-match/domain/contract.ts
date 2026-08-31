/**
 * Strict typed contract for the AI layer. The UI only ever sees this shape,
 * never freeform model text.
 */
import { z } from "zod";

export const aiPathSchema = z.object({
  county: z.string().optional(),
  constituency: z.string().optional(),
  ward: z.string().optional(),
  location: z.string().optional(),
  sub_location: z.string().optional(),
  village: z.string().optional(),
});

export const aiSuggestionSchema = z.object({
  path: aiPathSchema,
  /** 0..1 model-reported confidence. */
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  matchedFromData: z.boolean(),
});

export const aiMatchResultSchema = z.object({
  interpretation: z.string(),
  suggestions: z.array(aiSuggestionSchema).max(3),
});

export type AiPath = z.infer<typeof aiPathSchema>;
export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;
export type AiMatchResult = z.infer<typeof aiMatchResultSchema>;

export const aiMatchInputSchema = z.object({
  query: z.string().min(2).max(200),
});

export type AiMatchInput = z.infer<typeof aiMatchInputSchema>;
