import type { Dispatch } from "react";
import { useEffect, useId, useState } from "react";

import type { Action, Derived, State } from "../state/model";
import { boxText, issueAt, resultText, unitOf } from "../state/model";
import { unit } from "../units/units";
import type { CalculatorSpec } from "./sections";
import { UnitSelect } from "./UnitSelect";

interface Props {
  spec: CalculatorSpec;
  state: State;
  derived: Derived;
  dispatch: Dispatch<Action>;
  /** puts this calculator's answer, with its inputs, in the report */
  onAdd: () => void;
}

// One calculator, laid out as on GraphPad: a row per input (label, box, unit menu; the molecular weight has no menu),
// then "Answer =" and the answer with its unit. A box here and the box of the same quantity in another calculator
// show one stored value: typing in either changes both (state/model.ts). The answer follows every keystroke.
export function Calculator({ spec, state, derived, dispatch, onAdd }: Props) {
  const id = useId();
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(timer);
  }, [added]);
  const answer = resultText(state, derived, spec.result.quantity);
  const note = spec.id === "dilution" ? derived.dilution.note : null;

  return (
    <section className="calc" aria-labelledby={`${id}-title`} data-calculator={spec.id}>
      <h2 id={`${id}-title`}>{spec.title}</h2>

      {spec.inputs.map(({ field, label }) => {
        const issue = issueAt(state, derived, spec.id, field);
        const shown = unitOf(state, field);
        const fixedUnit = field === "molarMass";
        return (
          <div className={`row${fixedUnit ? " fixed-unit" : ""}${issue ? " has-issue" : ""}`} key={field}>
            <label className="row-label" htmlFor={`${id}-${field}`}>
              {label}:
            </label>
            <input
              id={`${id}-${field}`}
              className="row-value"
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label={fixedUnit ? label : `${label} in ${unit(shown).name}`}
              aria-invalid={issue ? true : undefined}
              aria-describedby={issue ? `${id}-${field}-issue` : undefined}
              value={boxText(state, derived, field, shown, spec.id)}
              onChange={(e) => dispatch({ type: "type", field, unit: shown, text: e.target.value, box: spec.id })}
              onBlur={() => dispatch({ type: "leave", field })}
            />
            {!fixedUnit && <UnitSelect quantity={field} label={label} state={state} dispatch={dispatch} />}
            {issue && (
              <p className="row-issue" id={`${id}-${field}-issue`}>
                {issue}
              </p>
            )}
          </div>
        );
      })}

      <div className={`row result${answer ? " ready" : ""}`}>
        <span className="result-label" id={`${id}-result`}>
          {spec.result.label} =
        </span>
        <output className="result-value" aria-labelledby={`${id}-result`} aria-live="polite">
          {answer}
        </output>
        <button
          type="button"
          className={`icon add-report${added ? " added" : ""}`}
          aria-label={added ? "Added to report" : `Add ${spec.result.label.toLowerCase()} to report`}
          title={added ? "Added to report" : "Add to report"}
          disabled={!answer}
          onClick={() => {
            onAdd();
            setAdded(true);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {added ? (
              <path d="M20 6 9 17l-5-5" />
            ) : (
              <>
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5M12 11v6M9 14h6" />
              </>
            )}
          </svg>
        </button>
      </div>
      {note && <p className="calc-note">{note}</p>}
    </section>
  );
}
