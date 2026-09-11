import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode; // rendered inside an h2
  children: ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Accessible dialog: role=dialog + aria-modal, focus trapped while open and
// returned to the opener on close, closes on Esc / overlay click / close button.
// Renders as a bottom sheet on phones (see .sheet in index.css).
export function Modal({ open, onClose, title, children }: Props) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  // Keep the latest onClose without re-running the focus effect when its identity changes.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    const sheet = sheetRef.current;
    const first = sheet?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? sheet)?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !sheet) return;
      const items = [...sheet.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        sheet.focus();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === firstEl || document.activeElement === sheet)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      openerRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="sheet outline-none">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-app bg-surface px-4 py-3 sm:px-5">
          <h2 id={titleId} className="min-w-0 text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 shrink-0 rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-app"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-4 py-4 sm:px-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
