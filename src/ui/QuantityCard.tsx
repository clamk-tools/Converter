import type { Dispatch } from "react";
import { useId } from "react";

import type { Action, Derived, FieldId, QuantityId, State } from "../state/model";
import { boxText, isOutput, unitGroups } from "../state/model";
import type { Dimension, UnitId } from "../units/units";
import { unit } from "../units/units";

const GROUP_NAMES: Partial<Record<Dimension, string>> = { molar: "Molar", massConc: "Mass per volume" };

interface Props {
  quantity: QuantityId;
  title: string;
  /** the symbol in the formulas: C, V, m, MW */
  symbol: string;
  hint?: string;
  state: State;
  derived: Derived;
  dispatch: Dispatch<Action>;
}

// One physical quantity: a main box with its unit, then the same quantity in every unit. Every box is a view of the
// one value in the state; typing in any of them changes that value, and all the others follow (state/model.ts).
export function QuantityCard({ quantity, title, symbol, hint, state, derived, dispatch }: Props) {
  const id = useId();
  const output = isOutput(state, quantity);
  const view = derived.quantities[quantity];
  const issue = view.issue;
  const main = state.units[quantity];
  const groups = unitGroups(quantity);
  const field = quantity as FieldId; // only used when the quantity is typed in, so it is a field

  const box = (unitId: UnitId, className: string, label: string) => {
    const needsMw = !view.amount ? false : unit(unitId).dimension !== view.amount.dimension && derived.molarMass === null;
    return (
      <input
        className={className}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={label}
        aria-invalid={issue ? true : undefined}
        aria-describedby={issue ? `${id}-issue` : undefined}
        readOnly={output}
        placeholder={needsMw ? "needs MW" : output ? "–" : ""}
        value={boxText(state, derived, quantity, unitId)}
        onChange={(e) => dispatch({ type: "type", field, unit: unitId, text: e.target.value })}
        onBlur={() => dispatch({ type: "leave", field })}
      />
    );
  };

  return (
    <section className={`qcard${output ? " result" : ""}${issue ? " has-issue" : ""}`} aria-labelledby={`${id}-title`} data-quantity={quantity}>
      <div className="qhead">
        <h3 id={`${id}-title`}>{title}</h3>
        <span className="qsym">{symbol}</span>
        {output && <span className="badge">Result</span>}
      </div>

      <div className="qmain">
        {box(main, "qvalue", `${title} in ${unit(main).symbol}`)}
        <select aria-label={`${title}: unit`} value={main} onChange={(e) => dispatch({ type: "unit", quantity, unit: e.target.value as UnitId })}>
          {groups.map((g) =>
            groups.length > 1 ? (
              <optgroup key={g.dimension} label={GROUP_NAMES[g.dimension]}>
                {g.units.map((u) => (
                  <option key={u} value={u}>
                    {unit(u).symbol}
                  </option>
                ))}
              </optgroup>
            ) : (
              g.units.map((u) => (
                <option key={u} value={u}>
                  {unit(u).symbol}
                </option>
              ))
            ),
          )}
        </select>
      </div>

      <div aria-live="polite">
        {issue && (
          <p className="qissue" id={`${id}-issue`}>
            {issue}
          </p>
        )}
      </div>
      {hint && !issue && <p className="qhint">{hint}</p>}

      <div className="equiv">
        {groups.map((g) => (
          <div className="equiv-group" key={g.dimension}>
            {groups.length > 1 && <p className="equiv-name">{GROUP_NAMES[g.dimension]}</p>}
            <div className="equiv-grid">
              {g.units.map((u) => (
                <label className={`eq${u === main ? " current" : ""}`} key={u}>
                  <span className="eq-unit">{unit(u).symbol}</span>
                  {box(u, "eq-value", `${title} in ${unit(u).symbol}`)}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
