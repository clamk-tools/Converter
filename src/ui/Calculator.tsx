import type { Dispatch } from "react";
import { useId } from "react";

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
}

// One calculator, laid out as on GraphPad: a row per input (label, box, unit menu; the formula weight has no menu),
// then "Answer =" and the answer with its unit. A box here and the box of the same quantity in another calculator
// show one stored value: typing in either changes both (state/model.ts). The answer follows every keystroke.
export function Calculator({ spec, state, derived, dispatch }: Props) {
  const id = useId();
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
      </div>
      {note && <p className="calc-note">{note}</p>}
    </section>
  );
}
