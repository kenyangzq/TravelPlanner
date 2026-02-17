# TravelPlanner TODO

## Completed Tasks

- [x] **Fix map view empty state**: Map and filter controls now remain visible when filtering by a date with no locations. Map centers on first trip city with an overlay message instead of disappearing. (Completed 2026-02-16)

- [x] **Map view improvements**: Added date filter to show locations for a specific day with clickable date buttons. Filtered out arrival airports that are not in the target cities. Reduced map marker dot size from scale 10 to scale 6 for better visibility. (Completed 2026-02-16)

- [x] **Google Places session token fix**: Updated `googlePlacesService.ts` to properly use Google Maps JavaScript API's `AutocompleteSessionToken` class instead of UUID-based tokens. Session tokens are now correctly passed to both `AutocompleteService.getPlacePredictions()` and `PlacesService.getDetails()` for proper billing per Google's requirements. (Completed 2026-02-16)

- [x] **Dynamic city images via Unsplash API with IndexedDB caching**: Replace hardcoded 60-city image map with Unsplash API for worldwide coverage. Cache results in IndexedDB so each city is fetched once. Keep hardcoded map as instant fallback (no network needed). Requires free Unsplash API key (`NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`). See `TravelPlanner-Web/PLAN-unsplash-images.md` for full plan. (Completed 2026-02-16)

- [x] **Review integration (Google Reviews + RedNote)**: Add review search buttons to event rows (restaurant, hotel, activity) that open Google Reviews and RedNote (Xiaohongshu) search in browser. Uses dynamic URL generation from existing location data (no API calls, no database changes). See `TravelPlanner-Web/PLAN-review-integration.md` for full plan. (Completed 2026-02-16)

## Pending Tasks

- [ ] **Upgrade to Next.js 15 + ESLint 9**: Eliminates npm deprecation warnings from `eslint@8`, `@humanwhocodes/*`, `glob`, `rimraf`, `inflight`, etc. Requires migrating to ESLint flat config and React 19. Warnings are cosmetic only — no build or runtime impact.
- [ ] **Update Azure SWA deployment workflow if needed**: After switching from static export to hybrid rendering (`output_location: ""`), verify the deployed site works correctly on Azure SWA. May need adjustments depending on SWA's Next.js hybrid support behavior.
