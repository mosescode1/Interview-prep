"use client";
import React from "react";
import Card from "./ui/Card";
import ProgressBar from "./ui/ProgressBar";

interface Evaluation {
  score: number;
  breakdown?: Record<string, number>;
  feedback: string;
  strengths?: string[];
  areas_to_improve?: string[];
}

export default function AIFeedback({ evaluation }: { evaluation: Evaluation }) {
  const { score, breakdown, feedback, strengths, areas_to_improve } = evaluation;
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <Card className="space-y-4">
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <h3 className="text-lg font-semibold">AI Feedback</h3>
          <span className="text-2xl font-bold">{score}/100</span>
        </div>
        <ProgressBar value={score} color={color} />
      </div>
      {breakdown && Object.keys(breakdown).length > 0 && (
        <div className="space-y-2">
          {Object.entries(breakdown).map(([k, v]) => (
            <div key={k}>
              <div className="flex justify-between text-sm text-gray-700">
                <span className="capitalize">{k.replace(/_/g, " ")}</span>
                <span>{v}</span>
              </div>
              <ProgressBar value={v} />
            </div>
          ))}
        </div>
      )}
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{feedback}</p>
      {strengths && strengths.length > 0 && (
        <div>
          <h4 className="font-medium text-green-700">Strengths</h4>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {areas_to_improve && areas_to_improve.length > 0 && (
        <div>
          <h4 className="font-medium text-orange-700">Areas to Improve</h4>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {areas_to_improve.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}
