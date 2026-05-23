from __future__ import annotations
from fastapi import APIRouter, HTTPException

from app import database as db
from app.models.schemas import AnalysisResponse, PaperAnalysis, HypothesisResponse
from app.services import claude_service

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/{paper_id}", response_model=AnalysisResponse)
async def analyze_paper(paper_id: str):
    paper = await db.fetch_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not in library")

    existing = await db.fetch_analysis(paper_id)
    if existing is not None:
        return AnalysisResponse(
            paper_id=paper_id,
            analysis=PaperAnalysis(**existing),
            created_at=existing["created_at"],
        )

    result = await claude_service.analyze_paper(paper["title"], paper["abstract"])
    await db.insert_analysis(paper_id, result)

    saved = await db.fetch_analysis(paper_id)
    assert saved is not None, "analysis row missing immediately after insert"
    return AnalysisResponse(
        paper_id=paper_id,
        analysis=PaperAnalysis(**saved),
        created_at=saved["created_at"],
    )


@router.get("/{paper_id}", response_model=AnalysisResponse)
async def get_analysis(paper_id: str):
    saved = await db.fetch_analysis(paper_id)
    if not saved:
        raise HTTPException(status_code=404, detail="No analysis found — run POST first")
    return AnalysisResponse(
        paper_id=paper_id,
        analysis=PaperAnalysis(**saved),
        created_at=saved["created_at"],
    )


@router.post("/hypotheses/generate", response_model=HypothesisResponse)
async def generate_hypotheses(paper_ids: list[str]):
    if not paper_ids:
        raise HTTPException(status_code=422, detail="Provide at least one paper_id")
    papers = await db.fetch_papers_by_ids(paper_ids)
    if not papers:
        raise HTTPException(status_code=404, detail="None of the specified papers found")
    hypotheses = await claude_service.generate_hypotheses(papers)
    return HypothesisResponse(hypotheses=hypotheses)
