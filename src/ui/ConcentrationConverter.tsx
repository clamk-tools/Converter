import type { Dispatch } from "react";
import { useId } from "react";

import type { Action, Derived, State } from "../state/model";
import { boxText, converterNeedsMolarMass, converterText, issueAt } from "../state/model";
import type { Dimension } from "../units/units";
import { unitsOf } from "../units/units";

const GROUPS: { dimension: Dimension; label: string }[] = [
  { dimension: "molar", label: "Molar" },
  { dimension: "massConc", label: "Mass per volume" },
];

interface Props {
  state: State;
  derived: Derived;
  dispatch: Dispatch<Action>;
}

// Calculator 5: one concentration, shown as molar and as mass per volume at once. Every box is a view of the one
// stored value, so typing in any of them fills the others; crossing between the two kinds goes through the molecular
// weight, which is the one the first three calculators use (state/model.ts).
export function ConcentrationConverter({ state, derived, dispatch }: Props) {
  const id = useId();
  const mwIssue = issueAt(state, derived, "conversion", "molarMass");
  const valueIssue = issueAt(state, derived, "conversion", "converter");

  return (
    <section className="calc" aria-labelledby={`${id}-title`} data-calculator="conversion">
      <h2 id={`${id}-title`}>5. Convert between mass &amp; molar concentration</h2>

      <div className={`row fixed-unit${mwIssue ? " has-issue" : ""}`}>
        <label className="row-label" htmlFor={`${id}-mw`}>
          Molecular weight (g/mol or Da):
        </label>
        <input
          id={`${id}-mw`}
          className="row-value"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Molecular weight (g/mol or Da)"
          aria-invalid={mwIssue ? true : undefined}
          aria-describedby={mwIssue ? `${id}-mw-issue` : undefined}
          value={boxText(state, derived, "molarMass", "g_mol", "conversion")}
          onChange={(e) => dispatch({ type: "type", field: "molarMass", unit: "g_mol", text: e.target.value, box: "conversion" })}
          onBlur={() => dispatch({ type: "leave", field: "molarMass" })}
        />
        {mwIssue && (
          <p className="row-issue" id={`${id}-mw-issue`}>
            {mwIssue}
          </p>
        )}
      </div>

      {GROUPS.map((group) => (
        <div className="conv-group" key={group.dimension}>
          <p className="conv-name">{group.label}</p>
          <div className="conv-grid">
            {unitsOf(group.dimension).map((u) => (
              <label className="conv-box" key={u.id}>
                <span className="conv-unit">{u.symbol}</span>
                <input
                  type="text"
                  className="row-value"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-label={`Concentration in ${u.name}`}
                  aria-invalid={valueIssue && derived.conversion.amount === null ? true : undefined}
                  placeholder={converterNeedsMolarMass(derived, u.id) ? "needs MW" : ""}
                  value={converterText(state, derived, u.id)}
                  onChange={(e) => dispatch({ type: "type", field: "converter", unit: u.id, text: e.target.value })}
                  onBlur={() => dispatch({ type: "leave", field: "converter" })}
                />
              </label>
            ))}
          </div>
        </div>
      ))}

      {valueIssue && <p className="row-issue conv-issue">{valueIssue}</p>}
      {!mwIssue && derived.conversion.amount && derived.conversion.molarMass === null && (
        <p className="calc-note">Enter the molecular weight to convert between molar and mass per volume.</p>
      )}
    </section>
  );
}

