import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { LocationFunnel } from "@/features/location-search/components/LocationFunnel";
import { useLocationFunnel } from "@/features/location-search/hooks/useLocationFunnel";
import { SmartSearch } from "@/features/ai-match/components/SmartSearch";
import { InstitutionSearch } from "@/features/institution-search/components/InstitutionSearch";
import { SummaryCard } from "@/features/summary/components/SummaryCard";

const TITLE = "PataLocation — Find your county, ward, location & sub-location";
const DESCRIPTION =
  "Kenyan students: work out your exact county, constituency, ward, location, sub-location and village for HELB, KUCCPS and NEMIS forms. No login needed.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const funnel = useLocationFunnel();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-8">
      <header>
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
          <MapPin className="size-4" aria-hidden />
          PataLocation
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
          Get your location details right the first time
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Ward, location and sub-location are the fields most applicants leave blank or guess. Work
          them out here, then copy them onto your HELB, KUCCPS or NEMIS form.
        </p>
      </header>

      <div className="mt-8 space-y-6">
        <SmartSearch onApply={funnel.applySelection} />

        <LocationFunnel
          selection={funnel.selection}
          currentLevel={funnel.currentLevel}
          query={funnel.query}
          onQueryChange={funnel.setQuery}
          options={funnel.options}
          isLoadingOptions={funnel.isLoadingOptions}
          hasNoData={funnel.hasNoData}
          confirmedCount={funnel.confirmedCount}
          onChoose={funnel.choose}
          onVillageFreeText={funnel.setVillageFreeText}
          onEdit={funnel.editLevel}
          onReset={funnel.reset}
        />

        <InstitutionSearch onApply={funnel.applySelection} />

        <SummaryCard selection={funnel.selection} />

        <p className="text-center text-xs text-muted-foreground">
          Reference data is public administrative data and is still being extended county by county.
          Nothing you enter is saved, and no account is needed.
        </p>
      </div>
    </main>
  );
}
