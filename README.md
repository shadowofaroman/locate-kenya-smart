# Kenya Location Finder

Lovable Prompt: HELB Location & Institution Finder

Copy everything below into Lovable's "Ask Lovable to build" box.

Build a web app called "PataLocation" (or similar) that helps Kenyan students and HELB applicants correctly identify their exact administrative location details — the information people most often get wrong or leave blank on HELB, KUCCPS, and NEMIS forms.

Core Problem to Solve

Many applicants know their county but not their constituency, ward, location, sub-location, or village — especially students applying from institutions far from home, or first-time applicants filling forms alone. This app narrows that gap through a guided, searchable, AI-assisted interface instead of static dropdowns.

Core Features

1. Progressive Location Narrowing (not flat dropdowns)

A guided funnel: County → Constituency → Ward → Location → Sub-location → Village/Estate

Each step filters the next based on the prior selection (cascading, not independent lists)

User can also free-type at any stage ("I think it's near Ruiru") and get fuzzy-matched suggestions instead of forcing an exact administrative term they don't know

Show a live breadcrumb of what's been selected so far

2. Smart Search Bar (AI-assisted)

A single search box where a user can type something loose — a landmark, an estate name, a market, a school name, "near X" — and the app returns the most likely matching administrative unit(s) with confidence, not just a generic county-level guess

Use an LLM call (via an edge function) to interpret ambiguous input and map it to the closest structured administrative match, then confirm with the user rather than auto-selecting

Always show 2-3 ranked suggestions with short "why this match" context, never a single silent guess

3. School/Institution Location Lookup

Separate search for the user's school (primary, secondary, or tertiary) that returns that institution's registered administrative location — useful when the applicant knows their school but not its formal location details

Support partial name matching (e.g., "Moi Girls" returns multiple schools with that name across counties, disambiguated by county/town)

4. Confidence & Verification Layer

Every suggestion is flagged as "Likely match" vs "Needs confirmation"

Include a short explainer per field (e.g., what a "sub-location" is vs a "ward") since this is exactly the terminology that trips people up

A final summary card the user can screenshot or copy directly into their HELB/KUCCPS form

5. Data Source Structure

Seed a structured Kenya administrative dataset: County → Constituency → Ward → Location → Sub-location (this is public data, structure it as relational tables, not hardcoded JSON blobs, so it can be corrected/extended later)

Separate table for institutions (schools/colleges/universities) with their registered location, linkable to the administrative hierarchy

Leave a clear extension point for crowd-sourced correction (users flagging wrong data) even if not built in v1

Architecture Requirements (Clean Architecture)

Presentation layer: React components only handle UI state and rendering — no business logic or direct data-fetching logic inside components

Domain/service layer: Pure functions/services for location-matching logic, fuzzy search scoring, and AI-response parsing, decoupled from UI and from the data layer

Data layer: Supabase (or equivalent) repository functions for querying counties/wards/institutions — components never call the database directly, always through this layer

AI layer: A dedicated service wrapping the LLM call (edge function) with a strict, typed input/output contract — return structured JSON (matched unit, confidence, alternatives), never freeform text into the UI

Keep folders organized by feature (/location-search, /institution-search, /summary) not by file type, so each feature is self-contained and testable in isolation

Design Direction

Theme: Greenish, calm, trustworthy — this should feel like a helpful civic tool, not a flashy consumer app. Think deep forest green primary, soft sage/mint accents, off-white or light cream backgrounds, high contrast for readability

Clean, uncluttered layout — one clear action per screen, generous spacing, minimal visual noise

Typography: clear, legible sans-serif, larger base font size (this app should be comfortable for users on low-end phones and slower connections)

Mobile-first — most applicants will use this on a phone, not a laptop

Subtle progress indicator showing how many location fields are confirmed

No dark patterns, no unnecessary animation — speed and clarity over flourish

Non-Functional Notes

Optimize for low-bandwidth use (compress data payloads, avoid heavy client-side bundles)

All AI-suggested matches must be clearly distinguishable from confirmed/verified data

No login required for basic use — this should work anonymously; save-to-account can be a later phase

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7f617b15-b0ff-4cb1-a89c-8e2e2ca23389).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
