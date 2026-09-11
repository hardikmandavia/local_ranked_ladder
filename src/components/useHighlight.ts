import { useEffect, useRef, type RefObject } from "react";

export interface HighlightCell {
  row: number;
  col: number;
  pinned: boolean;
}

// Row + column highlighting for a <table> whose cells carry data-col and whose
// body rows carry data-row. Works by toggling classes on the DOM directly so a
// 150×10 table does not re-render on every mouse move. Hover highlights, click
// pins (click again or Esc unpins); on touch devices a tap pins.
export function useHighlight(
  tableRef: RefObject<HTMLTableElement | null>,
  onChange?: (cell: HighlightCell | null) => void
) {
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    let pinned: { row: number; col: number } | null = null;
    let current: { row: number; col: number } | null = null;

    const clear = () => {
      table.querySelectorAll(".hl-row").forEach((el) => el.classList.remove("hl-row", "pinned"));
      table.querySelectorAll(".hl-col").forEach((el) => el.classList.remove("hl-col", "pinned"));
    };

    const apply = (row: number, col: number, isPinned: boolean) => {
      clear();
      const tr = table.querySelector<HTMLTableRowElement>(`tbody tr[data-row="${row}"]`);
      tr?.classList.add("hl-row");
      if (isPinned) tr?.classList.add("pinned");
      table.querySelectorAll(`[data-col="${col}"]`).forEach((el) => {
        el.classList.add("hl-col");
        if (isPinned) el.classList.add("pinned");
      });
      current = { row, col };
      cb.current?.({ row, col, pinned: isPinned });
    };

    const cellOf = (target: EventTarget | null) => {
      const el = (target as Element | null)?.closest?.("td[data-col], th[data-col]") as HTMLElement | null;
      if (!el || !table.contains(el)) return null;
      const tr = el.closest("tr[data-row]") as HTMLElement | null;
      const col = Number(el.dataset.col);
      const row = tr ? Number(tr.dataset.row) : -1;
      return { row, col };
    };

    const onOver = (e: MouseEvent) => {
      if (pinned) return;
      const c = cellOf(e.target);
      if (!c) return;
      if (current && current.row === c.row && current.col === c.col) return;
      apply(c.row, c.col, false);
    };
    const onLeave = () => {
      if (pinned) return;
      clear();
      current = null;
      cb.current?.(null);
    };
    const onClick = (e: MouseEvent) => {
      const c = cellOf(e.target);
      if (!c) return;
      if (pinned && pinned.row === c.row && pinned.col === c.col) {
        pinned = null;
        apply(c.row, c.col, false);
        return;
      }
      pinned = c;
      apply(c.row, c.col, true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && pinned) {
        pinned = null;
        clear();
        current = null;
        cb.current?.(null);
      }
    };

    table.addEventListener("mouseover", onOver);
    table.addEventListener("mouseleave", onLeave);
    table.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      table.removeEventListener("mouseover", onOver);
      table.removeEventListener("mouseleave", onLeave);
      table.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      clear();
    };
  }, [tableRef]);
}
