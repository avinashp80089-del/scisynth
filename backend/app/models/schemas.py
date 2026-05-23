from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class Paper(BaseModel):
    id: str
    title: str
    authors: list[str]
    abstract: str
    published: Optional[str] = None
    categories: list[str] = []
    pdf_url: Optional[str] = None
    added_at: Optional[str] = None
    has_analysis: bool = False


class PaperAnalysis(BaseModel):
    summary: str
    key_contributions: list[str]
    methods: str
    findings: str
    limitations: str
    keywords: list[str]


class AnalysisResponse(BaseModel):
    paper_id: str
    analysis: PaperAnalysis
    created_at: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    query: str
    paper_ids: list[str] = []
    history: list[ChatMessage] = []


class SynthesisRequest(BaseModel):
    paper_ids: list[str]
    focus: Optional[str] = None


class HypothesisResponse(BaseModel):
    hypotheses: list[str]
