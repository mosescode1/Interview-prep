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
import StageProgress from "@/components/StageProgress";

const STAGES = ["OBSERVE", "LOCATE", "IDENTIFY", "FIX", "VERIFY"];

export default function DebugWorkspace() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stage, setStage] = useState(STAGES[0]);
  const [prompt, setPrompt] = useState("");
  const [evidence, setEvidence] = useState<unknown[]>([]);
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null);
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

  function toEvidence(e: unknown): unknown[] {
    if (!e) return [];
    return Array.isArray(e) ? e : [e];
  }

  useEffect(() => {
    if (!user || started.current) return;
    started.current = true;
    api.startDebug(scenarioId)
      .then((res) => {
        const r = res as Rec;
        const s = r.session ?? r;
        setSessionId(s.id);
        setStage(String(s.current_stage || STAGES[0]).toUpperCase());
        const steps = s.steps ?? [];
        const last = steps[steps.length - 1];
        setPrompt(r.prompt ?? last?.prompt ?? "");
        setEvidence(toEvidence(r.evidence ?? last?.evidence_revealed ?? r.initial_context));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to start"))
      .finally(() => setLoading(false));
  }, [user, scenarioId]);

  async function submit(response: string) {
    if (!sessionId) return;
    setSubmitting(true);
    setError("");
    try {
      const r = (await api.submitInvestigation(sessionId, response)) as Rec;
      setEvaluation(getEval(r));
      const idx = STAGES.indexOf(stage);
      const advanced = r.next_stage ?? r.current_stage ?? r.session?.current_stage;
      setStage(advanced ? String(advanced).toUpperCase() : STAGES[Math.min(idx + 1, STAGES.length - 1)]);
      setPrompt(r.next_prompt ?? r.prompt ?? r.next_step?.prompt ?? prompt);
      const ev = toEvidence(r.evidence ?? r.evidence_revealed);
      if (ev.length) setEvidence((p) => [...p, ...ev]);
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
      const r = (await api.getDebugHint(sessionId)) as Rec;
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
    try { await api.finishDebug(sessionId); } catch {}
    router.push("/debug-lab");
  }

  if (authLoading || !user || loading) return <p className="text-gray-500">Starting scenario...</p>;
  if (!sessionId) return <p className="text-red-600">{error || "Could not start scenario"}</p>;

  const idx = STAGES.indexOf(stage);
  return (
    <div className="space-y-6">
      <Card><StageProgress stages={STAGES} currentStage={stage} completedStages={STAGES.slice(0, Math.max(idx, 0))} /></Card>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-2">
            <h2 className="text-xl font-semibold">{stage}</h2>
            <p className="whitespace-pre-wrap text-gray-800">{prompt || "Describe what you observe."}</p>
          </Card>
          {evidence.length > 0 && (
            <Card className="space-y-2">
              <h3 className="font-semibold">Evidence</h3>
              {evidence.map((e, i) => (
                <pre key={i} className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
                  {typeof e === "string" ? e : JSON.stringify(e, null, 2)}
                </pre>
              ))}
            </Card>
          )}
          <Card>
            <ResponseForm onSubmit={submit} loading={submitting} label="Your investigation" />
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </Card>
          {evaluation && <AIFeedback evaluation={evaluation} />}
          <Button variant="danger" loading={finishing} onClick={finish}>Finish</Button>
        </div>
        <HintPanel hints={padHints(hints)} hintsUsed={hints.length} onRequestHint={hint} loading={hintLoading} />
      </div>
    </div>
  );
}
