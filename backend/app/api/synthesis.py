from __future__ import annotations
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app import database as db
from app.models.schemas import SynthesisRequest
from app.services import claude_service

router = APIRouter(prefix="/synthesis", tags=["synthesis"])


@router.post("")
async def generate_review(body: SynthesisRequest):
    if len(body.paper_ids) < 2:
        raise HTTPException(status_code=422, detail="Provide at least 2 papers for synthesis")

    papers = await db.fetch_papers_by_ids(body.paper_ids)
    if len(papers) < 2:
        raise HTTPException(status_code=404, detail="Could not find enough papers in library")

    async def event_stream():
        async for chunk in claude_service.stream_literature_review(papers, focus=body.focus):
            yield chunk

    return StreamingResponse(event_stream(), media_type="text/plain; charset=utf-8")
