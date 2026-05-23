import { useEffect, useRef, useState } from "react";
import { Loader2, Layers } from "lucide-react";
import { listPapers, streamSynthesis } from "@/services/api";
import PaperCard from "@/components/PaperCard";
import ReactMarkdown from "react-markdown";
import type { Paper } from "@/types";

export default function Synthesis() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState("");
  const [review, setReview] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    listPapers().then(setPapers).catch(console.error);
  }, []);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleGenerate = async () => {
    if (selected.size < 2) return;
    setReview("");
    setStreaming(true);
    abortRef.current = false;

    try {
      for await (const chunk of streamSynthesis([...selected], focus || undefined)) {
        if (abortRef.current) break;
        setReview((prev) => prev + chunk);
      }
    } finally {
      setStreaming(false);
    }
  };

  const handleStop = () => {
    abortRef.current = true;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Selection sidebar */}
      <div className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Select Papers</h2>
          <p className="mt-0.5 text-xs text-gray-400">Choose ≥2 to synthesize</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {papers.length === 0 ? (
            <p className="text-xs text-gray-400">No papers yet — add some in the Library.</p>
          ) : (
            papers.map((p) => (
              <PaperCard
                key={p.id}
                paper={p}
                compact
                selected={selected.has(p.id)}
                onSelect={toggleSelect}
              />
            ))
          )}
        </div>
        <div className="p-4 border-t border-gray-100 flex flex-col gap-3">
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Optional: focus area or theme"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            className="btn-primary w-full justify-center"
            disabled={selected.size < 2 || streaming}
            onClick={handleGenerate}
          >
            {streaming ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Layers size={14} />
            )}
            {streaming ? "Generating…" : `Synthesize ${selected.size} papers`}
          </button>
          {streaming && (
            <button className="btn-secondary w-full justify-center" onClick={handleStop}>
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Review output */}
      <div className="flex-1 overflow-y-auto p-8">
        {!review && !streaming ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-gray-400">
            <div>
              <Layers size={32} className="mx-auto mb-3 text-gray-300" />
              Select papers and click Synthesize to generate a literature review.
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            <div className="prose prose-sm max-w-none text-gray-800 streaming-text">
              <ReactMarkdown>{review}</ReactMarkdown>
            </div>
            {streaming && (
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <Loader2 size={12} className="animate-spin" />
                Generating…
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
