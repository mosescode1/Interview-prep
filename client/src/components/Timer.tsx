"use client";
import React from "react";
import Button from "./ui/Button";

export default function Timer({
  formatted,
  running,
  onToggle,
  onReset,
}: {
  formatted: string;
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-2xl tabular-nums text-gray-900">{formatted}</span>
      <Button size="sm" variant={running ? "secondary" : "primary"} onClick={onToggle}>
        {running ? "Pause" : "Start"}
      </Button>
      <Button size="sm" variant="secondary" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
