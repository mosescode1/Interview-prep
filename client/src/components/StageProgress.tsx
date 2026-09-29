"use client";
import React from "react";

export default function StageProgress({
  stages,
  currentStage,
  completedStages,
}: {
  stages: string[];
  currentStage: string;
  completedStages: string[];
}) {
  return (
    <ol className="flex items-center">
      {stages.map((s, i) => {
        const done = completedStages.includes(s);
        const current = s === currentStage;
        return (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm ${
                  done
                    ? "border-green-500 bg-green-500 text-white"
                    : current
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white"
                }`}
              >
                {done ? "✓" : current ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
              </span>
              <span className={`text-xs ${current ? "font-semibold text-blue-600" : "text-gray-600"}`}>{s}</span>
            </div>
            {i < stages.length - 1 && (
              <div className={`mx-2 mb-5 h-0.5 flex-1 ${done ? "bg-green-500" : "bg-gray-300"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
