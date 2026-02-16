/**
 * Next.js API Route for Google Places Details
 *
 * Proxies requests to Google Places API to avoid CORS issues.
 * Client-side code cannot call Google Places directly due to CORS policy.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get('place_id');
  const sessiontoken = searchParams.get('sessiontoken');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  if (!placeId) {
    return NextResponse.json(
      { error: 'Missing place_id parameter' },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: apiKey,
      fields: 'place_id,geometry,name,formatted_address,address_components,photos,rating,types',
    });

    if (sessiontoken) {
      params.append('sessiontoken', sessiontoken);
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?${params}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Places Details API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place details' },
      { status: 500 }
    );
  }
}
