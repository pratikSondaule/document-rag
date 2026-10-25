import LoadingSpinner from "./LoadingSpinner";

const variants = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600 disabled:bg-indigo-300",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus-visible:outline-indigo-600 disabled:text-slate-400",
  ghost:
    "text-slate-600 hover:bg-slate-100 focus-visible:outline-indigo-600 disabled:text-slate-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 disabled:bg-red-300",
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium
        transition-colors focus-visible:outline-2 focus-visible:outline-offset-2
        disabled:cursor-not-allowed motion-reduce:transition-none ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <LoadingSpinner className="size-4" />}
      {children}
    </button>
  );
}
