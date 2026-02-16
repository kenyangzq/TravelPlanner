# TravelPlanner TODO

## Completed Tasks

- [x] **Dynamic city images via Unsplash API with IndexedDB caching**: Replace hardcoded 60-city image map with Unsplash API for worldwide coverage. Cache results in IndexedDB so each city is fetched once. Keep hardcoded map as instant fallback (no network needed). Requires free Unsplash API key (`NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`). See `TravelPlanner-Web/PLAN-unsplash-images.md` for full plan. (Completed 2026-02-16)

## Pending Tasks

- [x] **Review integration (Google Reviews + RedNote)**: Add review search buttons to event rows (restaurant, hotel, activity) that open Google Reviews and RedNote (Xiaohongshu) search in browser. Uses dynamic URL generation from existing location data (no API calls, no database changes). See `TravelPlanner-Web/PLAN-review-integration.md` for full plan. (Completed 2026-02-16)

- [ ] **Switch to Google Places for location search**: Replace Nominatim (OpenStreetMap) with Google Places API for better location search quality and exact place_id for review links. Uses same `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (already configured). Requires creating `googlePlacesService.ts` and updating forms to use session tokens. See `TravelPlanner-Web/PLAN-google-places-location.md` for full plan.

- [ ] **Upgrade to Next.js 15 + ESLint 9**: Eliminates npm deprecation warnings from `eslint@8`, `@humanwhocodes/*`, `glob`, `rimraf`, `inflight`, etc. Requires migrating to ESLint flat config and React 19. Warnings are cosmetic only — no build or runtime impact.
- [ ] **Update Azure SWA deployment workflow if needed**: After switching from static export to hybrid rendering (`output_location: ""`), verify the deployed site works correctly on Azure SWA. May need adjustments depending on SWA's Next.js hybrid support behavior.
