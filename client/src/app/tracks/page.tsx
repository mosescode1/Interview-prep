"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardData } from "@/lib/types";
import { TRACKS } from "@/lib/utils";
import TopicCard from "@/components/TopicCard";

export default function TracksPage() {
  const [dash, setDash] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.getDashboard().then((d) => setDash(d as DashboardData)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Tracks</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TRACKS.map((t) => {
          const rows = (dash?.tracks ?? []).filter((r) => r.track === t.id);
          const attempted = rows.reduce((s, r) => s + r.questions_attempted, 0);
          const progress = rows.length ? rows.reduce((s, r) => s + r.avg_score, 0) / rows.length : 0;
          return (
            <TopicCard key={t.id} title={t.title} description={t.description} icon={t.icon}
              href={`/tracks/${t.id}`} progress={progress} questionCount={attempted} />
          );
        })}
      </div>
    </div>
  );
}
