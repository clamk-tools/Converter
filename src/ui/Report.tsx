import { useState } from "react";

import type { ReportEntry } from "../state/report";
import { displayName, entryText } from "../state/report";
import { copyText } from "./clipboard";

interface Props {
  entries: ReportEntry[];
  onRename: (id: string, name: string) => void;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

// The calculation report: each calculation kept, written out step by step so a client can follow it. Values are as
// they were when added. A calculation can be renamed, folded to its heading and result, or removed; the whole report
// can be folded, copied as text or cleared.
export function Report({ entries, onRename, onToggle, onToggleAll, onRemove, onClear }: Props) {
  const [copied, setCopied] = useState<"yes" | "no" | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; draft: string } | null>(null);

  if (!entries.length) {
    return <p className="report-empty">Nothing in the report yet. Use the report icon next to an answer to add its calculation here.</p>;
  }
  const copyAll = () => copyText(entries.map((e, i) => entryText(e, i + 1)).join("\n\n")).then((ok) => setCopied(ok ? "yes" : "no"));
  const finish = (save: boolean) => {
    if (renaming && save) onRename(renaming.id, renaming.draft);
    setRenaming(null);
  };

  return (
    <div className="report">
      {entries.map((e, i) => {
        const open = !e.collapsed;
        const editing = renaming?.id === e.id;
        return (
          <section className="calc-sheet" key={e.id} aria-labelledby={`sheet-${e.id}`}>
            <header className="sheet-head">
              <button
                type="button"
                className="icon quiet compact sheet-fold"
                aria-expanded={open}
                aria-controls={`steps-${e.id}`}
                aria-label={`${open ? "Collapse" : "Expand"} calculation ${i + 1}`}
                title={open ? "Collapse" : "Expand"}
                onClick={() => onToggle(e.id)}
              >
                <Icon>
                  <path d="m6 9 6 6 6-6" />
                </Icon>
              </button>

              <div className="sheet-title">
                {editing ? (
                  <input
                    className="sheet-rename"
                    autoFocus
                    aria-label={`Name for calculation ${i + 1}`}
                    value={renaming.draft}
                    maxLength={80}
                    placeholder={e.title}
                    onChange={(ev) => setRenaming({ id: e.id, draft: ev.target.value })}
                    onFocus={(ev) => ev.target.select()}
                    onBlur={() => finish(true)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter") finish(true);
                      if (ev.key === "Escape") finish(false);
                    }}
                  />
                ) : (
                  <h2 id={`sheet-${e.id}`}>
                    <span className="sheet-n">{i + 1}</span> {displayName(e)}
                    {e.name && <span className="sheet-kind">{e.title}</span>}
                  </h2>
                )}
                {!open && <p className="sheet-summary">{e.result[e.result.length - 1]}</p>}
              </div>

              {!editing && (
                <button
                  type="button"
                  className="icon quiet compact"
                  aria-label={`Rename calculation ${i + 1}`}
                  title="Rename"
                  onClick={() => setRenaming({ id: e.id, draft: e.name ?? "" })}
                >
                  <Icon>
                    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                  </Icon>
                </button>
              )}
              <button type="button" className="icon quiet compact" aria-label={`Remove calculation ${i + 1}`} title="Remove" onClick={() => onRemove(e.id)}>
                <Icon>
                  <path d="M18 6 6 18M6 6l12 12" />
                </Icon>
              </button>
            </header>

            {open && (
              <dl className="steps" id={`steps-${e.id}`}>
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
            )}
          </section>
        );
      })}
      <div className="report-actions">
        <button type="button" className="quiet compact" onClick={onToggleAll}>
          {entries.some((e) => !e.collapsed) ? "Collapse all" : "Expand all"}
        </button>
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
