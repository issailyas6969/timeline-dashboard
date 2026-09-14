# Footprint — Google Maps Timeline Dashboard

A dashboard that turns your Google Maps Timeline export into: a map of places you've visited (pins colored by category), a bar chart of visits by category, and a few original derived stats (distance traveled, "radius of life", novelty score, top routines).

## Getting your data

Google no longer offers a web-based Timeline export — you export straight from your phone:

- **Android**: Settings → Location → Location services → Timeline → Export Timeline data
- **iPhone**: Google Maps app → profile picture → Settings → Location & Privacy → Export Timeline data

This saves a `Timeline.json` file. (Some EU users get CSV instead — the parser here expects JSON.)

## Project structure

```
backend/     Express API — upload + parses Timeline.json, serves dashboard data
frontend/    React (Vite) — upload UI, map, chart, stats
```

## Running it

**Backend**
```bash
cd backend
npm install
npm run dev
```
Runs on http://localhost:4000

**Frontend** (separate terminal)
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173 and proxies `/api` to the backend.

Open http://localhost:5173, drop in your `Timeline.json`, and the dashboard builds itself.

## Adding photos to a place

Scroll to the "Photos" section on the dashboard, search for a place by name (or click a pin on the map and hit "Add photos" in its popup), then drag photos onto the upload box — or click it to open a file picker. Photos are stored on disk under `backend/uploads/photos/<place>/` and are never resized or sent anywhere else.

## How it works

- `backend/parser.js` — detects and normalizes both Timeline.json shapes: the current on-device export (`semanticSegments`) and the old Google Takeout export (`timelineObjects`)
- `backend/categorize.js` — buckets each visited place into a category (Food & Drink, Fitness, Shopping, etc.) using Google's own semantic type when available, otherwise keyword matching on the place name. There's a documented extension point to swap in the Google Places API for much better accuracy — see `fetchCategoryFromPlacesAPI()`
- `backend/stats.js` — dedupes visits into unique places and computes the dashboard aggregates: category counts, distance traveled, radius of life, novelty score, top routines
- `backend/store.js` — currently a flat JSON file on disk; swap for Postgres/SQLite if you want multi-user support later
- `backend/photoStore.js` + the `/api/places/:placeKey/photos` routes — per-place photo upload, listing, and deletion, stored as plain files under `backend/uploads/photos/`
- Data never leaves your machine — everything runs locally

## Ideas to extend it

- Wire up the Google Places API extension point in `categorize.js` for real place types instead of keyword guessing
- Add a date-range filter and a "this month vs last year" comparison view
- Animate the "radius of life" expanding over time
- Detect actual recurring routines (e.g. "every Tuesday") instead of just top visit counts
- Swap Leaflet for Google Maps JS API if you want Street View thumbnails on click
\




