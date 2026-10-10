import { useId, useState } from "react";

import { INFO } from "./formulas";

// The symbols (C, V, m, n, MW, ρ and their numbered forms) are written in bold; units and words stay regular.
const SYMBOL = /(?<![A-Za-z])(MW|ρ|[CVmn][₁₂]?)(?![A-Za-z])/g;

function symbols(text: string) {
  return text.split(SYMBOL).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

interface Props {
  calculator: keyof typeof INFO;
  title: string;
}

// The "i" beside a calculator's title. Pressing it opens a bubble under the title with every formula the calculator
// uses and the rules that go with them (ui/formulas.ts). Pressed again, or Escape, it closes.
export function InfoBubble({ calculator, title }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const info = INFO[calculator];

  return (
    <>
      <button
        type="button"
        className="info-button"
        aria-expanded={open}
        aria-controls={`${id}-bubble`}
        aria-label={`Formulas used in ${title}`}
        title="Formulas used"
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      >
        i
      </button>
      {open && (
        <div className="info-bubble" id={`${id}-bubble`} role="region" aria-label={`Formulas used in ${title}`}>
          <dl className="info-formulas">
            {info.formulas.map((f) => (
              <div key={f.equation}>
                <dt>{symbols(f.equation)}</dt>
                {f.meaning && <dd>{f.meaning}</dd>}
              </div>
            ))}
          </dl>
          <ul className="info-notes">
            {info.notes.map((n) => (
              <li key={n}>{symbols(n)}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
