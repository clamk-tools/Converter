import type { Dispatch } from "react";

import type { Action, QuantityId, State } from "../state/model";
import { unitGroups, unitOf } from "../state/model";
import type { Dimension, UnitId } from "../units/units";
import { unit } from "../units/units";

const GROUP_NAMES: Partial<Record<Dimension, string>> = { molar: "Molar", massConc: "Mass per volume" };

// The unit menu of a quantity. The choice is the quantity's, so it shows wherever that quantity appears.
export function UnitSelect({ quantity, label, state, dispatch }: { quantity: QuantityId; label: string; state: State; dispatch: Dispatch<Action> }) {
  const groups = unitGroups(quantity);
  const options = (units: UnitId[]) =>
    units.map((u) => (
      <option key={u} value={u}>
        {unit(u).symbol}
      </option>
    ));
  return (
    <select aria-label={`${label}: unit`} value={unitOf(state, quantity)} onChange={(e) => dispatch({ type: "unit", quantity, unit: e.target.value as UnitId })}>
      {groups.length > 1
        ? groups.map((g) => (
            <optgroup key={g.dimension} label={GROUP_NAMES[g.dimension]}>
              {options(g.units)}
            </optgroup>
          ))
        : options(groups[0].units)}
    </select>
  );
}
