import { Link, NavLink } from "react-router-dom";
import {
  FileText,
  FolderOpen,
  LogOut,
  MessageSquare,
  Plus,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import SessionList from "./SessionList";

const navItems = [
  { to: "/app", label: "Chat", icon: MessageSquare, end: true },
  { to: "/app/documents", label: "Documents", icon: FolderOpen },
];

export default function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const label = user?.name || user?.email || "Account";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 pt-4">
        <div className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
          <FileText className="size-4" strokeWidth={1.75} />
        </div>
        <span className="font-semibold tracking-tight">Document RAG</span>
      </div>

      <div className="px-3 pt-4">
        <Link
          to="/app"
          onClick={onNavigate}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 motion-reduce:transition-none"
        >
          <Plus className="size-4" /> New chat
        </Link>
      </div>

      <nav aria-label="Main" className="mt-4 space-y-1 px-3">
        {navItems.map(({ to, label: text, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600 motion-reduce:transition-none ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            <Icon className="size-4" strokeWidth={1.75} />
            {text}
          </NavLink>
        ))}
      </nav>

      <SessionList onNavigate={onNavigate} />

      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
            {label.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {label}
            </p>
            {user?.name && user?.email && (
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            title="Log out"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-600 motion-reduce:transition-none"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
