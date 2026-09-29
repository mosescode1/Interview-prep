const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  // Auth
  register(email: string, username: string, password: string) {
    return this.request<{ token: string; user: unknown }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    });
  }

  login(email: string, password: string) {
    return this.request<{ token: string; user: unknown }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // Questions
  listQuestions(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<{ data: unknown[]; total: number }>(`/questions?${qs}`);
  }

  getQuestion(id: string) {
    return this.request<unknown>(`/questions/${id}`);
  }

  getQuestionSolution(id: string) {
    return this.request<{ solution: string }>(`/questions/${id}/solution`);
  }

  // Interview
  startInterview(config: { mode: string; track?: string; difficulty?: string; level?: number; count?: number; time_limit?: number }) {
    return this.request<unknown>("/interview/start", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  submitAnswer(sessionId: string, response: string) {
    return this.request<unknown>(`/interview/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify({ response }),
    });
  }

  getInterviewHint(sessionId: string) {
    return this.request<unknown>(`/interview/${sessionId}/hint`, { method: "POST" });
  }

  finishInterview(sessionId: string) {
    return this.request<unknown>(`/interview/${sessionId}/finish`, { method: "POST" });
  }

  // System Design
  listDesignProblems(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<unknown>(`/system-design/problems?${qs}`);
  }

  startDesign(scenarioId: string) {
    return this.request<unknown>("/system-design/start", {
      method: "POST",
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
  }

  getDesignSession(sessionId: string) {
    return this.request<unknown>(`/system-design/${sessionId}`);
  }

  submitDesign(sessionId: string, response: string) {
    return this.request<unknown>(`/system-design/${sessionId}/submit`, {
      method: "POST",
      body: JSON.stringify({ response }),
    });
  }

  getDesignHint(sessionId: string) {
    return this.request<unknown>(`/system-design/${sessionId}/hint`, { method: "POST" });
  }

  finishDesign(sessionId: string) {
    return this.request<unknown>(`/system-design/${sessionId}/finish`, { method: "POST" });
  }

  // Debug Lab
  listDebugScenarios(params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request<unknown>(`/debug-lab/scenarios?${qs}`);
  }

  startDebug(scenarioId: string) {
    return this.request<unknown>("/debug-lab/start", {
      method: "POST",
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
  }

  submitInvestigation(sessionId: string, response: string) {
    return this.request<unknown>(`/debug-lab/${sessionId}/investigate`, {
      method: "POST",
      body: JSON.stringify({ response }),
    });
  }

  getDebugHint(sessionId: string) {
    return this.request<unknown>(`/debug-lab/${sessionId}/hint`, { method: "POST" });
  }

  finishDebug(sessionId: string) {
    return this.request<unknown>(`/debug-lab/${sessionId}/finish`, { method: "POST" });
  }

  // Progress
  getDashboard() {
    return this.request<unknown>("/progress/dashboard");
  }

  getWeakAreas() {
    return this.request<unknown>("/progress/weak-areas");
  }

  getRecommendations() {
    return this.request<unknown>("/progress/recommendations");
  }

  // Study Plan
  getTodayReviews() {
    return this.request<unknown>("/study-plan/today");
  }

  submitReview(questionId: string, quality: number) {
    return this.request<unknown>("/study-plan/review", {
      method: "POST",
      body: JSON.stringify({ question_id: questionId, quality }),
    });
  }

  addToStudyPlan(questionId: string) {
    return this.request<unknown>("/study-plan/add", {
      method: "POST",
      body: JSON.stringify({ question_id: questionId }),
    });
  }

  getStudyStats() {
    return this.request<unknown>("/study-plan/stats");
  }
}

export const api = new ApiClient();
