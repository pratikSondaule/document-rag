import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import SidebarContent from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import { SessionsProvider } from "../../context/SessionsContext";

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <SessionsProvider>
      <div className="flex h-dvh bg-slate-50">
        {/* Desktop: persistent sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
          <SidebarContent />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile/tablet: top bar + drawer */}
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              className="-ml-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              <Menu className="size-5" />
            </button>
            <span className="font-semibold tracking-tight">Document RAG</span>
          </header>

          <main className="relative min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
        <MobileSidebar open={drawerOpen} onClose={closeDrawer} />
      </div>
    </SessionsProvider>
  );
}
