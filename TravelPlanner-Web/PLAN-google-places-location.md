# Google Places Location Search - Implementation Plan

## Context
Currently using Nominatim (OpenStreetMap) for location search with city biasing. Switching to Google Places API for:
- Better integration with Google Reviews (exact place_id)
- Higher quality autocomplete/search
- Access to place photos, ratings, opening hours
- Consistent Google Maps ecosystem

**User provided API key:** `AIzaSyCysKeWE_V-HlCNY_IAO2r7IzePX4XrFJg`

## Current Implementation (Nominatim)

**File:** `src/lib/services/locationService.ts`

**Key functions:**
- `searchPlaces(query, cities)` - Search with city biasing
- `reverseGeocode(lat, lon)` - Coordinates to address
- `geocodeAirportCode(code)` - Airport lookup
- `buildFormattedAddress(address)` - Format address components
- `extractShortName(result)` - Get place name

**Features:**
- Rate limiting: 1 request/second
- City bounding box biasing (~50km radius)
- Deduplication by coordinate proximity (~100m)
- Returns array of LocationResult

## Google Places Implementation

### API Strategy

**Two API calls per location:**
1. **Places Autocomplete** - Get predictions as user types
   - Endpoint: `https://maps.googleapis.com/maps/api/place/autocomplete/json`
   - Parameters: `input`, `session_token`, `location` (bias), `radius`
   - Returns: predictions with `place_id`

2. **Places Details** - Get full place information
   - Endpoint: `https://maps.googleapis.com/maps/api/place/details/json`
   - Parameters: `place_id`, `session_token`, `fields`
   - Returns: coordinates, address, name, photos, ratings, etc.

**Session tokens:**
- Required for autocomplete (billing accuracy)
- Single token per search session
- Created when user starts typing
- Used in subsequent autocomplete calls + final details call
- Prevents duplicate charges

### Data Structure Mapping

**Nominatim LocationResult → Google Places:**

```typescript
// Current (Nominatim)
interface LocationResult {
  place_id: number;        // → Google's string place_id
  lat: string;             // → geometry.location.lat
  lon: string;             // → geometry.location.lng
  display_name: string;    // → name + formatted_address
  address: {               // → address_components
    name?: string;
    road?: string;
    city?: string;         // → locality (long_name)
    state?: string;        // → administrative_area_level_1
    country?: string;      // → country (long_name)
    postcode?: string;     // → postal_code
  };
}
```

```typescript
// New (Google Places)
interface GoogleLocationResult {
  place_id: string;           // Google place_id (string)
  lat: number;                // geometry.location.lat
  lng: number;                // geometry.location.lng
  name: string;               // name
  formatted_address: string;  // formatted_address
  address: {
    name?: string;            // extracted from components
    road?: string;            // route
    city?: string;            // locality
    state?: string;           // administrative_area_level_1
    country?: string;         // country
    postcode?: string;        // postal_code
  };
  photos?: GooglePhoto[];
  rating?: number;
  types?: string[];
}

interface GooglePhoto {
  photo_reference: string;
  height: number;
  width: number;
}
```

### Implementation Plan

#### Phase 1: Create Google Places Service

**New file:** `src/lib/services/googlePlacesService.ts`

**Functions to implement:**

1. **`createSessionToken()`**
   - Generates UUID for session token
   - Returns opaque token string

2. **`searchPlacesAutocomplete(query, sessionToken, cities)`**
   - Calls Places Autocomplete API
   - Uses `location` + `radius` for city biasing (if cities provided)
   - Returns predictions with `place_id` and description

3. **`getPlaceDetails(placeId, sessionToken)`**
   - Calls Places Details API
   - Request fields: `place_id,geometry,name,formatted_address,address_components,photos,rating,types`
   - Returns GoogleLocationResult

4. **`searchPlaces(query, cities)`**
   - Wraps autocomplete + details
   - For backwards compatibility, returns array of results
   - Creates session token, gets autocomplete predictions, fetches details for top 5

5. **`reverseGeocode(lat, lng)`**
   - Uses Geocoding API: `https://maps.googleapis.com/maps/api/geocode/json`
   - Parameters: `latlng` (as "lat,lng")
   - Returns single GoogleLocationResult

6. **`geocodeAirportCode(code)`**
   - Uses Places Text Search: `https://maps.googleapis.com/maps/api/place/textsearch/json`
   - Query: `{code} airport`
   - Returns top result

7. **`buildFormattedAddress(address)`**
   - Already compatible with Google address structure
   - No changes needed

8. **`extractShortName(result)`**
   - Use `name` field from Google Places
   - Simplified implementation

#### Phase 2: Update Forms to Use Session Tokens

**Files to modify:**
- `src/components/forms/restaurant-form.tsx`
- `src/components/forms/hotel-form.tsx`
- `src/components/forms/activity-form.tsx`
- `src/components/forms/car-rental-form.tsx`

**Changes:**
1. Add `sessionToken` state to each form
2. Create token when user focuses on location input
3. Pass token to search functions
4. When user selects a place, fetch details and pass token again

**Example flow:**
```tsx
const [sessionToken, setSessionToken] = useState<string | null>(null);

// On input focus
const handleLocationFocus = () => {
  if (!sessionToken) {
    setSessionToken(createSessionToken());
  }
};

// On search input
const handleSearchChange = async (query: string) => {
  const predictions = await searchPlacesAutocomplete(
    query,
    sessionToken,
    tripCities
  );
  setSearchResults(predictions);
};

// On place selection
const handlePlaceSelect = async (prediction: Prediction) => {
  const details = await getPlaceDetails(
    prediction.place_id,
    sessionToken!
  );
  applyToEvent(details);
  setSessionToken(null); // Clear for next search
};
```

#### Phase 3: Update Search Result Type

**New file:** `src/lib/models.ts` (add interface)

```typescript
// Google Places autocomplete prediction
export interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}
```

#### Phase 4: Update Location Search UI (Optional Enhancement)

**Current:** Text input + debounced search + dropdown

**Google Places recommendation:** Use Places Autocomplete with `<input>` element + Google JS library.

**Alternative (simpler):** Keep current UI, just call Google APIs instead of Nominatim.

**Decision:** Keep current UI for consistency, just swap API calls.

#### Phase 5: Replace Nominatim Service

**Option A:** Replace `locationService.ts` entirely
- Pros: Single source of truth
- Cons: Breaking change, need to update all imports

**Option B:** Create new `googlePlacesService.ts`, keep old as fallback
- Pros: Gradual migration, can A/B test
- Cons: More code to maintain

**Decision:** Option A - Replace entirely (same interface, just different API)

**Steps:**
1. Rename `locationService.ts` to `locationService.old.ts`
2. Create new `locationService.ts` with Google Places implementation
3. Keep same function signatures for backwards compatibility
4. Test all forms
5. Delete `locationService.old.ts` once verified

## API Key Configuration

**Same key for all Google Maps services:**
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCysKeWE_V-HlCNY_IAO2r7IzePX4XrFJg
```

**Already added to:** `.env.local`

**Note:** This single API key works for:
- Maps JavaScript API ✓ (for Map view)
- Places API ✓ (for location search + autocomplete)
- Places Details API ✓ (for place information)
- Geocoding API ✓ (for reverse geocoding)

**Enable APIs in Google Cloud Console:**
1. Maps JavaScript API ✓ (already enabled for Map view)
2. Places API ← Enable this for location search
3. Geocoding API ← Enable this for reverse geocoding

**No additional environment variables needed** - all services use `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## Pricing & Quotas

**Free tier:** $200/month credit

**Places API:**
- Autocomplete: $2.83 per 1000 calls
- Place Details: $5.31 per 1000 calls
- Text Search: $5.31 per 1000 calls

**Geocoding API:**
- $5.31 per 1000 calls

**Estimated usage (personal app):**
- 100 location searches per month
- Cost: ~$0.50-$1/month
- Well within free tier

**Session token benefits:**
- Autocomplete + Details bundled: $5.31 per 1000 sessions (not per call)
- Saves money vs billing each call separately

## Benefits Over Nominatim

1. **Exact place_id** - Direct link to Google Reviews page
2. **Better search quality** - Google's data is more comprehensive
3. **Rich place data** - Photos, ratings, opening hours available
4. **No rate limiting** - Nominatim requires 1 req/sec, Google is 100 req/sec
5. **Faster** - Google's infrastructure vs Nominatim's volunteer-run
6. **Global consistency** - Same quality worldwide

## Testing Checklist

- [ ] Restaurant location search with city bias
- [ ] Hotel location search with city bias
- [ ] Activity location search with city bias
- [ ] Car rental pickup location search
- [ ] Airport code geocoding (flight forms)
- [ ] Reverse geocoding (if used anywhere)
- [ ] Session token lifecycle (create → use → clear)
- [ ] Address formatting
- [ ] Place selection and data extraction
- [ ] Error handling (API failures, no results)
- [ ] Rate limiting behavior (if any)

## Files to Modify

1. **Create:** `src/lib/services/googlePlacesService.ts`
2. **Replace:** `src/lib/services/locationService.ts`
3. **Update:** All form components (restaurant, hotel, activity, car-rental)
4. **Update:** `.env.local` (already done)
5. **Update:** `CLAUDE.md` (document new service)
6. **Update:** GitHub Actions workflow (if needed for env var)

## Rollout Plan

1. ✅ Add API key to `.env.local`
2. ✅ Enable Places API + Geocoding API in Google Cloud Console
3. ⏳ Create `googlePlacesService.ts`
4. ⏳ Update forms to use session tokens
5. ⏳ Replace `locationService.ts`
6. ⏳ Test all forms locally
7. ⏳ Build and verify no errors
8. ⏳ Add GitHub secret for production
9. ⏳ Deploy and test in production
10. ⏳ Update HISTORY.md

## Post-Implementation Enhancements (Future)

1. **Place photos** - Display place photos in search results
2. **Place ratings** - Show star ratings in location search
3. **Opening hours** - Display business hours
4. **Place types filtering** - Filter by restaurant, hotel, etc.
5. **Recent places** - Cache recently used places
6. **Offline caching** - Cache popular places in IndexedDB
