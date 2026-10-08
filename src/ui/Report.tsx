import { useState } from "react";

import type { ReportEntry } from "../state/report";
import { entryText } from "../state/report";
import { copyText } from "./clipboard";

// The calculation report: each calculation kept, written out step by step so a client can follow it. Values are as
// they were when added. Each calculation can be removed; the whole report can be cleared or copied as text.
export function Report({ entries, onRemove, onClear }: { entries: ReportEntry[]; onRemove: (id: string) => void; onClear: () => void }) {
  const [copied, setCopied] = useState<"yes" | "no" | null>(null);
  if (!entries.length) {
    return <p className="report-empty">Nothing in the report yet. Use the report icon next to an answer to add its calculation here.</p>;
  }
  const copyAll = () => copyText(entries.map((e, i) => entryText(e, i + 1)).join("\n\n")).then((ok) => setCopied(ok ? "yes" : "no"));
  return (
    <div className="report">
      {entries.map((e, i) => (
        <section className="calc-sheet" key={e.id} aria-labelledby={`sheet-${e.id}`}>
          <header className="sheet-head">
            <h2 id={`sheet-${e.id}`}>
              <span className="sheet-n">{i + 1}</span> {e.title}
            </h2>
            <button type="button" className="icon quiet compact" aria-label={`Remove calculation ${i + 1}`} title="Remove" onClick={() => onRemove(e.id)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <dl className="steps">
            <dt>Given</dt>
            <dd>
              {e.given.map((g) => (
                <p key={g.text}>
                  {g.text} <span className="step-name">{g.name.toLowerCase()}</span>
                </p>
              ))}
            </dd>

            {e.convert.length > 0 && (
              <>
                <dt>In base units</dt>
                <dd>
                  {e.convert.map((c) => (
                    <p key={c}>{c}</p>
                  ))}
                </dd>
              </>
            )}

            <dt>Formula</dt>
            <dd>
              <p>{e.formula}</p>
            </dd>

            <dt>Substitution</dt>
            <dd>
              {e.substitution.map((s) => (
                <p key={s}>{s}</p>
              ))}
            </dd>

            <dt>Result</dt>
            <dd className="step-result">
              {e.result.map((r) => (
                <p key={r}>{r}</p>
              ))}
            </dd>

            <dt>Check</dt>
            <dd className={e.check.ok ? "step-ok" : "step-bad"}>
              <p>
                {e.check.text} <span className="step-mark">{e.check.ok ? "✓" : "✗"}</span>
              </p>
            </dd>
          </dl>
        </section>
      ))}
      <div className="report-actions">
        <button type="button" className="quiet compact" onClick={copyAll}>
          {copied === "yes" ? "Copied" : copied === "no" ? "Select and copy" : "Copy as text"}
        </button>
        <button type="button" className="quiet compact" onClick={onClear}>
          Clear report
        </button>
      </div>
    </div>
  );
}
