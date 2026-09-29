"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Scenario } from "@/lib/types";
import { toArray, diffVariant } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function SystemDesignPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [problems, setProblems] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.listDesignProblems()
      .then((r) => setProblems(toArray<Scenario>(r)))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user || loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Design</h1>
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {problems.map((p) => (
          <Card key={p.id} className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">{p.title}</h3>
            <div className="flex gap-2">
              <Badge variant={diffVariant(p.difficulty)}>{p.difficulty}</Badge>
              <Badge variant="blue">Level {p.level}</Badge>
            </div>
            <p className="line-clamp-3 text-sm text-gray-600">{p.description}</p>
            <Link href={`/system-design/${p.id}`} className="mt-auto inline-block self-start rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Start</Link>
          </Card>
        ))}
        {problems.length === 0 && !error && <p className="text-gray-500">No problems available.</p>}
      </div>
    </div>
  );
}
