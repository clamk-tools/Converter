import type { Dispatch } from "react";
import { useId } from "react";

import type { Action, ConverterSlot, Derived, State } from "../state/model";
import { boxText, converterNeedsMolarMass, converterText, issueAt } from "../state/model";
import type { MassUnitId, UnitId, VolumeUnitId } from "../units/units";
import { isPair, pair, splitPair, unit, unitsOf } from "../units/units";
import { InfoBubble } from "./InfoBubble";

interface Props {
  state: State;
  derived: Derived;
  dispatch: Dispatch<Action>;
}

// What the two menus of the mass line mean when it is not a pair: "% w/v" is g per 100 mL, "ppm" is mg per L.
const NOT_A_PAIR: Record<string, string> = { pct_wv: "per 100 mL", ppm: "per L" };

/** The mass concentration, as a pair: which mass unit, per which volume unit. */
function MassUnits({ unitId, dispatch }: { unitId: UnitId; dispatch: Dispatch<Action> }) {
  const choose = (next: UnitId) => dispatch({ type: "converterUnit", slot: "converterMass", unit: next });
  const [mass, volume] = isPair(unitId) ? splitPair(unitId) : [unitId as MassUnitId, "mL" as VolumeUnitId];
  return (
    <div className="conv-pair">
      <select
        aria-label="Mass concentration: mass unit"
        value={unitId === "pct_wv" || unitId === "ppm" ? unitId : mass}
        onChange={(e) => {
          const next = e.target.value as UnitId;
          choose(next === "pct_wv" || next === "ppm" ? next : pair(next as MassUnitId, volume));
        }}
      >
        {unitsOf("mass").map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
        <option value="pct_wv">% w/v</option>
        <option value="ppm">ppm (mg/L)</option>
      </select>
      {isPair(unitId) ? (
        <>
          <span className="conv-slash" aria-hidden="true">
            /
          </span>
          <select aria-label="Mass concentration: volume unit" value={volume} onChange={(e) => choose(pair(mass, e.target.value as VolumeUnitId))}>
            {unitsOf("volume").map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </>
      ) : (
        <select aria-label="Mass concentration: volume unit" disabled value="fixed">
          <option value="fixed">{NOT_A_PAIR[unitId]}</option>
        </select>
      )}
    </div>
  );
}

// Calculator 5: one concentration on two lines, as molar and as mass per volume, each with its own unit menu. The two
// boxes are views of one stored value, so typing in either fills the other; crossing from one kind to the other goes
// through the molecular weight, which is the one the first three calculators use (state/model.ts).
export function ConcentrationConverter({ state, derived, dispatch }: Props) {
  const id = useId();
  const mwIssue = issueAt(state, derived, "conversion", "molarMass");
  const valueIssue = issueAt(state, derived, "conversion", "converter");

  return (
    <section className="calc conv" aria-labelledby={`${id}-title`} data-calculator="conversion">
      <div className="calc-head">
        <h2 id={`${id}-title`}>5. Convert between mass &amp; molar concentration</h2>
        <InfoBubble calculator="conversion" title="calculator 5" />
      </div>

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

      {(["converterMolar", "converterMass"] as ConverterSlot[]).map((slot) => {
        const unitId: UnitId = state.units[slot];
        const molar = slot === "converterMolar";
        const label = molar ? "Molar concentration" : "Mass concentration";
        const invalid = valueIssue !== null && derived.conversion.amount === null;
        return (
          <div className={`row${molar ? "" : " pair"}${valueIssue && molar ? " has-issue" : ""}`} key={slot}>
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
            {molar ? (
              <select aria-label={`${label}: unit`} value={unitId} onChange={(e) => dispatch({ type: "converterUnit", slot, unit: e.target.value as UnitId })}>
                {unitsOf("molar").map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            ) : (
              <MassUnits unitId={unitId} dispatch={dispatch} />
            )}
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
