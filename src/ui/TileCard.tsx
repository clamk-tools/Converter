import type { Dispatch } from "react";
import { useId } from "react";

import type { Action, Derived, DilutionFor, OutputId, SolveFor, State } from "../state/model";
import { boxText, issueAt, resultNumber, unitOf } from "../state/model";
import { unit } from "../units/units";
import { AddToReport } from "./AddToReport";
import { InfoBubble } from "./InfoBubble";
import type { TileCardSpec } from "./sections";
import { UnitSelect } from "./UnitSelect";

interface Props {
  spec: TileCardSpec;
  /** the quantity being found, and the answer that holds it */
  find: SolveFor | DilutionFor;
  result: OutputId;
  /** the formula used to find it, shown under the tiles */
  formula: string;
  /** a remark that is not a problem ("use the stock as it is") */
  note?: string | null;
  /** the words of the add-to-report button: "mass" gives "Add mass to report" */
  reportWhat: string;
  state: State;
  derived: Derived;
  dispatch: Dispatch<Action>;
  onAdd: () => void;
}

// A calculator as four tiles, two by two (calculators 1 and 2). Ticking a tile's name finds that quantity from the
// others: its tile turns blue and shows the answer, in the unit of its menu. The answer follows every keystroke;
// ticking another tile keeps the answer in its box as a typed value (state/model.ts). A fixed tile (the molecular
// weight) is grey and always typed. On a laptop a tile's number and unit menu sit side by side; on a phone, stacked.
export function TileCard({ spec, find, result, formula, note, reportWhat, state, derived, dispatch, onAdd }: Props) {
  const id = useId();
  const answer = resultNumber(state, derived, result);

  return (
    <section className="calc" aria-labelledby={`${id}-title`} data-calculator={spec.id}>
      <div className="calc-head">
        <h2 id={`${id}-title`}>{spec.title}</h2>
        <InfoBubble calculator={spec.id} title={spec.title} />
      </div>
      <p className="calc-hint">{spec.hint}</p>

      <div className="tiles">
        {spec.tiles.map(({ field, label, spoken, findName, fixed }) => {
          const found = field === find;
          const issue = found ? null : issueAt(state, derived, spec.id, field);
          const shown = unitOf(state, field);
          const boxId = `${id}-${field}`;
          // a symbol (m, MW, C₁) is set larger and keeps its case: m is a mass, M would be molar
          const nameClass = `tile-name${label.length <= 2 ? " symbol" : ""}`;
          return (
            <div className={`tile${fixed ? " fixed" : ""}${found ? " found" : ""}${issue ? " has-issue" : ""}`} key={field}>
              {fixed ? (
                <div className="tile-head">
                  <label className={nameClass} htmlFor={boxId}>
                    {label}
                  </label>
                  <span className="tile-note">constant</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="tile-head tile-find"
                  aria-pressed={found}
                  aria-label={`Find ${findName}`}
                  onClick={() => dispatch({ type: "find", target: field as SolveFor | DilutionFor })}
                >
                  <span className="tick" aria-hidden="true">
                    {found && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className={nameClass}>{label}</span>
                  {found && <span className="tile-note">Finding</span>}
                </button>
              )}

              <div className="tile-field">
                {found ? (
                  <output className="tile-answer" aria-label={`${spoken}, answer`} aria-live="polite">
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
                    aria-label={fixed ? spoken : `${spoken} in ${unit(shown).name}`}
                    aria-invalid={issue ? true : undefined}
                    aria-describedby={issue ? `${boxId}-issue` : undefined}
                    value={boxText(state, derived, field, shown, spec.id)}
                    onChange={(e) => dispatch({ type: "type", field, unit: shown, text: e.target.value, box: spec.id })}
                    onBlur={() => dispatch({ type: "leave", field })}
                  />
                )}
                {fixed ? <span className="tile-unit">g/mol or Da</span> : <UnitSelect quantity={field} label={spoken} state={state} dispatch={dispatch} />}
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
        <span className="calc-formula">{formula}</span>
        <AddToReport what={reportWhat} disabled={!answer} onAdd={onAdd} />
      </div>
      {note && <p className="calc-note">{note}</p>}
    </section>
  );
}
