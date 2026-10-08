import type { Dispatch } from "react";
import { useId } from "react";

import type { Action, Derived, OutputId, State } from "../state/model";
import { boxText, firstIssue, issueAt, unitOf } from "../state/model";
import { unit } from "../units/units";
import { CopyButton } from "./CopyButton";
import type { CalculatorSpec } from "./sections";
import { allUnitsText, dilutionSummary, missingText, solutionSummary } from "./summary";
import { UnitSelect } from "./UnitSelect";

interface Props {
  spec: CalculatorSpec;
  state: State;
  derived: Derived;
  dispatch: Dispatch<Action>;
}

// One calculator: its inputs (a box and a unit menu each), then its answer with the same answer in every unit.
// A box here and the box of the same quantity in another calculator show one stored value: typing in either
// changes both (state/model.ts).
export function Calculator({ spec, state, derived, dispatch }: Props) {
  const id = useId();
  const result = spec.id === "dilution" ? derived.dilution : derived.solutions[spec.id];
  const summary = spec.id === "dilution" ? dilutionSummary(state, derived) : solutionSummary(state, derived, spec.id);
  const problem = firstIssue(state, derived, spec.id, spec.inputs.map((i) => i.field));
  const note = spec.id === "dilution" ? derived.dilution.note : null;

  return (
    <section className="calc" aria-labelledby={`${id}-title`} data-calculator={spec.id}>
      <div className="calc-head">
        <h2 id={`${id}-title`}>{spec.title}</h2>
        <code className="calc-formula">{spec.formula}</code>
      </div>

      <div className="calc-rows">
        {spec.inputs.map(({ field, label }) => {
          const issue = issueAt(state, derived, spec.id, field);
          const shown = unitOf(state, field);
          return (
            <div className={`row${issue ? " has-issue" : ""}`} key={field}>
              <label className="row-label" htmlFor={`${id}-${field}`}>
                {label}
              </label>
              <input
                id={`${id}-${field}`}
                className="row-value"
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-label={`${label} in ${unit(shown).symbol}`}
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
      </div>

      <div className={`calc-result${summary ? " ready" : ""}`}>
        <ResultLine quantity={spec.result.quantity} label={spec.result.label} state={state} derived={derived} dispatch={dispatch} copy={summary?.copy} />
        {spec.extra && <ResultLine quantity={spec.extra.quantity} label={spec.extra.label} state={state} derived={derived} dispatch={dispatch} />}
        <p className="calc-status" role="status" aria-live="polite">
          {summary ? summary.sentence : problem ? `Not calculated. ${problem}` : missingText(result.missing)}
        </p>
        {note && <p className="calc-note">{note}</p>}
      </div>
    </section>
  );
}

function ResultLine({ quantity, label, state, derived, dispatch, copy }: { quantity: OutputId; label: string; state: State; derived: Derived; dispatch: Dispatch<Action>; copy?: string }) {
  const shown = unitOf(state, quantity);
  const others = allUnitsText(state, derived, quantity);
  return (
    <div className="result">
      <span className="row-label">{label}</span>
      <input className="row-value" type="text" readOnly aria-label={`${label} in ${unit(shown).symbol}`} placeholder="–" value={boxText(state, derived, quantity, shown)} />
      <UnitSelect quantity={quantity} label={label} state={state} dispatch={dispatch} />
      {copy ? <CopyButton text={copy} label={`Copy ${label.toLowerCase()}`} /> : <span className="copy-slot" />}
      {others && <p className="result-units">= {others}</p>}
    </div>
  );
}
