from __future__ import annotations
import json
from pathlib import Path
import aiosqlite

from app.config import get_settings

_settings = get_settings()
DB_PATH = Path(_settings.database_path)

_SCHEMA = """
CREATE TABLE IF NOT EXISTS papers (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    authors     TEXT NOT NULL,
    abstract    TEXT NOT NULL,
    published   TEXT,
    categories  TEXT,
    pdf_url     TEXT,
    added_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS analyses (
    paper_id        TEXT PRIMARY KEY REFERENCES papers(id) ON DELETE CASCADE,
    summary         TEXT NOT NULL,
    key_contributions TEXT NOT NULL,
    methods         TEXT NOT NULL,
    findings        TEXT NOT NULL,
    limitations     TEXT NOT NULL,
    keywords        TEXT NOT NULL,
    created_at      TEXT DEFAULT (datetime('now'))
);
"""


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(_SCHEMA)
        await db.commit()


async def get_connection() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA foreign_keys = ON")
    return db


async def paper_exists(paper_id: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT 1 FROM papers WHERE id = ?", (paper_id,)
        ) as cur:
            return await cur.fetchone() is not None


async def insert_paper(paper: dict) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT OR IGNORE INTO papers
               (id, title, authors, abstract, published, categories, pdf_url)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                paper["id"],
                paper["title"],
                json.dumps(paper["authors"]),
                paper["abstract"],
                paper.get("published"),
                json.dumps(paper.get("categories", [])),
                paper.get("pdf_url"),
            ),
        )
        await db.commit()


async def fetch_all_papers() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            """SELECT p.*, (a.paper_id IS NOT NULL) AS has_analysis
               FROM papers p LEFT JOIN analyses a ON p.id = a.paper_id
               ORDER BY p.added_at DESC"""
        ) as cur:
            rows = await cur.fetchall()
    return [_deserialize_paper(dict(r)) for r in rows]


async def fetch_paper(paper_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            """SELECT p.*, (a.paper_id IS NOT NULL) AS has_analysis
               FROM papers p LEFT JOIN analyses a ON p.id = a.paper_id
               WHERE p.id = ?""",
            (paper_id,),
        ) as cur:
            row = await cur.fetchone()
    return _deserialize_paper(dict(row)) if row else None


async def fetch_papers_by_ids(paper_ids: list[str]) -> list[dict]:
    placeholders = ",".join("?" * len(paper_ids))
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            f"SELECT * FROM papers WHERE id IN ({placeholders})", paper_ids
        ) as cur:
            rows = await cur.fetchall()
    return [_deserialize_paper(dict(r)) for r in rows]


async def delete_paper(paper_id: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA foreign_keys = ON")
        cur = await db.execute("DELETE FROM papers WHERE id = ?", (paper_id,))
        await db.commit()
        return cur.rowcount > 0


async def insert_analysis(paper_id: str, analysis: dict) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT OR REPLACE INTO analyses
               (paper_id, summary, key_contributions, methods, findings, limitations, keywords)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                paper_id,
                analysis["summary"],
                json.dumps(analysis["key_contributions"]),
                analysis["methods"],
                analysis["findings"],
                analysis["limitations"],
                json.dumps(analysis["keywords"]),
            ),
        )
        await db.commit()


async def fetch_analysis(paper_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM analyses WHERE paper_id = ?", (paper_id,)
        ) as cur:
            row = await cur.fetchone()
    if not row:
        return None
    data = dict(row)
    data["key_contributions"] = json.loads(data["key_contributions"])
    data["keywords"] = json.loads(data["keywords"])
    return data


def _deserialize_paper(row: dict) -> dict:
    row["authors"] = json.loads(row["authors"])
    row["categories"] = json.loads(row.get("categories") or "[]")
    row["has_analysis"] = bool(row.get("has_analysis", 0))
    return row
