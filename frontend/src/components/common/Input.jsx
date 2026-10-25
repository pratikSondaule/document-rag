import { forwardRef, useId } from "react";

const Input = forwardRef(function Input(
  { label, error, hint, rightSlot, id, className = "", ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`block h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900
            placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2
            disabled:bg-slate-50 disabled:text-slate-500 motion-reduce:transition-none
            ${rightSlot ? "pr-10" : ""}
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
            }`}
          {...props}
        />
        {rightSlot && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {rightSlot}
          </div>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
