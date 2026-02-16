# Review Integration Feature - Implementation Plan

## Context
Users want to easily find reviews for places in their travel itinerary (restaurants, hotels, activities). The current app shows location links but doesn't provide quick access to reviews from popular platforms like Google Reviews and RedNote (Xiaohongshu).

This feature adds review search buttons to event rows, opening reviews in the browser (not embedded). Starting with Google Reviews and RedNote as requested.

## Implementation Approach

### Dynamic URL Generation (Recommended)
**No database changes, no API calls, zero cost**

Generate review URLs dynamically from existing location data:
- Google Reviews: `https://www.google.com/maps/search/?api=1&query=PLACE_NAME+ADDRESS`
- RedNote: `https://www.xiaohongshu.com/search_result?keyword=PLACE_NAME+CITY`

This follows the existing pattern used for `buildLocationSearchLink()` in `navigationLinks.ts`.

### Why This Approach?
✓ No database schema changes (no IndexedDB version bump)
✓ No API calls or additional keys needed
✓ Works offline
✓ URLs can't become stale
✓ Simple implementation following existing patterns

## Critical Files to Modify

### 1. Create: `/src/lib/services/reviewsService.ts`
New service for generating review URLs. Functions:
```typescript
buildGoogleReviewsURL(name, address, lat, lng): string | null
buildRedNoteSearchURL(placeName, cities): string | null
```

Priority: coordinates > address > name (same as current location link pattern)

### 2. Modify: `/src/lib/utils/navigationLinks.ts`
Add function to extract location data and build review URLs:
```typescript
buildReviewLinks(event: TripEvent, tripCities: string[]): {
  googleReviews: string | null,
  redNote: string | null
}
```

Follows same pattern as existing `buildLocationSearchLink()`

### 3. Modify: Event Row Components
Add review buttons alongside existing "View on Google Maps" link:

Files:
- `/src/components/itinerary/event-rows/restaurant-event-row.tsx`
- `/src/components/itinerary/event-rows/hotel-event-row.tsx`
- `/src/components/itinerary/event-rows/activity-event-row.tsx`
- `/src/components/itinerary/event-rows/car-rental-event-row.tsx` (optional)

Changes per file:
1. Add `tripCities` prop
2. Call `buildReviewLinks(event, tripCities)` in useMemo
3. Render review buttons if URLs exist

UI pattern:
```tsx
<div className="flex gap-2">
  <a href={locationURL}>View on Google Maps</a>
  {googleReviews && <a href={googleReviews}>Google Reviews</a>}
  {redNote && <a href={redNote}>RedNote</a>}
</div>
```

Icons: `Star` for Google Reviews, `Search` or `BookOpen` for RedNote

### 4. Modify: `/src/components/itinerary/list-view.tsx`
Extract trip cities and pass to event rows:
```tsx
const tripCities = trip ? parseCities(trip.citiesRaw) : [];
// Pass to DaySection
```

### 5. Modify: `/src/components/itinerary/day-section.tsx`
Accept `tripCities` prop and pass to event rows

### 6. Modify: `/src/components/itinerary/calendar-view.tsx`
Pass `tripCities` to event rows (same as list view)

## Event Type Support

**Supported (have location data):**
- Restaurant: restaurantName, restaurantAddress, coordinates
- Hotel: hotelName, hotelAddress, coordinates
- Activity: activityLocationName, coordinates

**Not supported:**
- Flight: Airports aren't reviewable places

**Optional:**
- Car Rental: Can search rental company location

## URL Generation Details

### Google Reviews URL
Uses Google Maps search (opens place page with reviews):
```
https://www.google.com/maps/search/?api=1&query=NAME+ADDRESS
```

Example for Marriott in Tokyo:
```
https://www.google.com/maps/search/?api=1&query=Marriott+Hotel+Tokyo
```

### RedNote Search URL
Uses RedNote search with place name + city for context:
```
https://www.xiaohongshu.com/search_result?keyword=NAME+CITY
```

Example:
```
https://www.xiaohongshu.com/search_result?keyword=Marriott%20Hotel%20Tokyo
```

## Implementation Order

1. Create `reviewsService.ts` with URL generation functions
2. Add `buildReviewLinks()` to `navigationLinks.ts`
3. Update `list-view.tsx` to extract and pass trip cities
4. Update `day-section.tsx` to accept and pass trip cities
5. Update one event row component (e.g., `restaurant-event-row.tsx`) as reference
6. Update remaining event rows (hotel, activity, car rental)
7. Update `calendar-view.tsx` to pass trip cities

## Testing

1. **URL Generation Tests**
   - Test with coordinates only
   - Test with address + name (no coordinates)
   - Test with name only
   - Test with no location data (should return null)

2. **UI Tests**
   - Verify review buttons appear when URLs exist
   - Verify buttons don't appear when no location data
   - Verify links open in new tab (target="_blank")
   - Verify stopPropagation on link clicks

3. **Integration Tests**
   - Create test trip with restaurant, hotel, activity
   - Verify Google Reviews link opens correct place
   - Verify RedNote link opens search results
   - Test on mobile responsive layout

## Verification

After implementation:
1. Run `npm run build` - should compile without errors
2. Run `npm run dev` - start local dev server
3. Create a trip with events (restaurant, hotel, activity)
4. Navigate to trip detail → List view
5. Verify "Google Reviews" and "RedNote" buttons appear below "View on Google Maps"
6. Click each button and verify it opens correct URL in new tab
7. Test with events that have no location data - verify buttons don't appear
8. Test on mobile viewport - verify responsive layout works

## Future Enhancements (Out of Scope)

- Google Places API integration for exact place_id lookup
- TripAdvisor, Yelp, OpenTable, Booking.com support
- Embedded review snippets (star ratings, review count)
- Manual review URL storage in database
- Review URL editing in event forms
