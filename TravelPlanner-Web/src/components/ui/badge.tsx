/**
 * TravelPlanner Web - Badge Component
 *
 * Status badges (for flight status, event types).
 * Port of iOS FlightStatusBadge.swift.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        primary:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        success:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        warning:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        danger:
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        purple:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        orange:
          "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Flight status badge with dynamic color based on status
export interface FlightStatusBadgeProps {
  status: string;
  className?: string;
}

export function FlightStatusBadge({
  status,
  className,
}: FlightStatusBadgeProps) {
  const getVariant = (status: string): BadgeProps["variant"] => {
    const s = status.toLowerCase();
    if (s.includes("on time") || s === "confirmed") return "success";
    if (s.includes("delayed") || s.includes("late")) return "warning";
    if (s.includes("cancelled")) return "danger";
    if (s.includes("boarding") || s.includes("departed")) return "primary";
    return "default";
  };

  return <Badge variant={getVariant(status)} className={className}>{status}</Badge>;
}

export { Badge, badgeVariants };
