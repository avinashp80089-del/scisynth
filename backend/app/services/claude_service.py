from __future__ import annotations
import json
from typing import AsyncGenerator, Optional

import anthropic
from anthropic.types import TextBlock, TextBlockParam

from app.config import get_settings

_settings = get_settings()

_SYSTEM_PROMPT = """\
You are SciSynth, an AI research assistant specialized in scientific literature analysis and synthesis.

Your capabilities:
- Extract structured insights from scientific papers (methods, findings, contributions, limitations)
- Generate coherent multi-paper literature reviews organized by theme
- Answer evidence-grounded questions about a researcher's paper library
- Propose novel, testable research hypotheses from gaps in existing work

Guiding principles:
- Distinguish what authors claim from what they empirically demonstrate
- Surface contradictions and tensions across papers honestly
- Never speculate beyond what the provided text supports; say so when uncertain
- Write for expert readers — skip basic definitions, use domain vocabulary
"""

_client: Optional[anthropic.AsyncAnthropic] = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=_settings.anthropic_api_key)
    return _client


def _cached_system() -> list[TextBlockParam]:
    block: TextBlockParam = {"type": "text", "text": _SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}  # type: ignore[typeddict-extra-items]
    return [block]


async def analyze_paper(title: str, abstract: str) -> dict:
    prompt = (
        "Analyze the following scientific paper and return ONLY a JSON object "
        "with these exact fields:\n"
        "{\n"
        '  "summary": "2-3 sentence high-level summary",\n'
        '  "key_contributions": ["contribution 1", ...],\n'
        '  "methods": "description of approaches and techniques used",\n'
        '  "findings": "main empirical results and conclusions",\n'
        '  "limitations": "acknowledged limitations and open questions",\n'
        '  "keywords": ["keyword1", ...]\n'
        "}\n\n"
        f"Title: {title}\n\nAbstract:\n{abstract}"
    )

    response = await _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=_cached_system(),
        messages=[{"role": "user", "content": prompt}],
    )

    block = response.content[0]
    if not isinstance(block, TextBlock):
        raise ValueError(f"Unexpected response block type: {type(block)}")
    raw = block.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    return json.loads(raw)


async def stream_literature_review(
    papers: list[dict], focus: Optional[str] = None
) -> AsyncGenerator[str, None]:
    papers_block = "\n\n---\n\n".join(
        f"**Paper {i + 1}**: {p['title']}\n"
        f"Authors: {', '.join(p['authors'][:3])}{'et al.' if len(p['authors']) > 3 else ''}\n"
        f"Abstract: {p['abstract']}"
        for i, p in enumerate(papers)
    )

    focus_line = f"\nFocus the review on: {focus}\n" if focus else ""

    prompt = (
        f"Generate a comprehensive literature review synthesizing the {len(papers)} papers below."
        f"{focus_line}\n\n"
        "Structure:\n"
        "## Overview\n"
        "Common themes, research questions, and scope.\n\n"
        "## Methodological Landscape\n"
        "How papers approach the problem; compare and contrast techniques.\n\n"
        "## Key Findings & Agreements\n"
        "Converging results; what the field has established.\n\n"
        "## Contradictions & Debates\n"
        "Where papers disagree or findings conflict.\n\n"
        "## Open Problems & Future Directions\n"
        "What remains unsolved; promising next steps.\n\n"
        f"Papers:\n\n{papers_block}"
    )

    async with _get_client().messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=3000,
        system=_cached_system(),
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        async for chunk in stream.text_stream:
            yield chunk


async def stream_chat(
    query: str,
    context_papers: list[dict],
    history: list[dict],
) -> AsyncGenerator[str, None]:
    context = "\n\n".join(
        f"[{p['title']}]\n{p['abstract']}" for p in context_papers
    )

    messages = [
        {"role": m["role"], "content": m["content"]} for m in history
    ]
    messages.append(
        {
            "role": "user",
            "content": (
                f"### Paper Library Context\n{context}\n\n"
                f"---\n\n### Question\n{query}"
            ),
        }
    )

    async with _get_client().messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=_cached_system(),
        messages=messages,
    ) as stream:
        async for chunk in stream.text_stream:
            yield chunk


async def generate_hypotheses(papers: list[dict]) -> list[str]:
    papers_block = "\n".join(
        f"- {p['title']}: {p['abstract'][:300]}..." for p in papers
    )

    prompt = (
        "Based on the papers below, generate exactly 5 specific, testable research hypotheses "
        "that would meaningfully advance the field. Each hypothesis must:\n"
        "1. Be grounded in the existing literature\n"
        "2. Identify a genuine gap, contradiction, or under-explored direction\n"
        "3. Be stated precisely enough to guide experimental design\n\n"
        f"Papers:\n{papers_block}\n\n"
        'Return ONLY a JSON array: ["hypothesis 1", "hypothesis 2", ...]'
    )

    response = await _get_client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=_cached_system(),
        messages=[{"role": "user", "content": prompt}],
    )

    block = response.content[0]
    if not isinstance(block, TextBlock):
        raise ValueError(f"Unexpected response block type: {type(block)}")
    raw = block.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    return json.loads(raw)
