import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const config = {
  pending: {
    label: "Processing",
    icon: Loader2,
    spin: true,
    cls: "bg-slate-100 text-slate-600",
  },
  ready: {
    label: "Ready",
    icon: CheckCircle2,
    cls: "bg-emerald-50 text-emerald-700",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    cls: "bg-red-50 text-red-700",
  },
};

export default function DocumentStatus({ status }) {
  const c = config[status];
  if (!c) {
    return (
      <span className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2.5 text-xs font-medium capitalize text-slate-600">
        {status || "Unknown"}
      </span>
    );
  }
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ${c.cls}`}
    >
      <Icon
        className={`size-3.5 ${c.spin ? "animate-spin motion-reduce:animate-none" : ""}`}
        aria-hidden="true"
      />
      {c.label}
    </span>
  );
}
