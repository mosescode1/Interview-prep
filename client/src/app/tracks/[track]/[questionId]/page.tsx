"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Question, AIEvaluation } from "@/lib/types";
import { getEval, diffVariant, type Rec } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ResponseForm from "@/components/ResponseForm";
import AIFeedback from "@/components/AIFeedback";
import HintPanel from "@/components/HintPanel";

export default function QuestionPage() {
  const { track, questionId } = useParams<{ track: string; questionId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.getQuestion(questionId)
      .then((q) => setQuestion(q as Question))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [user, questionId]);

  async function handleSubmit(response: string) {
    setSubmitting(true);
    setError("");
    try {
      let sid = sessionId;
      if (!sid) {
        const s = (await api.startInterview({ mode: "quick", track, count: 1 })) as Rec;
        sid = (s.session?.id ?? s.id) as string;
        setSessionId(sid);
      }
      const r = await api.submitAnswer(sid, response);
      setEvaluation(getEval(r));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function addToPlan() {
    try {
      await api.addToStudyPlan(questionId);
      setAdded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add");
    }
  }

  if (authLoading || !user || loading) return <p className="text-gray-500">Loading...</p>;
  if (!question) return <p className="text-red-600">{error || "Question not found"}</p>;

  return (
    <div className="space-y-6">
      <Link href={`/tracks/${track}`} className="text-sm text-blue-600 hover:underline">&larr; Back to {track}</Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold">{question.title}</h1>
              <Button variant="secondary" size="sm" disabled={added} onClick={addToPlan}>
                {added ? "Added" : "Add to Study Plan"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={diffVariant(question.difficulty)}>{question.difficulty}</Badge>
              <Badge variant="blue">Level {question.level}</Badge>
              <Badge>{question.subtopic}</Badge>
            </div>
            <p className="whitespace-pre-wrap text-gray-800">{question.body}</p>
          </Card>
          <Card>
            <ResponseForm onSubmit={handleSubmit} loading={submitting} label="Your answer" />
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </Card>
          {evaluation && <AIFeedback evaluation={evaluation} />}
        </div>
        <div>
          <HintPanel hints={question.hints ?? []} hintsUsed={hintsUsed} onRequestHint={() => setHintsUsed((h) => h + 1)} />
        </div>
      </div>
    </div>
  );
}
