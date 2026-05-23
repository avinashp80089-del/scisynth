import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Layers, MessageSquare, FlaskConical, ArrowRight } from "lucide-react";
import { listPapers } from "@/services/api";
import type { Paper } from "@/types";

const features = [
  {
    icon: BookOpen,
    title: "Paper Library",
    description: "Search arXiv and build a curated library of relevant papers.",
    to: "/library",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: FlaskConical,
    title: "Deep Analysis",
    description: "AI-powered extraction of methods, findings, and limitations.",
    to: "/analysis",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Layers,
    title: "Literature Synthesis",
    description: "Generate coherent multi-paper literature reviews instantly.",
    to: "/synthesis",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: MessageSquare,
    title: "Research Chat",
    description: "Ask questions about your library — grounded in the papers.",
    to: "/chat",
    color: "bg-green-50 text-green-600",
  },
];

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>([]);

  useEffect(() => {
    listPapers().then(setPapers).catch(console.error);
  }, []);

  const analyzed = papers.filter((p) => p.has_analysis).length;

  return (
    <div className="mx-auto max-w-4xl px-8 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Welcome to SciSynth
        </h1>
        <p className="mt-2 text-gray-500">
          AI-native scientific research synthesis — from paper discovery to hypothesis generation.
        </p>
      </div>

      {/* Stats */}
      {papers.length > 0 && (
        <div className="mb-10 grid grid-cols-3 gap-4">
          {[
            { label: "Papers in library", value: papers.length },
            { label: "Papers analyzed", value: analyzed },
            { label: "Ready for synthesis", value: papers.length >= 2 ? "Yes" : "Need ≥2" },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center">
              <p className="text-2xl font-bold text-brand-600">{value}</p>
              <p className="mt-1 text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Feature cards */}
      <div className="grid grid-cols-2 gap-4">
        {features.map(({ icon: Icon, title, description, to, color }) => (
          <Link
            key={to}
            to={to}
            className="card group flex flex-col gap-3 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>
            <div className="mt-auto flex items-center gap-1 text-xs font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Get started <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
