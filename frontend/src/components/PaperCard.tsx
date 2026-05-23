import { ExternalLink, Trash2, FlaskConical, CheckCircle } from "lucide-react";
import clsx from "clsx";
import type { Paper } from "@/types";

interface Props {
  paper: Paper;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onAdd?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAnalyze?: (id: string) => void;
  inLibrary?: boolean;
  compact?: boolean;
}

export default function PaperCard({
  paper,
  selected,
  onSelect,
  onAdd,
  onDelete,
  onAnalyze,
  inLibrary,
  compact,
}: Props) {
  const authorStr =
    paper.authors.length > 3
      ? `${paper.authors.slice(0, 3).join(", ")} et al.`
      : paper.authors.join(", ");

  return (
    <div
      className={clsx(
        "card transition-all",
        selected && "ring-2 ring-brand-500",
        onSelect && "cursor-pointer hover:shadow-md"
      )}
      onClick={() => onSelect?.(paper.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
            {paper.title}
          </h3>
          <p className="mt-1 text-xs text-gray-500">{authorStr}</p>
          {paper.published && (
            <p className="mt-0.5 text-xs text-gray-400">{paper.published}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {paper.has_analysis && (
            <span className="badge bg-green-100 text-green-700">
              <CheckCircle size={10} className="mr-1" /> analyzed
            </span>
          )}
          {paper.pdf_url && (
            <a
              href={paper.pdf_url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded p-1 text-gray-400 hover:text-brand-600"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {!compact && (
        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-gray-600">
          {paper.abstract}
        </p>
      )}

      {paper.categories.length > 0 && !compact && (
        <div className="mt-3 flex flex-wrap gap-1">
          {paper.categories.slice(0, 4).map((c) => (
            <span key={c} className="badge bg-gray-100 text-gray-600">
              {c}
            </span>
          ))}
        </div>
      )}

      {(onAdd || onDelete || onAnalyze) && (
        <div className="mt-4 flex items-center gap-2">
          {onAdd && !inLibrary && (
            <button
              className="btn-primary text-xs py-1"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(paper.id);
              }}
            >
              + Add to Library
            </button>
          )}
          {onAnalyze && inLibrary && (
            <button
              className="btn-secondary text-xs py-1"
              onClick={(e) => {
                e.stopPropagation();
                onAnalyze(paper.id);
              }}
            >
              <FlaskConical size={12} /> Analyze
            </button>
          )}
          {onDelete && inLibrary && (
            <button
              className="ml-auto rounded p-1 text-gray-400 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(paper.id);
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
