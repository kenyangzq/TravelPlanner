/**
 * TravelPlanner Web - Duration Picker Component
 *
 * 15-minute increment picker (for Restaurant/Activity).
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DurationPickerProps {
  value: number; // Duration in minutes
  onChange: (minutes: number) => void;
  className?: string;
}

const DURATION_OPTIONS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "1 hr 15 min", value: 75 },
  { label: "1 hr 30 min", value: 90 },
  { label: "2 hours", value: 120 },
  { label: "2 hr 30 min", value: 150 },
  { label: "3 hours", value: 180 },
  { label: "3 hr 30 min", value: 210 },
  { label: "4 hours", value: 240 },
];

const DurationPicker: React.FC<DurationPickerProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:ring-offset-gray-950 dark:focus-visible:ring-blue-500",
        className
      )}
    >
      {DURATION_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export { DurationPicker };
