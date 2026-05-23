export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  published?: string;
  categories: string[];
  pdf_url?: string;
  added_at?: string;
  has_analysis: boolean;
}

export interface PaperAnalysis {
  summary: string;
  key_contributions: string[];
  methods: string;
  findings: string;
  limitations: string;
  keywords: string[];
}

export interface AnalysisResponse {
  paper_id: string;
  analysis: PaperAnalysis;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface HypothesisResponse {
  hypotheses: string[];
}
