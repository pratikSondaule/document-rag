import { FileText } from "lucide-react";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="grid size-9 place-items-center rounded-lg bg-indigo-600 text-white">
          <FileText className="size-5" strokeWidth={1.75} />
        </div>
        <span className="text-lg font-semibold tracking-tight">
          Document RAG
        </span>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>

      <p className="mt-6 text-sm text-slate-500">{footer}</p>
    </main>
  );
}
