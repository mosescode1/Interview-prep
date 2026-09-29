"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Question } from "@/lib/types";
import { toArray, cap } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { diffVariant } from "@/lib/utils";

const sel = "rounded-lg border border-gray-300 bg-white p-2 text-sm";

export default function TrackPage() {
  const { track } = useParams<{ track: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { track };
    if (subtopic) params.subtopic = subtopic;
    if (difficulty) params.difficulty = difficulty;
    if (level) params.level = level;
    api.listQuestions(params)
      .then((r) => setQuestions(toArray<Question>(r)))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [track, subtopic, difficulty, level]);

  const [subtopics, setSubtopics] = useState<string[]>([]);
  useEffect(() => {
    setSubtopics((prev) => [...new Set([...prev, ...questions.map((q) => q.subtopic).filter(Boolean)])].sort());
  }, [questions]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/tracks" className="text-sm text-blue-600 hover:underline">&larr; All tracks</Link>
        <h1 className="text-3xl font-bold">{cap(track)}</h1>
      </div>
      <div className="flex flex-wrap gap-3">
        <select className={sel} value={subtopic} onChange={(e) => setSubtopic(e.target.value)}>
          <option value="">All subtopics</option>
          {subtopics.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={sel} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">All difficulties</option>
          {["easy", "medium", "hard"].map((d) => <option key={d} value={d}>{cap(d)}</option>)}
        </select>
        <select className={sel} value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All levels</option>
          {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>Level {l}</option>)}
        </select>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Loading questions...</p>
      ) : questions.length === 0 ? (
        <p className="text-gray-500">No questions found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {questions.map((q) => (
            <Link key={q.id} href={`/tracks/${track}/${q.id}`} className="block rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <h3 className="font-medium text-gray-900">{q.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={diffVariant(q.difficulty)}>{q.difficulty}</Badge>
                <Badge variant="blue">Level {q.level}</Badge>
                <span className="text-xs text-gray-500">{q.subtopic}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
