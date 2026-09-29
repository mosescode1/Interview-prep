"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { ReviewCard, StudyStats, DashboardData } from "@/lib/types";
import { toArray } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewCard[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.getTodayReviews(), api.getStudyStats(), api.getDashboard()])
      .then(([r, s, d]) => {
        setReviews(toArray<ReviewCard>(r));
        setStats(s as StudyStats);
        setDash(d as DashboardData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <Card className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{user.username}</h1>
          <p className="text-gray-600">{user.email}</p>
          <div className="mt-2 flex gap-2">
            <Badge variant="blue">Level {user.level}</Badge>
            <Badge>Joined {new Date(user.created_at).toLocaleDateString()}</Badge>
          </div>
        </div>
        <Button variant="secondary" onClick={logout}>Log out</Button>
      </Card>
      {error && <p className="text-red-600">{error}</p>}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Card><p className="text-sm text-gray-500">Sessions</p><p className="text-2xl font-bold">{dash?.total_sessions ?? 0}</p></Card>
            <Card><p className="text-sm text-gray-500">Overall score</p><p className="text-2xl font-bold">{Math.round(dash?.overall_score ?? 0)}</p></Card>
            <Card><p className="text-sm text-gray-500">Mastered</p><p className="text-2xl font-bold">{stats?.mastered ?? 0}</p></Card>
            <Card><p className="text-sm text-gray-500">In study plan</p><p className="text-2xl font-bold">{stats?.total ?? 0}</p></Card>
          </div>
          <Card className="space-y-3">
            <h2 className="text-xl font-semibold">Reviews due today ({stats?.due_today ?? reviews.length})</h2>
            {reviews.length === 0 && <p className="text-sm text-gray-500">You are all caught up.</p>}
            {reviews.map((c) => (
              <Link key={c.id} href={`/tracks/${c.question?.track ?? "fundamentals"}/${c.question_id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50">
                <span>{c.question?.title ?? c.question_id}</span>
                <span className="text-xs text-gray-500">every {c.interval_days}d</span>
              </Link>
            ))}
            <p className="text-sm text-gray-500">Due this week: {stats?.due_this_week ?? 0}</p>
          </Card>
        </>
      )}
    </div>
  );
}
