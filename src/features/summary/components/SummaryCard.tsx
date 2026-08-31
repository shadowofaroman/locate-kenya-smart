import { useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Selection } from "@/features/shared/types";
import { buildSummary, isComplete, summaryToText } from "../domain/format";

export function SummaryCard({ selection }: { selection: Selection }) {
  const rows = buildSummary(selection);
  const [copied, setCopied] = useState(false);
  const complete = isComplete(rows);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryToText(rows));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="surface-card p-5" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="text-xl font-semibold">
        Your form summary
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Copy or screenshot this, then write it exactly as shown on your HELB, KUCCPS or NEMIS form.
      </p>

      <dl className="mt-4 divide-y divide-border">
        {rows.map((row) => (
          <div key={row.level} className="flex items-start justify-between gap-3 py-2.5">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="flex flex-wrap items-center justify-end gap-2 text-right">
              <span className={row.value ? "text-base font-medium" : "text-sm text-muted-foreground"}>
                {row.value || "Not filled yet"}
              </span>
              {row.confidence === "confirmed" && (
                <Badge variant="outline" className="border-success text-success">
                  Confirmed
                </Badge>
              )}
              {row.confidence === "needs_confirmation" && (
                <Badge variant="outline" className="border-warning text-warning">
                  Needs confirmation
                </Badge>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {!complete && (
        <p className="mt-3 rounded-lg bg-secondary/70 px-3 py-2 text-sm text-secondary-foreground">
          Some fields are still empty. Blank location fields are the most common reason applications
          are sent back.
        </p>
      )}

      <Button className="mt-4 h-12 w-full" onClick={copy} disabled={rows.every((row) => !row.value)}>
        {copied ? (
          <>
            <Check className="size-4" aria-hidden /> Copied
          </>
        ) : (
          <>
            <ClipboardCopy className="size-4" aria-hidden /> Copy my details
          </>
        )}
      </Button>
    </section>
  );
}
