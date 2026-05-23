from __future__ import annotations
import re
from collections import Counter
import math


def _tokenize(text: str) -> list[str]:
    tokens = re.findall(r"\b[a-zA-Z][a-zA-Z0-9]*\b", text.lower())
    return [t for t in tokens if len(t) > 2]


def _tfidf_vectors(docs: list[str]) -> list[dict[str, float]]:
    tokenized = [_tokenize(d) for d in docs]
    n = len(tokenized)

    # document frequency
    df: Counter[str] = Counter()
    for tokens in tokenized:
        df.update(set(tokens))

    vectors: list[dict[str, float]] = []
    for tokens in tokenized:
        tf = Counter(tokens)
        total = len(tokens) or 1
        vec: dict[str, float] = {}
        for term, count in tf.items():
            idf = math.log((n + 1) / (df[term] + 1)) + 1
            vec[term] = (count / total) * idf
        # L2 normalize
        norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
        vectors.append({k: v / norm for k, v in vec.items()})

    return vectors


def _cosine(a: dict[str, float], b: dict[str, float]) -> float:
    return sum(a.get(t, 0.0) * v for t, v in b.items())


def rank_papers(query: str, papers: list[dict], top_k: int = 5) -> list[dict]:
    if not papers:
        return []

    docs = [f"{p['title']} {p['abstract']}" for p in papers]
    vecs = _tfidf_vectors(docs + [query])
    paper_vecs, query_vec = vecs[:-1], vecs[-1]

    scored = sorted(
        zip(paper_vecs, papers),
        key=lambda x: _cosine(x[0], query_vec),
        reverse=True,
    )
    return [p for _, p in scored[:top_k]]
