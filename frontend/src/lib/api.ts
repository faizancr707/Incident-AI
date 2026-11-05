import {
  Incident, LogEntry, MetricSeries, TraceSpan, Deployment,
  AIAgent, EvaluationMetric, KnowledgeEntry,
  ServiceHealth,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/* ── Helpers ──────────────────────────────────────────── */

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ── Auth ─────────────────────────────────────────────── */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "engineer" | "viewer";
  team?: string;
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  return apiFetch<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
  localStorage.removeItem("auth_token");
}

export async function getMe(): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>("/auth/me");
}

/* ── Incidents ────────────────────────────────────────── */

export async function getIncidents(): Promise<Incident[]> {
  const data = await apiFetch<{ incidents: Incident[]; total: number }>("/incidents");
  return data.incidents || [];
}

export async function getIncident(id: string): Promise<Incident> {
  const data = await apiFetch<{ incident: Incident }>(`/incidents/${id}`);
  return data.incident;
}

export async function startInvestigation(incidentId: string): Promise<unknown> {
  return apiFetch(`/incidents/${incidentId}/investigate`, { method: "POST" });
}

/* ── Observability ────────────────────────────────────── */

export async function getLogs(params?: { service?: string; level?: string; search?: string }): Promise<LogEntry[]> {
  const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
  return apiFetch<LogEntry[]>(`/logs${qs}`);
}

export async function getMetrics(): Promise<MetricSeries[]> {
  return apiFetch<MetricSeries[]>("/metrics");
}

export async function getTraces(): Promise<TraceSpan[]> {
  return apiFetch<TraceSpan[]>("/traces");
}

export async function getServices(): Promise<ServiceHealth[]> {
  return apiFetch<ServiceHealth[]>("/health/services");
}

/* ── Intelligence ─────────────────────────────────────── */

export async function getDeployments(): Promise<Deployment[]> {
  return apiFetch<Deployment[]>("/deployments");
}

export async function getAgents(): Promise<AIAgent[]> {
  return apiFetch<AIAgent[]>("/agents");
}

export async function getEvaluations(): Promise<EvaluationMetric[]> {
  return apiFetch<EvaluationMetric[]>("/evaluations");
}

export async function getKnowledgeEntries(): Promise<KnowledgeEntry[]> {
  return apiFetch<KnowledgeEntry[]>("/knowledge");
}

/* ── Workflows & Integrations ────────────────────────── */

export async function getWorkflows(params?: {
  status?: string;
  type?: string;
  provider?: string;
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.type) query.set("type", params.type);
  if (params?.provider) query.set("provider", params.provider);
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset) query.set("offset", params.offset.toString());
  const qs = query.toString();
  return apiFetch<{ workflows: any[]; total: number }>(`/workflows${qs ? `?${qs}` : ""}`);
}

export async function getWorkflowById(id: string) {
  return apiFetch<{ workflow: any }>(`/workflows/${id}`);
}

export async function getWorkflowStats() {
  return apiFetch<any>("/workflows/stats");
}

export async function approveWorkflow(id: string) {
  return apiFetch<any>(`/workflows/${id}/approve`, { method: "POST" });
}

export async function retryWorkflow(id: string) {
  return apiFetch<any>(`/workflows/${id}/retry`, { method: "POST" });
}

export async function getIntegrations() {
  return apiFetch<{ integrations: any[] }>("/workflows/integrations/list");
}

export async function testIntegration(provider: string) {
  return apiFetch<any>(`/workflows/integrations/${provider}/test`, { method: "POST" });
}
