from __future__ import annotations
from fastapi import APIRouter, HTTPException, Query

from app import database as db
from app.services import arxiv_service
from app.models.schemas import Paper

router = APIRouter(prefix="/papers", tags=["papers"])


@router.get("/search", response_model=list[Paper])
async def search_papers(q: str = Query(..., min_length=2), limit: int = Query(10, ge=1, le=50)):
    results = await arxiv_service.search_arxiv(q, max_results=limit)
    # Annotate which papers are already in the library
    for paper in results:
        paper["has_analysis"] = False
        if await db.paper_exists(paper["id"]):
            saved = await db.fetch_paper(paper["id"])
            paper["has_analysis"] = saved["has_analysis"] if saved else False
    return results


@router.post("/{arxiv_id}", response_model=Paper, status_code=201)
async def add_paper(arxiv_id: str):
    existing = await db.fetch_paper(arxiv_id)
    if existing:
        return existing

    paper = await arxiv_service.fetch_paper_by_id(arxiv_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found on arXiv")

    await db.insert_paper(paper)
    return await db.fetch_paper(arxiv_id)


@router.get("", response_model=list[Paper])
async def list_papers():
    return await db.fetch_all_papers()


@router.get("/{paper_id}", response_model=Paper)
async def get_paper(paper_id: str):
    paper = await db.fetch_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not in library")
    return paper


@router.delete("/{paper_id}", status_code=204)
async def remove_paper(paper_id: str):
    deleted = await db.delete_paper(paper_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Paper not found")
