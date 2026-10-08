import type { Dispatch } from "react";
import { useId } from "react";

import type { Action, ConverterSlot, Derived, State } from "../state/model";
import { boxText, converterNeedsMolarMass, converterText, issueAt } from "../state/model";
import type { Dimension, UnitId } from "../units/units";
import { unit, unitsOf } from "../units/units";

interface Props {
  state: State;
  derived: Derived;
  dispatch: Dispatch<Action>;
}

const ROWS: { slot: ConverterSlot; dimension: Dimension; label: string }[] = [
  { slot: "converterMolar", dimension: "molar", label: "Molar concentration" },
  { slot: "converterMass", dimension: "massConc", label: "Mass concentration" },
];

// Calculator 5: one concentration on two lines, as molar and as mass per volume, each with its own unit menu. The two
// boxes are views of one stored value, so typing in either fills the other; crossing from one kind to the other goes
// through the molecular weight, which is the one the first three calculators use (state/model.ts).
export function ConcentrationConverter({ state, derived, dispatch }: Props) {
  const id = useId();
  const mwIssue = issueAt(state, derived, "conversion", "molarMass");
  const valueIssue = issueAt(state, derived, "conversion", "converter");

  return (
    <section className="calc conv" aria-labelledby={`${id}-title`} data-calculator="conversion">
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

      {ROWS.map(({ slot, dimension, label }) => {
        const unitId: UnitId = state.units[slot];
        const invalid = valueIssue !== null && derived.conversion.amount === null;
        return (
          <div className={`row${valueIssue && dimension === "molar" ? " has-issue" : ""}`} key={slot}>
            <label className="row-label" htmlFor={`${id}-${slot}`}>
              {label}:
            </label>
            <input
              id={`${id}-${slot}`}
              className="row-value"
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label={`${label} in ${unit(unitId).name}`}
              aria-invalid={invalid ? true : undefined}
              placeholder={converterNeedsMolarMass(derived, unitId) ? "needs MW" : ""}
              value={converterText(state, derived, unitId)}
              onChange={(e) => dispatch({ type: "type", field: "converter", unit: unitId, text: e.target.value })}
              onBlur={() => dispatch({ type: "leave", field: "converter" })}
            />
            <select aria-label={`${label}: unit`} value={unitId} onChange={(e) => dispatch({ type: "converterUnit", slot, unit: e.target.value as UnitId })}>
              {unitsOf(dimension).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        );
      })}

      {valueIssue && <p className="row-issue conv-issue">{valueIssue}</p>}
      {!mwIssue && derived.conversion.amount && derived.conversion.molarMass === null && (
        <p className="calc-note">Enter the molecular weight to convert between molar and mass per volume.</p>
      )}
    </section>
  );
}
