import type { ReportEntry } from "../state/report";
import { SECTION_NAMES } from "../state/report";

// The report: one condensed line per calculation kept, numbered, in the order added. Values are as they were when
// added. Each line can be removed; the whole report can be cleared.
export function Report({ entries, onRemove, onClear }: { entries: ReportEntry[]; onRemove: (id: string) => void; onClear: () => void }) {
  if (!entries.length) {
    return <p className="report-empty">Nothing in the report yet. Use the report icon next to an answer to add it here.</p>;
  }
  return (
    <div className="report">
      <ol className="report-list">
        {entries.map((e, i) => (
          <li key={e.id} className="report-row">
            <span className="report-n">{i + 1}</span>
            <span className="report-kind">{SECTION_NAMES[e.section]}</span>
            <span className="report-calc">
              {e.inputs.map((input, k) => (
                <span key={k} className="report-term">
                  <span className="report-sym">{input.symbol}</span> {input.text}
                </span>
              ))}
              <span className="report-arrow" aria-label="gives">
                →
              </span>
              <span className="report-term report-result">
                <span className="report-sym">{e.result.symbol}</span> {e.result.text}
              </span>
            </span>
            <button type="button" className="icon quiet compact report-remove" aria-label={`Remove line ${i + 1}`} title="Remove" onClick={() => onRemove(e.id)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="quiet compact report-clear" onClick={onClear}>
        Clear report
      </button>
    </div>
  );
}
