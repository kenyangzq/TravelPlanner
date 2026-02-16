/**
 * TravelPlanner Web - Weather Badge Component
 *
 * Compact inline weather display: icon + high/low temp + rain% if >30%.
 */

"use client";

import * as React from "react";
import { Droplets } from "lucide-react";
import type { DayWeather } from "@/lib/models";

interface WeatherBadgeProps {
  weather: DayWeather;
}

export const WeatherBadge: React.FC<WeatherBadgeProps> = ({ weather }) => {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      {weather.iconUri ? (
        <img
          src={weather.iconUri}
          alt={weather.conditionDescription || "Weather"}
          className="w-5 h-5"
          loading="lazy"
        />
      ) : null}
      <span className="font-medium">
        {weather.tempHigh}/{weather.tempLow}&deg;C
      </span>
      {weather.precipitationProbability > 30 && (
        <span className="flex items-center gap-0.5 text-blue-500 dark:text-blue-400">
          <Droplets className="w-3 h-3" />
          {weather.precipitationProbability}%
        </span>
      )}
    </div>
  );
};
