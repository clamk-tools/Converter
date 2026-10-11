import type { KeyboardEvent, ReactNode } from "react";

/** What the page shows: one calculator, or the report. */
export type View = "solution" | "dilution" | "convert" | "report";

const ICON: Record<View, ReactNode> = {
  // a flask: making a solution
  solution: (
    <>
      <path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" />
      <path d="M7 15h10" />
    </>
  ),
  // a drop: diluting
  dilution: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  // two arrows: converting one way or the other
  convert: <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />,
  // a sheet: the report
  report: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
};

const ORDER: View[] = ["solution", "dilution", "convert", "report"];

interface Props {
  view: View;
  onView: (view: View) => void;
  /** the number of calculations in the report, shown beside its name */
  reportCount: number;
}

// The four destinations of the page, each an icon and a word. One list of tabs; the stylesheet places it: a bar along
// the bottom of a phone, a rail down the left of a laptop (calc.css, "views"). Arrow keys move between them, as in any
// tab list, whichever way it runs.
export function ViewNav({ view, onView, reportCount }: Props) {
  const label: Record<View, string> = {
    solution: "Solution",
    dilution: "Dilution",
    convert: "Convert",
    report: `Report${reportCount ? ` (${reportCount})` : ""}`,
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = ORDER[(ORDER.indexOf(view) + step + ORDER.length) % ORDER.length];
    onView(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <div className="views" role="tablist" aria-label="View" onKeyDown={onKey}>
      {ORDER.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`tab-${id}`}
          className="view-tab"
          aria-selected={view === id}
          aria-controls="panel"
          tabIndex={view === id ? 0 : -1}
          onClick={() => onView(id)}
        >
          <span className="view-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {ICON[id]}
            </svg>
          </span>
          <span className="view-label">{label[id]}</span>
        </button>
      ))}
    </div>
  );
}
