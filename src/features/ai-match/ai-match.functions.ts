import { createServerFn } from "@tanstack/react-start";

import { aiMatchInputSchema } from "./domain/contract";
import { matchFreeText } from "./ai-match.server";

export const matchLocationFreeText = createServerFn({ method: "POST" })
  .inputValidator((data) => aiMatchInputSchema.parse(data))
  .handler(async ({ data }) => matchFreeText(data.query));
