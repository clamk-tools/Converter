import { useEffect, useState } from "react";

import type { ReportEntry } from "../state/report";
import { answerOf, displayName, entryText, readable } from "../state/report";
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

/** One labelled row of a worked calculation: its step number (or ✓ for the check), its name, then its lines. */
const Step = ({ mark, label, className, children }: { mark: string; label: string; className?: string; children: React.ReactNode }) => (
  <div className={className ? `step ${className}` : "step"}>
    <dt>
      <span className="step-no">{mark}</span> {label}
    </dt>
    <dd>{children}</dd>
  </div>
);

const lines = (texts: string[]) => texts.map((t) => <p key={t}>{readable(t)}</p>);

// The calculation report: each calculation kept, written out as numbered steps (given, convert, apply, result) and a
// check, so a client can follow it. Values are as they were when added. The answer stays in a calculation's header,
// so a folded report reads as a list of results; the whole header folds it. An open calculation can be renamed or
// removed from its foot; the whole report can be folded, copied as text or cleared from the bar above it. Clearing asks
// once more first: it cannot be undone.
export function Report({ entries, onRename, onToggle, onToggleAll, onRemove, onClear }: Props) {
  const [copied, setCopied] = useState<"yes" | "no" | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; draft: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  // "Copied" is said for a moment, then the button reads "Copy as text" again
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

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
      <div className="report-bar">
        <span className="report-count">
          Report · {entries.length} calculation{entries.length > 1 ? "s" : ""}
        </span>
        <div className="report-actions">
          <button type="button" className="quiet compact" onClick={onToggleAll}>
            {entries.some((e) => !e.collapsed) ? "Collapse all" : "Expand all"}
          </button>
          <button type="button" className="quiet compact" onClick={copyAll}>
            {copied === "yes" ? "Copied" : copied === "no" ? "Select and copy" : "Copy as text"}
          </button>
          {confirming ? (
            <>
              <button
                type="button"
                className="danger compact"
                onClick={() => {
                  setConfirming(false);
                  onClear();
                }}
              >
                Delete all
              </button>
              {/* focus lands on the safe choice, so a second Enter does not delete */}
              <button type="button" className="quiet compact" autoFocus onClick={() => setConfirming(false)}>
                Keep
              </button>
            </>
          ) : (
            <button type="button" className="quiet compact" onClick={() => setConfirming(true)}>
              Clear report
            </button>
          )}
        </div>
      </div>

      {entries.map((e, i) => {
        const open = !e.collapsed;
        const editing = renaming?.id === e.id;
        const apply = e.convert.length > 0 ? 3 : 2; // the conversion step is there only when a value needed one
        const [baseResult, chosenResult] = e.result.length > 1 ? e.result : [null, e.result[0]];
        return (
          <section className="calc-sheet" key={e.id} aria-labelledby={`sheet-${e.id}`}>
            <header className="sheet-head">
              {/* its hit area covers the whole header, so the name and the answer fold the calculation too */}
              <button
                type="button"
                className="icon quiet sheet-fold"
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
              </div>

              <p className="sheet-answer">{readable(answerOf(e))}</p>
            </header>

            {open && (
              <div id={`steps-${e.id}`}>
                <dl className="steps">
                  <Step mark="1" label="Given">
                    {e.given.map((g) => (
                      <p key={g.text}>
                        {readable(g.text)} <span className="step-name">{g.name.toLowerCase()}</span>
                      </p>
                    ))}
                  </Step>
                  {e.convert.length > 0 && (
                    <Step mark="2" label="Convert">
                      {lines(e.convert)}
                    </Step>
                  )}
                  <Step mark={String(apply)} label="Apply">
                    {lines([e.formula, ...e.substitution])}
                  </Step>
                  <Step mark={String(apply + 1)} label="Result" className="step-result">
                    <p className="step-answer">{readable(chosenResult)}</p>
                    {baseResult && <p className="step-base">{readable(baseResult)}</p>}
                  </Step>
                  <Step mark={e.check.ok ? "✓" : "✗"} label="Check" className={e.check.ok ? "step-ok" : "step-bad"}>
                    <p>{readable(e.check.text)}</p>
                  </Step>
                </dl>

                <div className="sheet-foot">
                  <span className={e.check.ok ? "check-chip ok" : "check-chip bad"}>{e.check.ok ? "✓ checked" : "✗ check failed"}</span>
                  <div className="sheet-actions">
                    {!editing && (
                      <button type="button" className="quiet compact" aria-label={`Rename calculation ${i + 1}`} onClick={() => setRenaming({ id: e.id, draft: e.name ?? "" })}>
                        Rename
                      </button>
                    )}
                    <button type="button" className="quiet compact sheet-remove" aria-label={`Remove calculation ${i + 1}`} onClick={() => onRemove(e.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
