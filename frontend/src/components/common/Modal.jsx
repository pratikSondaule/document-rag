import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  dismissible = true,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    (
      panel?.querySelector("[data-autofocus]") ??
      panel?.querySelector(FOCUSABLE) ??
      panel
    )?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e) => {
    if (e.key === "Escape" && dismissible) {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === "Tab") {
      const els = [...panelRef.current.querySelectorAll(FOCUSABLE)];
      if (!els.length) return e.preventDefault();
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      onKeyDown={onKeyDown}
    >
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative flex max-h-[85dvh] w-full flex-col rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl ${
          size === "lg" ? "sm:max-w-lg" : "sm:max-w-md"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && (
          <div className="border-t border-slate-100 px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
