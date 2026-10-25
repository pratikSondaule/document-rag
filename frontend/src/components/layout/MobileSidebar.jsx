import { useEffect } from "react";
import { X } from "lucide-react";
import SidebarContent from "./Sidebar";

export default function MobileSidebar({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div
        className="absolute inset-0 bg-slate-900/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl"
      >
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute right-2 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
        >
          <X className="size-4" />
        </button>
        <SidebarContent onNavigate={onClose} />
      </aside>
    </div>
  );
}
