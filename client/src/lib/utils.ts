/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AIEvaluation } from "./types";

// Loosely-typed API payload (backend responses are typed as unknown in the client).
export type Rec = any;

export const TRACKS = [
  { id: "fundamentals", title: "Fundamentals", icon: "📘", description: "Data structures, algorithms, CS core concepts." },
  { id: "development", title: "Development", icon: "💻", description: "Software design, patterns and clean code." },
  { id: "testing", title: "Testing", icon: "🧪", description: "Unit, integration and end-to-end testing." },
  { id: "devops", title: "DevOps", icon: "🚀", description: "CI/CD, containers and infrastructure." },
  { id: "production", title: "Production", icon: "🛠️", description: "Observability, incidents and reliability." },
  { id: "security", title: "Security", icon: "🔒", description: "AppSec, auth and threat modeling." },
  { id: "databases", title: "Databases", icon: "🗄️", description: "SQL, indexing, transactions and NoSQL." },
  { id: "architecture", title: "Architecture", icon: "🏗️", description: "Distributed systems and scalability." },
];

export function toArray<T = Rec>(x: Rec): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x && typeof x === "object") {
    for (const k of ["data", "problems", "scenarios", "questions", "items", "cards", "reviews"]) {
      if (Array.isArray(x[k])) return x[k] as T[];
    }
  }
  return [];
}

export function getEval(r: Rec): AIEvaluation | null {
  const e = r?.ai_evaluation ?? r?.evaluation ?? r?.step?.ai_evaluation ?? (typeof r?.score === "number" ? r : null);
  return e && typeof e.score === "number" ? (e as AIEvaluation) : null;
}

export function diffVariant(d: string): "green" | "yellow" | "red" {
  const v = (d || "").toLowerCase();
  return v === "easy" ? "green" : v === "hard" ? "red" : "yellow";
}

export function padHints(hints: string[], n = 3): string[] {
  const out = [...hints];
  while (out.length < n) out.push("");
  return out;
}

export const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
