from __future__ import annotations
import re
import xml.etree.ElementTree as ET
from typing import Optional

import httpx

from app.config import get_settings

_settings = get_settings()

_NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "arxiv": "http://arxiv.org/schemas/atom",
}


def _strip_version(arxiv_id: str) -> str:
    return re.sub(r"v\d+$", "", arxiv_id.split("/")[-1])


def _parse_entry(entry: ET.Element) -> dict:
    def text(tag: str, ns: str = "atom") -> str:
        el = entry.find(f"{ns}:{tag}", _NS)
        return (el.text or "").strip() if el is not None else ""

    raw_id = text("id")
    arxiv_id = _strip_version(raw_id)

    authors = [
        (a.find("atom:name", _NS).text or "").strip()
        for a in entry.findall("atom:author", _NS)
        if a.find("atom:name", _NS) is not None
    ]

    categories = [
        el.get("term", "")
        for el in entry.findall("arxiv:primary_category", _NS)
        + entry.findall("atom:category", _NS)
        if el.get("term")
    ]
    categories = list(dict.fromkeys(categories))

    pdf_url: Optional[str] = None
    for link in entry.findall("atom:link", _NS):
        if link.get("title") == "pdf":
            pdf_url = link.get("href")
            break

    return {
        "id": arxiv_id,
        "title": re.sub(r"\s+", " ", text("title")),
        "authors": authors,
        "abstract": re.sub(r"\s+", " ", text("summary")),
        "published": text("published")[:10] or None,
        "categories": categories,
        "pdf_url": pdf_url,
    }


async def search_arxiv(query: str, max_results: int | None = None) -> list[dict]:
    limit = max_results or _settings.max_papers_per_search
    params = {
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": limit,
        "sortBy": "relevance",
        "sortOrder": "descending",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(_settings.arxiv_base_url, params=params)
        response.raise_for_status()

    root = ET.fromstring(response.text)
    entries = root.findall("atom:entry", _NS)
    return [_parse_entry(e) for e in entries]


async def fetch_paper_by_id(arxiv_id: str) -> dict | None:
    clean_id = _strip_version(arxiv_id)
    params = {"id_list": clean_id, "max_results": 1}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(_settings.arxiv_base_url, params=params)
        response.raise_for_status()

    root = ET.fromstring(response.text)
    entries = root.findall("atom:entry", _NS)
    if not entries:
        return None
    return _parse_entry(entries[0])
