import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { listPapers, analyzePaper, getAnalysis, generateHypotheses } from "@/services/api";
import PaperCard from "@/components/PaperCard";
import type { Paper, PaperAnalysis, HypothesisResponse } from "@/types";

export default function Analysis() {
  const { paperId: routeId } = useParams();
  const navigate = useNavigate();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedId, setSelectedId] = useState<string>(routeId ?? "");
  const [analysis, setAnalysis] = useState<PaperAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [hypotheses, setHypotheses] = useState<HypothesisResponse | null>(null);
  const [loadingHyp, setLoadingHyp] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["summary"]));

  useEffect(() => {
    listPapers().then(setPapers).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    getAnalysis(selectedId)
      .then((r) => setAnalysis(r.analysis))
      .catch(() => setAnalysis(null));
  }, [selectedId]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setAnalysis(null);
    setHypotheses(null);
    navigate(`/analysis/${id}`, { replace: true });
  };

  const handleAnalyze = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const r = await analyzePaper(selectedId);
      setAnalysis(r.analysis);
    } finally {
      setLoading(false);
    }
  };

  const handleHypotheses = async () => {
    setLoadingHyp(true);
    try {
      const r = await generateHypotheses(papers.map((p) => p.id));
      setHypotheses(r);
    } finally {
      setLoadingHyp(false);
    }
  };

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const selectedPaper = papers.find((p) => p.id === selectedId);

  const sections: { key: keyof PaperAnalysis; label: string }[] = [
    { key: "summary", label: "Summary" },
    { key: "key_contributions", label: "Key Contributions" },
    { key: "methods", label: "Methods" },
    { key: "findings", label: "Findings" },
    { key: "limitations", label: "Limitations" },
    { key: "keywords", label: "Keywords" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Paper list sidebar */}
      <div className="w-72 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Library</h2>
        {papers.length === 0 ? (
          <p className="text-xs text-gray-400">No papers yet — add some in the Library.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {papers.map((p) => (
              <PaperCard
                key={p.id}
                paper={p}
                compact
                selected={p.id === selectedId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Analysis panel */}
      <div className="flex-1 overflow-y-auto p-8">
        {!selectedPaper ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Select a paper to analyze
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">
            <h1 className="text-xl font-bold text-gray-900">{selectedPaper.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {selectedPaper.authors.slice(0, 3).join(", ")}
              {selectedPaper.authors.length > 3 ? " et al." : ""}
            </p>

            <div className="mt-5 flex gap-2">
              <button className="btn-primary" onClick={handleAnalyze} disabled={loading}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                {analysis ? "Re-analyze" : "Analyze Paper"}
              </button>
              {papers.length >= 1 && (
                <button
                  className="btn-secondary"
                  onClick={handleHypotheses}
                  disabled={loadingHyp}
                >
                  {loadingHyp ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} />}
                  Generate Hypotheses
                </button>
              )}
            </div>

            {analysis && (
              <div className="mt-8 flex flex-col gap-3">
                {sections.map(({ key, label }) => {
                  const value = analysis[key];
                  const isOpen = expanded.has(key);
                  return (
                    <div key={key} className="card">
                      <button
                        className="flex w-full items-center justify-between text-sm font-semibold text-gray-800"
                        onClick={() => toggle(key)}
                      >
                        {label}
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {isOpen && (
                        <div className="mt-3 text-sm text-gray-600">
                          {Array.isArray(value) ? (
                            key === "keywords" ? (
                              <div className="flex flex-wrap gap-1">
                                {(value as string[]).map((kw) => (
                                  <span key={kw} className="badge bg-brand-50 text-brand-700">{kw}</span>
                                ))}
                              </div>
                            ) : (
                              <ul className="list-disc pl-4 space-y-1">
                                {(value as string[]).map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            )
                          ) : (
                            <p className="leading-relaxed">{value as string}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {hypotheses && (
              <div className="mt-8">
                <h2 className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Lightbulb size={14} className="text-amber-500" /> Research Hypotheses
                </h2>
                <div className="flex flex-col gap-3">
                  {hypotheses.hypotheses.map((h, i) => (
                    <div key={i} className="card border-l-4 border-amber-400">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        <span className="font-semibold text-amber-600 mr-2">H{i + 1}.</span>
                        {h}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
