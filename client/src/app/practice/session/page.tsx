"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useTimer } from "@/hooks/useTimer";
import type { SessionStep, AIEvaluation } from "@/lib/types";
import { getEval, padHints, type Rec } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ResponseForm from "@/components/ResponseForm";
import AIFeedback from "@/components/AIFeedback";
import HintPanel from "@/components/HintPanel";
import Timer from "@/components/Timer";

function SessionView() {
  const sessionId = useSearchParams().get("sessionId");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<SessionStep | null>(null);
  const [total, setTotal] = useState(0);
  const [mode, setMode] = useState("quick");
  const [timeLimit, setTimeLimit] = useState(0);
  const [ready, setReady] = useState(false);
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null);
  const [nextStep, setNextStep] = useState<SessionStep | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [hintLoading, setHintLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");
  const timed = timeLimit > 0;
  const timer = useTimer(timeLimit, true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!sessionId) return;
    try {
      const raw = sessionStorage.getItem(`session:${sessionId}`);
      if (raw) {
        const res: Rec = JSON.parse(raw);
        const session = res.session ?? res;
        const steps: SessionStep[] = session.steps ?? [];
        setStep(res.step ?? res.current_step ?? steps[steps.length - 1] ?? null);
        setTotal(session.config?.count ?? res.total ?? steps.length);
        setMode(res.mode ?? session.mode ?? "quick");
        setTimeLimit(res.time_limit ?? 0);
        if (res.time_limit) {
          timer.reset(res.time_limit);
          timer.start();
        }
      }
    } catch {}
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function submit(response: string) {
    if (!sessionId) return;
    setSubmitting(true);
    setError("");
    try {
      const r = (await api.submitAnswer(sessionId, response)) as Rec;
      setEvaluation(getEval(r));
      setNextStep((r.next_step ?? r.next_question ?? null) as SessionStep | null);
      if (r.total) setTotal(r.total);
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
      const r = (await api.getInterviewHint(sessionId)) as Rec;
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
    try {
      await api.finishInterview(sessionId);
    } catch {}
    try { sessionStorage.removeItem(`session:${sessionId}`); } catch {}
    router.push("/dashboard");
  }

  function next() {
    setStep(nextStep);
    setNextStep(null);
    setEvaluation(null);
    setHints([]);
  }

  if (authLoading || !user || !ready) return <p className="text-gray-500">Loading...</p>;
  if (!sessionId || !step) return <p className="text-red-600">Session not found. <a className="underline" href="/practice">Start a new one</a>.</p>;

  const isLast = evaluation && !nextStep;
  const timeUp = timed && timer.seconds === 0 && !timer.running;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Practice Session</h1>
          <Badge variant="blue">{mode}</Badge>
          <span className="text-sm text-gray-600">Question {step.step_number}{total ? ` of ${total}` : ""}</span>
        </div>
        {timed && (
          <Timer formatted={timer.formatted} running={timer.running}
            onToggle={() => (timer.running ? timer.pause() : timer.start())} onReset={() => timer.reset(timeLimit)} />
        )}
      </div>
      {timeUp && <p className="font-medium text-red-600">Time is up!</p>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card><p className="whitespace-pre-wrap text-gray-800">{step.prompt}</p></Card>
          {!evaluation && (
            <Card>
              <ResponseForm onSubmit={submit} loading={submitting} label="Your answer" />
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </Card>
          )}
          {evaluation && <AIFeedback evaluation={evaluation} />}
          <div className="flex gap-3">
            {evaluation && nextStep && <Button onClick={next}>Next question</Button>}
            {(isLast || timeUp) && <Button loading={finishing} onClick={finish}>Finish</Button>}
            {!isLast && !timeUp && <Button variant="secondary" loading={finishing} onClick={finish}>End session</Button>}
          </div>
        </div>
        <HintPanel hints={padHints(hints)} hintsUsed={hints.length} onRequestHint={hint} loading={hintLoading} />
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <SessionView />
    </Suspense>
  );
}
