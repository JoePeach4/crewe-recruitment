# Crewe Alexandra Recruitment Dashboard

A web app for managing and analyzing player scouting data — search players, review scout reports, and see AI-assisted verdict summaries and weighted ability ratings.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Supabase (PostgreSQL + REST API) as the data backend

## Setup

```bash
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_KEY in .env
npm run dev
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL (Project Settings → API) |
| `VITE_SUPABASE_KEY` | Supabase publishable/anon API key |

## Build & Deploy

```bash
npm run build    # type-checks and builds to dist/
npm run deploy    # builds, then publishes dist/ to the gh-pages branch
```

The app is deployed to GitHub Pages at [joepeach4.github.io/crewe-recruitment](https://joepeach4.github.io/crewe-recruitment/).

## Data Notes

- **Ability scale**: reports record playing level across 13 tiers (from "Below National League" up to "Premier League", including Upper/Lower sub-bands) — see `levelScores` in [`src/utils/calculations.ts`](src/utils/calculations.ts).
- **Verdicts**: scout verdicts are free text (e.g. "Sign for first team", "Watch again - ASAP") and are bucketed into Sign/Watch/Forget by prefix — see `getVerdictBucket` in the same file.
- **Syncing new reports**: run `python3 import_only_missing.py` from the data pipeline scripts, then refresh the page (triggered via the "Sync JotForm" button, which is a manual step, not automated in-browser).
