/**
 * Next.js API Route for Google Places Autocomplete
 *
 * Proxies requests to Google Places API to avoid CORS issues.
 * Client-side code cannot call Google Places directly due to CORS policy.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get('input');
  const sessiontoken = searchParams.get('sessiontoken');
  const location = searchParams.get('location');
  const radius = searchParams.get('radius');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  if (!input) {
    return NextResponse.json(
      { error: 'Missing input parameter' },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      input: input,
      key: apiKey,
      types: 'establishment',
    });

    if (sessiontoken) {
      params.append('sessiontoken', sessiontoken);
    }

    if (location) {
      params.append('location', location);
    }

    if (radius) {
      params.append('radius', radius);
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Places Autocomplete API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch places' },
      { status: 500 }
    );
  }
}
