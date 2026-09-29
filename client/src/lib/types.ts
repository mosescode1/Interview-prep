export interface User {
  id: string;
  email: string;
  username: string;
  level: number;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Question {
  id: string;
  title: string;
  body: string;
  track: string;
  subtopic: string;
  difficulty: string;
  level: number;
  question_type: string;
  language: string;
  hints: string[];
  evaluation_criteria: Record<string, number>;
  options: string[] | null;
  follow_up_prompts: string[];
  tags: string[];
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  type: string;
  track: string;
  difficulty: string;
  level: number;
  stages: unknown;
  initial_context: unknown;
  tags: string[];
}

export interface Session {
  id: string;
  user_id: string;
  type: string;
  scenario_id: string | null;
  mode: string;
  current_stage: string;
  status: string;
  config: Record<string, unknown>;
  score: number;
  started_at: string;
  ended_at: string | null;
  steps: SessionStep[];
}

export interface SessionStep {
  id: string;
  session_id: string;
  question_id: string | null;
  stage: string;
  step_number: number;
  prompt: string;
  user_response: string;
  ai_evaluation: AIEvaluation | null;
  hints_used: number;
  evidence_revealed: unknown;
}

export interface AIEvaluation {
  score: number;
  breakdown: Record<string, number>;
  feedback: string;
  strengths: string[];
  areas_to_improve: string[];
}

export interface TrackProgress {
  track: string;
  subtopic: string;
  questions_attempted: number;
  questions_correct: number;
  avg_score: number;
  level: number;
}

export interface DashboardData {
  tracks: TrackProgress[];
  total_sessions: number;
  overall_score: number;
}

export interface WeakArea {
  track: string;
  subtopic: string;
  avg_score: number;
  questions_attempted: number;
}

export interface ReviewCard {
  id: string;
  question_id: string;
  question: Question;
  easiness_factor: number;
  interval_days: number;
  repetitions: number;
  next_review: string;
}

export interface StudyStats {
  due_today: number;
  due_this_week: number;
  mastered: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
