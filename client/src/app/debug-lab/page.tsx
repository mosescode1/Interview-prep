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

export default function DebugLabPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.listDebugScenarios()
      .then((r) => setItems(toArray<Scenario>(r)))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user || loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Debug Lab</h1>
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <Link key={s.id} href={`/debug-lab/${s.id}`} className="block">
            <Card className="h-full space-y-3 transition-shadow hover:shadow-md">
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <div className="flex gap-2">
                <Badge variant={diffVariant(s.difficulty)}>{s.difficulty}</Badge>
                <Badge>{s.track}</Badge>
              </div>
              <p className="line-clamp-3 text-sm text-gray-600">{s.description}</p>
            </Card>
          </Link>
        ))}
        {items.length === 0 && !error && <p className="text-gray-500">No scenarios available.</p>}
      </div>
    </div>
  );
}
