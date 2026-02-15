/**
 * TravelPlanner Web - Navigation Link Row Component
 *
 * Navigation link row displayed between events.
 * Shows link to next event or back to hotel.
 */

import * as React from "react";
import { ArrowRight, MapPin, ExternalLink } from "lucide-react";
import type { EventNavigationLink } from "@/lib/models";

interface NavigationLinkRowProps {
  navigationLink: EventNavigationLink;
  variant?: "toEvent" | "toHotel";
}

export const NavigationLinkRow: React.FC<NavigationLinkRowProps> = ({
  navigationLink,
  variant = "toEvent",
}) => {
  if (!navigationLink.directionsURL) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-2">
      <a
        href={navigationLink.directionsURL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        <MapPin className="w-4 h-4" />
        {variant === "toHotel" ? "Back to hotel" : "Navigate to"}{" "}
        {navigationLink.destinationLabel}
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};
