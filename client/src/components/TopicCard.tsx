"use client";
import React from "react";
import Link from "next/link";
import ProgressBar from "./ui/ProgressBar";

export default function TopicCard({
  title,
  description,
  questionCount,
  progress,
  icon,
  href,
}: {
  title: string;
  description: string;
  questionCount: number;
  progress: number;
  icon: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-2 text-3xl">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
      <div className="mt-4">
        <ProgressBar value={progress} showLabel />
        <p className="mt-2 text-xs text-gray-500">{questionCount} questions</p>
      </div>
    </Link>
  );
}
