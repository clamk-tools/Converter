import { CopyButton } from "./CopyButton";
import type { Summary } from "./summary";

interface Props {
  summary: Summary | null;
  /** "Fill in volume." */
  missing: string | null;
  /** the first problem found, already shown at its box */
  problem: string | null;
  note?: string | null;
  formula: string;
  copyLabel: string;
}

// The answer in one sentence, with its Copy button; or why there is none yet; and the formula used.
export function ResultBar({ summary, missing, problem, note, formula, copyLabel }: Props) {
  return (
    <div className={`resultbar${summary ? " ready" : ""}`}>
      <div className="resultbar-text" role="status" aria-live="polite">
        {summary ? <p className="resultbar-sentence">{summary.sentence}</p> : <p className="resultbar-wait">{problem ? `Not calculated. ${problem}` : missing}</p>}
        {note && <p className="resultbar-note">{note}</p>}
      </div>
      {summary && <CopyButton text={summary.copy} label={copyLabel} />}
      <p className="formula">
        <code>{formula}</code>
      </p>
    </div>
  );
}
