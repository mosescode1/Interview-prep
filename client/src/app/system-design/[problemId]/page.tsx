"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { AIEvaluation } from "@/lib/types";
import { getEval, padHints, type Rec } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ResponseForm from "@/components/ResponseForm";
import AIFeedback from "@/components/AIFeedback";
import HintPanel from "@/components/HintPanel";

const STAGES = [
  "REQUIREMENTS", "ESTIMATION", "API_DESIGN", "DATA_MODEL", "HIGH_LEVEL", "DEEP_DIVE", "SCALING",
  "CACHING", "CONSISTENCY", "RELIABILITY", "SECURITY", "MONITORING", "TRADEOFFS", "WRAP_UP",
];

export default function DesignWorkspace() {
  const { problemId } = useParams<{ problemId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stages, setStages] = useState<string[]>(STAGES);
  const [stage, setStage] = useState(STAGES[0]);
  const [prompt, setPrompt] = useState("");
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [hints, setHints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || started.current) return;
    started.current = true;
    api.startDesign(problemId)
      .then((res) => {
        const r = res as Rec;
        const s = r.session ?? r;
        setSessionId(s.id);
        if (Array.isArray(r.stages) && r.stages.length) setStages(r.stages);
        setStage(s.current_stage || STAGES[0]);
        const steps = s.steps ?? [];
        setPrompt(r.prompt ?? steps[steps.length - 1]?.prompt ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to start"))
      .finally(() => setLoading(false));
  }, [user, problemId]);

  async function submit(response: string) {
    if (!sessionId) return;
    setSubmitting(true);
    setError("");
    try {
      const r = (await api.submitDesign(sessionId, response)) as Rec;
      const ev = getEval(r);
      setEvaluation(ev);
      const ch = r.challenges ?? (ev as Rec)?.challenges ?? [];
      setChallenges(Array.isArray(ch) ? ch : []);
      const idx = stages.indexOf(stage);
      const nextStage = r.next_stage ?? r.current_stage ?? r.session?.current_stage ?? stages[Math.min(idx + 1, stages.length - 1)];
      setStage(nextStage);
      setPrompt(r.next_prompt ?? r.prompt ?? r.next_step?.prompt ?? prompt);
      setHints([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function hint() {
    if (!sessionId) return;
    setHintLoading(true);
    try {
      const r = (await api.getDesignHint(sessionId)) as Rec;
      const h = r.hint ?? r.text;
      if (h) setHints((p) => [...p, String(h)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No hint available");
    } finally {
      setHintLoading(false);
    }
  }

  async function finish() {
    if (!sessionId) return;
    setFinishing(true);
    try { await api.finishDesign(sessionId); } catch {}
    router.push("/system-design");
  }

  if (authLoading || !user || loading) return <p className="text-gray-500">Starting design session...</p>;
  if (!sessionId) return <p className="text-red-600">{error || "Could not start session"}</p>;

  const idx = stages.indexOf(stage);
  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <aside className="lg:col-span-1">
        <Card className="space-y-1">
          <h2 className="mb-2 font-semibold">Stages</h2>
          {stages.map((s, i) => (
            <div key={s} className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${s === stage ? "bg-blue-50 font-semibold text-blue-700" : i < idx ? "text-green-700" : "text-gray-500"}`}>
              <span className="w-4">{i < idx ? "✓" : s === stage ? "●" : "○"}</span>
              <span>{s.replace(/_/g, " ")}</span>
            </div>
          ))}
        </Card>
      </aside>
      <div className="space-y-6 lg:col-span-3">
        <Card className="space-y-2">
          <h2 className="text-xl font-semibold">{stage.replace(/_/g, " ")}</h2>
          <p className="whitespace-pre-wrap text-gray-800">{prompt || "Describe your approach for this stage."}</p>
        </Card>
        <Card>
          <ResponseForm onSubmit={submit} loading={submitting} label="Your design" />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </Card>
        {evaluation && <AIFeedback evaluation={evaluation} />}
        {challenges.length > 0 && (
          <Card className="space-y-2">
            <h3 className="font-semibold">Challenges</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-800">
              {challenges.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </Card>
        )}
        <HintPanel hints={padHints(hints)} hintsUsed={hints.length} onRequestHint={hint} loading={hintLoading} />
        <Button variant="danger" loading={finishing} onClick={finish}>Finish</Button>
      </div>
    </div>
  );
}
