"use client";
import React from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";

export default function HintPanel({
  hints,
  hintsUsed,
  onRequestHint,
  loading = false,
}: {
  hints: string[];
  hintsUsed: number;
  onRequestHint: () => void;
  loading?: boolean;
}) {
  const shown = hints.slice(0, hintsUsed);
  return (
    <Card className="space-y-3">
      <h3 className="font-semibold text-gray-900">Hints ({hintsUsed}/{hints.length})</h3>
      {shown.map((h, i) => (
        <div key={i} className="rounded-lg bg-yellow-50 p-3 text-sm text-gray-800">
          <span className="font-medium">Hint {i + 1}: </span>{h}
        </div>
      ))}
      <Button variant="secondary" size="sm" loading={loading} disabled={hintsUsed >= hints.length} onClick={onRequestHint}>
        {hintsUsed >= hints.length ? "No more hints" : "Get a hint"}
      </Button>
    </Card>
  );
}
