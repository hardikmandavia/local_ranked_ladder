import { useEffect, useId, useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
  hint?: string; // e.g. "12 of 149 players"
  debounceMs?: number;
  className?: string;
}

export function SearchBox({ value, onChange, placeholder, label, hint, debounceMs = 150, className = "" }: Props) {
  const id = useId();
  const [text, setText] = useState(value);

  // keep local text in sync when the URL changes externally (back button, clear)
  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (text === value) return;
    const t = setTimeout(() => onChange(text), debounceMs);
    return () => clearTimeout(t);
  }, [text, value, onChange, debounceMs]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative flex-1 min-w-0">
        <svg aria-hidden="true" viewBox="0 0 20 20" className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-faint">
          <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          id={id}
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          className="w-full rounded-lg border border-app bg-surface pl-9 pr-9 py-2 text-sm text-app placeholder:text-faint focus:border-strong [&::-webkit-search-cancel-button]:hidden"
        />
        {text && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setText("");
              onChange("");
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-app"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      {hint && (
        <span className="text-xs text-muted whitespace-nowrap tabular" aria-live="polite">
          {hint}
        </span>
      )}
    </div>
  );
}
