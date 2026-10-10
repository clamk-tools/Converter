import type { Dispatch } from "react";
import { useId } from "react";

import type { Action, Derived, State } from "../state/model";
import { RESULT_OF, boxText, issueAt, resultNumber, unitOf } from "../state/model";
import { unit } from "../units/units";
import { AddToReport } from "./AddToReport";
import { SOLVED_BY } from "./formulas";
import { InfoBubble } from "./InfoBubble";
import { SOLUTION } from "./sections";
import { UnitSelect } from "./UnitSelect";

interface Props {
  state: State;
  derived: Derived;
  dispatch: Dispatch<Action>;
  /** puts the answer, with its inputs, in the report */
  onAdd: () => void;
}

// Calculator 1: m = C × V × MW as four tiles, two by two. The molecular weight (top left, grey: a constant of the
// substance) is always typed. Ticking the name of one of the other three finds it from the rest: its tile turns blue and
// shows the answer, in the unit of its menu. The answer follows every keystroke; ticking another tile keeps the answer
// in its box as a typed value (state/model.ts).
export function SolutionCard({ state, derived, dispatch, onAdd }: Props) {
  const id = useId();
  const find = state.find;
  const answer = resultNumber(state, derived, RESULT_OF[find]);

  return (
    <section className="calc" aria-labelledby={`${id}-title`} data-calculator="solution">
      <div className="calc-head">
        <h2 id={`${id}-title`}>{SOLUTION.title}</h2>
        <InfoBubble calculator="solution" title={SOLUTION.title} />
      </div>
      <p className="calc-hint">Tick the value to find, type the other two.</p>

      <div className="tiles">
        {SOLUTION.tiles.map(({ field, label }) => {
          const fixed = field === "molarMass";
          const found = field === find;
          const issue = found ? null : issueAt(state, derived, "solution", field);
          const shown = unitOf(state, field);
          const boxId = `${id}-${field}`;
          return (
            <div className={`tile${fixed ? " fixed" : ""}${found ? " found" : ""}${issue ? " has-issue" : ""}`} key={field}>
              {fixed ? (
                <div className="tile-head">
                  <label className="tile-name" htmlFor={boxId}>
                    {label}
                  </label>
                  <span className="tile-note">constant</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="tile-head tile-find"
                  aria-pressed={found}
                  aria-label={`Find ${label.toLowerCase()}`}
                  onClick={() => dispatch({ type: "find", target: field })}
                >
                  <span className="tick" aria-hidden="true">
                    {found && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className="tile-name">{label}</span>
                  {found && <span className="tile-note">Finding</span>}
                </button>
              )}

              <div className="tile-field">
                {found ? (
                  <output className="tile-answer" aria-label={`${label}, answer`} aria-live="polite">
                    {answer}
                  </output>
                ) : (
                  <input
                    id={boxId}
                    className="tile-value"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    aria-label={fixed ? "Molecular weight (g/mol or Da)" : `${label} in ${unit(shown).name}`}
                    aria-invalid={issue ? true : undefined}
                    aria-describedby={issue ? `${boxId}-issue` : undefined}
                    value={boxText(state, derived, field, shown, "solution")}
                    onChange={(e) => dispatch({ type: "type", field, unit: shown, text: e.target.value, box: "solution" })}
                    onBlur={() => dispatch({ type: "leave", field })}
                  />
                )}
                {fixed ? <span className="tile-unit">g/mol or Da</span> : <UnitSelect quantity={field} label={label} state={state} dispatch={dispatch} />}
              </div>
              {issue && (
                <p className="row-issue" id={`${boxId}-issue`}>
                  {issue}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="calc-foot">
        <span className="calc-formula">{SOLVED_BY[find]}</span>
        <AddToReport what={find} disabled={!answer} onAdd={onAdd} />
      </div>
    </section>
  );
}
