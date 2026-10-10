import { useId, useState } from "react";

import { INFO } from "./formulas";

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
                <dt>{f.equation}</dt>
                <dd>{f.meaning}</dd>
              </div>
            ))}
          </dl>
          <ul className="info-notes">
            {info.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
