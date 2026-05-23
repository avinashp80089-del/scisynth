import type {
  Paper,
  AnalysisResponse,
  HypothesisResponse,
  ChatMessage,
} from "@/types";

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

// Papers
export const searchPapers = (q: string, limit = 10) =>
  request<Paper[]>(`/papers/search?q=${encodeURIComponent(q)}&limit=${limit}`);

export const addPaper = (arxivId: string) =>
  request<Paper>(`/papers/${encodeURIComponent(arxivId)}`, { method: "POST" });

export const listPapers = () => request<Paper[]>("/papers");

export const getPaper = (id: string) =>
  request<Paper>(`/papers/${encodeURIComponent(id)}`);

export const deletePaper = (id: string) =>
  fetch(`${BASE}/papers/${encodeURIComponent(id)}`, { method: "DELETE" });

// Analysis
export const analyzePaper = (paperId: string) =>
  request<AnalysisResponse>(`/analysis/${encodeURIComponent(paperId)}`, {
    method: "POST",
  });

export const getAnalysis = (paperId: string) =>
  request<AnalysisResponse>(`/analysis/${encodeURIComponent(paperId)}`);

export const generateHypotheses = (paperIds: string[]) =>
  request<HypothesisResponse>("/analysis/hypotheses/generate", {
    method: "POST",
    body: JSON.stringify(paperIds),
  });

// Synthesis — returns a streaming text response
export async function* streamSynthesis(
  paperIds: string[],
  focus?: string
): AsyncGenerator<string> {
  const res = await fetch(`${BASE}/synthesis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper_ids: paperIds, focus }),
  });
  if (!res.ok || !res.body) throw new Error("Synthesis request failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}

// Chat — returns a streaming text response
export async function* streamChat(
  query: string,
  paperIds: string[],
  history: ChatMessage[]
): AsyncGenerator<string> {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, paper_ids: paperIds, history }),
  });
  if (!res.ok || !res.body) throw new Error("Chat request failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}
