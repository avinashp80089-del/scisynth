import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchPapers, addPaper, listPapers, deletePaper } from "@/services/api";
import PaperCard from "@/components/PaperCard";
import type { Paper } from "@/types";

export default function Library() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Paper[]>([]);
  const [library, setLibrary] = useState<Paper[]>([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<"library" | "search">("library");
  const [error, setError] = useState("");

  const loadLibrary = () =>
    listPapers().then(setLibrary).catch(console.error);

  useEffect(() => {
    loadLibrary();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await searchPapers(query);
      setResults(res);
      setTab("search");
    } catch {
      setError("Search failed. Try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (id: string) => {
    await addPaper(id);
    await loadLibrary();
    // Refresh search results to reflect library status
    setResults((prev) =>
      prev.map((p) => (p.id === id ? { ...p, has_analysis: false } : p))
    );
  };

  const handleDelete = async (id: string) => {
    await deletePaper(id);
    await loadLibrary();
  };

  const inLibraryIds = new Set(library.map((p) => p.id));

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Paper Library</h1>
        <p className="mt-1 text-sm text-gray-500">
          Search arXiv and manage your research collection.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search arXiv — e.g. 'attention mechanism transformers'"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={searching}>
          {searching ? <Loader2 size={14} className="animate-spin" /> : null}
          Search
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {/* Tabs */}
      <div className="mb-5 flex gap-4 border-b border-gray-200">
        {(["library", "search"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-brand-600 text-brand-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "library"
              ? `My Library (${library.length})`
              : `Search Results (${results.length})`}
          </button>
        ))}
      </div>

      {tab === "library" && (
        <div className="grid gap-4">
          {library.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">
              Your library is empty — search for papers above to get started.
            </p>
          ) : (
            library.map((p) => (
              <PaperCard
                key={p.id}
                paper={p}
                inLibrary
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}

      {tab === "search" && (
        <div className="grid gap-4">
          {results.map((p) => (
            <PaperCard
              key={p.id}
              paper={p}
              inLibrary={inLibraryIds.has(p.id)}
              onAdd={inLibraryIds.has(p.id) ? undefined : handleAdd}
            />
          ))}
        </div>
      )}
    </div>
  );
}
