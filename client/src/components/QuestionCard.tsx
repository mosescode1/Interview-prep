"use client";
import React from "react";
import Link from "next/link";
import Badge from "./ui/Badge";

const diffColor: Record<string, "green" | "yellow" | "red"> = {
  easy: "green",
  medium: "yellow",
  hard: "red",
};
const levelClass: Record<number, string> = {
  1: "bg-gray-100 text-gray-800",
  2: "bg-blue-100 text-blue-800",
  3: "bg-yellow-100 text-yellow-800",
  4: "bg-orange-100 text-orange-800",
  5: "bg-red-100 text-red-800",
};

export default function QuestionCard({
  id,
  title,
  difficulty,
  level,
  track,
  questionType,
  status,
}: {
  id: string | number;
  title: string;
  difficulty: string;
  level: number;
  track: string;
  questionType: string;
  status?: "completed" | "unattempted";
}) {
  return (
    <Link
      href={`/tracks/${track}/${id}`}
      className="block rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-gray-900">{title}</h3>
        {status === "completed" && <span className="text-green-600">✓</span>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant={diffColor[difficulty.toLowerCase()] ?? "gray"}>{difficulty}</Badge>
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${levelClass[level] ?? levelClass[1]}`}>
          Level {level}
        </span>
        <span className="text-xs text-gray-500">{track}</span>
        <span className="text-xs text-gray-400">{questionType}</span>
      </div>
    </Link>
  );
}
