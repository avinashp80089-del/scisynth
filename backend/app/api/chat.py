from __future__ import annotations
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app import database as db
from app.models.schemas import ChatRequest
from app.services import claude_service, retrieval_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("")
async def chat(body: ChatRequest):
    if not body.query.strip():
        raise HTTPException(status_code=422, detail="Query cannot be empty")

    if body.paper_ids:
        papers = await db.fetch_papers_by_ids(body.paper_ids)
    else:
        papers = await db.fetch_all_papers()

    context_papers = retrieval_service.rank_papers(body.query, papers, top_k=5)

    history = [{"role": m.role, "content": m.content} for m in body.history]

    async def event_stream():
        async for chunk in claude_service.stream_chat(body.query, context_papers, history):
            yield chunk

    return StreamingResponse(event_stream(), media_type="text/plain; charset=utf-8")
