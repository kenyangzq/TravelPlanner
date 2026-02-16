/**
 * TravelPlanner Web - Reviews Service
 *
 * Generates review search URLs for Google Reviews and RedNote (Xiaohongshu).
 * No API calls required - generates search URLs from existing location data.
 */

/**
 * Build Google Maps search URL for a place (shows reviews)
 * Prioritizes: address > name > coordinates
 * Address is highest priority because it's already found via location service
 */
export function buildGoogleReviewsURL(
  name?: string,
  address?: string,
  lat?: number,
  lng?: number
): string | null {
  if (!name && !address && (lat === undefined || lng === undefined)) {
    return null;
  }

  let query = "";

  // Use address + name if available (most precise - address from location service)
  if (address && name) {
    query = `${name} ${address}`;
  }
  // Use address only
  else if (address) {
    query = address;
  }
  // Fall back to name only
  else if (name) {
    query = name;
  }
  // Last resort: coordinates (just a point, might not be tied to business)
  else if (lat !== undefined && lng !== undefined) {
    query = `${lat},${lng}`;
  }

  if (!query) return null;

  const encoded = encodeURIComponent(query);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

/**
 * Build RedNote (Xiaohongshu) search URL for a place.
 * Uses xhsdiscover:// deep link to open the RedNote app directly on mobile.
 * The web URL (xiaohongshu.com) doesn't work well on mobile — it often
 * redirects to app download pages instead of showing search results.
 */
export function buildRedNoteSearchURL(
  placeName: string,
  cities: string[] = []
): string | null {
  if (!placeName) return null;

  let query = placeName;

  // Add first city for context if available
  if (cities.length > 0) {
    query += ` ${cities[0]}`;
  }

  const encoded = encodeURIComponent(query);
  return `xhsdiscover://search/result?keyword=${encoded}`;
}
