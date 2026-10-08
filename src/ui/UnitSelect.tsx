import type { Dispatch } from "react";

import type { Action, QuantityId, State } from "../state/model";
import { DIMENSION, unitOf } from "../state/model";
import type { UnitId } from "../units/units";
import { unitsOf } from "../units/units";

// The unit menu of a quantity, in words as on GraphPad ("millimolar"). The choice is the quantity's, so it shows
// wherever that quantity appears.
export function UnitSelect({ quantity, label, state, dispatch }: { quantity: QuantityId; label: string; state: State; dispatch: Dispatch<Action> }) {
  return (
    <select aria-label={`${label}: unit`} value={unitOf(state, quantity)} onChange={(e) => dispatch({ type: "unit", quantity, unit: e.target.value as UnitId })}>
      {unitsOf(DIMENSION[quantity]).map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </select>
  );
}
