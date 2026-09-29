"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { DashboardData, WeakArea, StudyStats } from "@/lib/types";
import { toArray, cap } from "@/lib/utils";
import Card from "@/components/ui/Card";
import TrackProgress from "@/components/TrackProgress";

const actions = [
  { href: "/practice", icon: "🎤", title: "Start Interview", text: "Practice with a timed or quick session." },
  { href: "/system-design", icon: "🏛️", title: "System Design", text: "Design a system stage by stage." },
  { href: "/debug-lab", icon: "🐞", title: "Debug Lab", text: "Investigate a production incident." },
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [weak, setWeak] = useState<WeakArea[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.getDashboard(), api.getWeakAreas(), api.getStudyStats()])
      .then(([d, w, s]) => {
        setDash(d as DashboardData);
        setWeak(toArray<WeakArea>(w));
        setStats(s as StudyStats);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) return <p className="text-gray-500">Loading...</p>;

  // Aggregate subtopic rows into per-track averages.
  const byTrack = new Map<string, { sum: number; n: number; attempted: number }>();
  (dash?.tracks ?? []).forEach((t) => {
    const e = byTrack.get(t.track) ?? { sum: 0, n: 0, attempted: 0 };
    e.sum += t.avg_score;
    e.n += 1;
    e.attempted += t.questions_attempted;
    byTrack.set(t.track, e);
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Welcome back, {user.username}!</h1>
      {error && <p className="text-red-600">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Loading dashboard...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><p className="text-sm text-gray-500">Total sessions</p><p className="text-3xl font-bold">{dash?.total_sessions ?? 0}</p></Card>
            <Card><p className="text-sm text-gray-500">Overall score</p><p className="text-3xl font-bold">{Math.round(dash?.overall_score ?? 0)}</p></Card>
            <Card><p className="text-sm text-gray-500">Reviews due today</p><p className="text-3xl font-bold">{stats?.due_today ?? 0}</p></Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {actions.map((a) => (
              <Link key={a.href} href={a.href} className="block rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="text-3xl">{a.icon}</div>
                <h3 className="mt-2 font-semibold">{a.title}</h3>
                <p className="text-sm text-gray-600">{a.text}</p>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="space-y-4">
              <h2 className="text-xl font-semibold">Track progress</h2>
              {byTrack.size === 0 && <p className="text-sm text-gray-500">No progress yet. Start practicing!</p>}
              {[...byTrack.entries()].map(([track, e]) => (
                <TrackProgress key={track} track={cap(track)} score={e.n ? e.sum / e.n : 0} questionsAttempted={e.attempted} />
              ))}
            </Card>
            <div className="space-y-6">
              <Card className="space-y-3">
                <h2 className="text-xl font-semibold">Weak areas</h2>
                {weak.length === 0 && <p className="text-sm text-gray-500">Nothing flagged yet.</p>}
                {weak.map((w) => (
                  <Link key={`${w.track}-${w.subtopic}`} href={`/tracks/${w.track}`} className="flex justify-between rounded-lg bg-red-50 px-3 py-2 text-sm hover:bg-red-100">
                    <span>{cap(w.track)} / {w.subtopic}</span>
                    <span className="font-medium">{Math.round(w.avg_score)}%</span>
                  </Link>
                ))}
              </Card>
              <Card>
                <h2 className="mb-3 text-xl font-semibold">Study plan</h2>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[["Today", stats?.due_today], ["This week", stats?.due_this_week], ["Mastered", stats?.mastered], ["Total", stats?.total]].map(([l, v]) => (
                    <div key={l as string}><p className="text-2xl font-bold">{v ?? 0}</p><p className="text-xs text-gray-500">{l}</p></div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
