/**
 * TravelPlanner Web - Date Range Picker Component
 *
 * Calendar-based date range picker. Two-step selection: first click sets
 * start date, second click sets end date. Shows month grid with navigation.
 */

"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isBefore,
  isAfter,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onRangeChange: (start: string, end: string) => void;
  minDate?: string;
  maxDate?: string;
}

type SelectionPhase = "start" | "end";

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onRangeChange,
  minDate,
  maxDate,
}) => {
  const start = startDate ? parseISO(startDate) : null;
  const end = endDate ? parseISO(endDate) : null;
  const min = minDate ? parseISO(minDate) : undefined;
  const max = maxDate ? parseISO(maxDate) : undefined;

  const [currentMonth, setCurrentMonth] = useState<Date>(
    start || new Date()
  );
  const [phase, setPhase] = useState<SelectionPhase>(
    start && !end ? "end" : "start"
  );
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    const rows: Date[][] = [];
    let day = calStart;
    while (!isAfter(day, calEnd)) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      rows.push(week);
    }
    return rows;
  }, [currentMonth]);

  const isDisabled = (date: Date) => {
    if (min && isBefore(date, min)) return true;
    if (max && isAfter(date, max)) return true;
    return false;
  };

  const handleDayClick = (date: Date) => {
    if (isDisabled(date)) return;

    const dateStr = format(date, "yyyy-MM-dd");

    if (phase === "start") {
      onRangeChange(dateStr, "");
      setPhase("end");
    } else {
      // phase === "end"
      if (start && isBefore(date, start)) {
        // Clicked before start — reset to new start
        onRangeChange(dateStr, "");
        setPhase("end");
      } else {
        onRangeChange(startDate, dateStr);
        setPhase("start");
      }
    }
  };

  const isInRange = (date: Date) => {
    if (!start) return false;

    // If we have a complete range
    if (start && end) {
      return isWithinInterval(date, { start, end });
    }

    // If selecting end date and hovering
    if (phase === "end" && hoveredDate && !isBefore(hoveredDate, start)) {
      return isWithinInterval(date, { start, end: hoveredDate });
    }

    return false;
  };

  const isRangeStart = (date: Date) => start && isSameDay(date, start);
  const isRangeEnd = (date: Date) => end && isSameDay(date, end);

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="select-none">
      {/* Header with month/year and navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Selection hint */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-2">
        {phase === "start"
          ? "Select start date"
          : "Select end date"}
      </p>

      {/* Day names header */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((date, di) => {
              const inMonth = isSameMonth(date, currentMonth);
              const disabled = isDisabled(date);
              const rangeStart = isRangeStart(date);
              const rangeEnd = isRangeEnd(date);
              const inRange = isInRange(date);
              const isEndpoint = rangeStart || rangeEnd;

              return (
                <button
                  key={di}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDayClick(date)}
                  onMouseEnter={() => setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                  className={[
                    "relative py-1.5 text-sm text-center transition-colors",
                    // Disabled / out of month
                    disabled
                      ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                      : !inMonth
                        ? "text-gray-400 dark:text-gray-500"
                        : "text-gray-900 dark:text-gray-100",
                    // Range background (full cell width for continuous highlight)
                    inRange && !isEndpoint
                      ? "bg-blue-100 dark:bg-blue-900/40"
                      : "",
                    // Range start — round left side
                    rangeStart
                      ? "bg-blue-600 text-white rounded-l-full"
                      : "",
                    // Range end — round right side
                    rangeEnd && !rangeStart
                      ? "bg-blue-600 text-white rounded-r-full"
                      : "",
                    // Both start and end on same day
                    rangeStart && rangeEnd
                      ? "rounded-full"
                      : "",
                    // Hover when not disabled and not selected
                    !disabled && !isEndpoint
                      ? "hover:bg-gray-100 dark:hover:bg-gray-700"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {format(date, "d")}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Selected range display */}
      {start && (
        <div className="mt-2 text-xs text-center text-gray-600 dark:text-gray-400">
          {format(start, "MMM d, yyyy")}
          {end ? ` — ${format(end, "MMM d, yyyy")}` : " — ..."}
        </div>
      )}
    </div>
  );
};
