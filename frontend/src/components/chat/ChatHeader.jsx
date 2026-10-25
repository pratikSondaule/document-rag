export default function ChatHeader({ title }) {
  return (
    <div className="flex h-12 shrink-0 items-center border-b border-slate-200 bg-white px-4">
      <p className="truncate text-sm font-medium text-slate-900">{title}</p>
    </div>
  );
}
