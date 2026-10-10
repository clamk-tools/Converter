import type { Dispatch } from "react";
import { useId } from "react";

import type { Action, Derived, State } from "../state/model";
import { boxText, issueAt, resultText, unitOf } from "../state/model";
import { unit } from "../units/units";
import { AddToReport } from "./AddToReport";
import type { CalculatorSpec } from "./sections";
import { InfoBubble } from "./InfoBubble";
import { UnitSelect } from "./UnitSelect";

interface Props {
  spec: CalculatorSpec;
  state: State;
  derived: Derived;
  dispatch: Dispatch<Action>;
  /** puts this calculator's answer, with its inputs, in the report */
  onAdd: () => void;
}

// A calculator laid out as on GraphPad (the dilution): a row per input (label, box, unit menu), then "Answer =" and
// the answer with its unit. The answer follows every keystroke.
export function Calculator({ spec, state, derived, dispatch, onAdd }: Props) {
  const id = useId();
  const answer = resultText(state, derived, spec.result.quantity);
  const note = derived.dilution.note;

  return (
    <section className="calc" aria-labelledby={`${id}-title`} data-calculator={spec.id}>
      <div className="calc-head">
        <h2 id={`${id}-title`}>{spec.title}</h2>
        <InfoBubble calculator={spec.id} title={spec.title} />
      </div>

      {spec.inputs.map(({ field, label }) => {
        const issue = issueAt(state, derived, spec.id, field);
        const shown = unitOf(state, field);
        return (
          <div className={`row${issue ? " has-issue" : ""}`} key={field}>
            <label className="row-label" htmlFor={`${id}-${field}`}>
              {label}:
            </label>
            <input
              id={`${id}-${field}`}
              className="row-value"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label={`${label} in ${unit(shown).name}`}
              aria-invalid={issue ? true : undefined}
              aria-describedby={issue ? `${id}-${field}-issue` : undefined}
              value={boxText(state, derived, field, shown, spec.id)}
              onChange={(e) => dispatch({ type: "type", field, unit: shown, text: e.target.value, box: spec.id })}
              onBlur={() => dispatch({ type: "leave", field })}
            />
            <UnitSelect quantity={field} label={label} state={state} dispatch={dispatch} />
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
        <AddToReport what={spec.result.label.toLowerCase()} disabled={!answer} onAdd={onAdd} />
      </div>
      {note && <p className="calc-note">{note}</p>}
    </section>
  );
}
