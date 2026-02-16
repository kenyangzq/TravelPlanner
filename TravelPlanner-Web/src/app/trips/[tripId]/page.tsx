/**
 * TravelPlanner Web - Trip Detail / Itinerary Page
 *
 * Server component wrapper for static export compatibility.
 * Delegates to client component for interactivity.
 */

import { TripDetailClient } from "./_components/trip-detail-client";

export function generateStaticParams() {
  return [{ tripId: '_' }];
}

interface PageProps {
  params: { tripId: string };
}

export default function TripDetailPage({ params }: PageProps) {
  return <TripDetailClient tripId={params.tripId} />;
}
