"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { TRACKS, cap, type Rec } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const MODES = [
  { id: "quick", title: "Quick", count: 5, text: "5 questions, no pressure.", time: 0 },
  { id: "standard", title: "Standard", count: 10, text: "10 questions for a solid session.", time: 0 },
  { id: "mock", title: "Mock Interview", count: 20, text: "20 questions, timed like the real thing.", time: 45 * 60 },
  { id: "rapid_fire", title: "Rapid Fire", count: 15, text: "15 questions, speed matters.", time: 15 * 60 },
  { id: "code_review", title: "Code Review", count: 5, text: "5 code review challenges.", time: 0 },
];

const sel = "rounded-lg border border-gray-300 bg-white p-2 text-sm";

export default function PracticePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState("quick");
  const [track, setTrack] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  async function start() {
    const m = MODES.find((x) => x.id === mode)!;
    setStarting(true);
    setError("");
    try {
      const res = (await api.startInterview({
        mode: m.id,
        count: m.count,
        ...(m.time ? { time_limit: m.time } : {}),
        ...(track ? { track } : {}),
        ...(difficulty ? { difficulty } : {}),
      })) as Rec;
      const session = res.session ?? res;
      try {
        sessionStorage.setItem(`session:${session.id}`, JSON.stringify({ ...res, mode: m.id, time_limit: m.time }));
      } catch {}
      router.push(`/practice/session?sessionId=${session.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start");
      setStarting(false);
    }
  }

  if (authLoading || !user) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Practice</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className="text-left">
            <Card className={`h-full transition ${mode === m.id ? "ring-2 ring-blue-600" : "hover:shadow-md"}`}>
              <h3 className="text-lg font-semibold">{m.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{m.text}</p>
            </Card>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <select className={sel} value={track} onChange={(e) => setTrack(e.target.value)}>
          <option value="">All tracks</option>
          {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <select className={sel} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">Any difficulty</option>
          {["easy", "medium", "hard"].map((d) => <option key={d} value={d}>{cap(d)}</option>)}
        </select>
        <Button size="lg" loading={starting} onClick={start}>Start</Button>
      </div>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
