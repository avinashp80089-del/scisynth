import { NavLink, Outlet } from "react-router-dom";
import { BookOpen, FlaskConical, MessageSquare, Layers, Home } from "lucide-react";
import clsx from "clsx";

const nav = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/library", label: "Library", icon: BookOpen },
  { to: "/synthesis", label: "Synthesis", icon: Layers },
  { to: "/chat", label: "Research Chat", icon: MessageSquare },
  { to: "/analysis", label: "Analyze", icon: FlaskConical },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <nav className="flex w-56 flex-col border-r border-gray-200 bg-white px-3 py-6 shadow-sm">
        <div className="mb-8 px-3">
          <span className="text-xl font-bold tracking-tight text-brand-600">
            Sci<span className="text-gray-900">Synth</span>
          </span>
          <p className="mt-0.5 text-xs text-gray-400">AI Research Assistant</p>
        </div>

        <ul className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-auto px-3 text-xs text-gray-400">
          Powered by Claude claude-sonnet-4-6
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
