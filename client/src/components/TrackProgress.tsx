"use client";
import React from "react";
import ProgressBar from "./ui/ProgressBar";

export default function TrackProgress({
  track,
  score,
  questionsAttempted,
}: {
  track: string;
  score: number;
  questionsAttempted: number;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-gray-900">{track}</span>
        <span className="text-gray-500">{questionsAttempted} attempted</span>
      </div>
      <ProgressBar value={score} showLabel />
    </div>
  );
}
