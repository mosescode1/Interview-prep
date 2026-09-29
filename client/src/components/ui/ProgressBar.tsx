"use client";
import React from "react";

export default function ProgressBar({
  value,
  color = "bg-blue-500",
  className = "",
  showLabel = false,
}: {
  value: number;
  color?: string;
  className?: string;
  showLabel?: boolean;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${v}%` }} />
      </div>
      {showLabel && <span className="text-xs text-gray-600 w-10 text-right">{Math.round(v)}%</span>}
    </div>
  );
}
