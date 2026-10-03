// The result in words, in the units the user chose: the sentence under each calculator and the text its Copy
// button puts on the clipboard. Pure functions of the state, so they are tested without a browser.

import { COMPUTED, ENTERED, formatNumber } from "../numbers/format";
import type { Derived, QuantityId, State } from "../state/model";
import { valueIn } from "../state/model";
import { unit } from "../units/units";

/** "180.16 mg": a quantity in its main unit, or null when it is not known. */
export function quantityText(state: State, derived: Derived, quantity: QuantityId): string | null {
  const unitId = state.units[quantity];
  const value = valueIn(derived, quantity, unitId);
  if (value === null) return null;
  const view = derived.quantities[quantity];
  const digits = !view.output && view.amount?.dimension === unit(unitId).dimension ? ENTERED : COMPUTED;
  return `${formatNumber(value, digits)} ${unit(unitId).symbol}`;
}

export interface Summary {
  sentence: string;
  /** what Copy puts on the clipboard */
  copy: string;
}

export function solutionSummary(state: State, derived: Derived): Summary | null {
  if (derived.solution.value === null) return null;
  const mass = quantityText(state, derived, "mass");
  const volume = quantityText(state, derived, "volume");
  const conc = quantityText(state, derived, "concentration");
  if (!mass || !volume || !conc) return null;
  switch (state.solveFor) {
    case "mass":
      return { sentence: `Weigh ${mass} and make up to ${volume} to get ${conc}.`, copy: mass };
    case "concentration":
      return { sentence: `${mass} made up to ${volume} gives ${conc}.`, copy: conc };
    case "volume":
      return { sentence: `Make ${mass} up to ${volume} to get ${conc}.`, copy: volume };
  }
}

export function dilutionSummary(state: State, derived: Derived): Summary | null {
  const { factor } = derived.dilution;
  const stock = quantityText(state, derived, "stockVolume");
  const diluent = quantityText(state, derived, "diluentVolume");
  const total = quantityText(state, derived, "finalVolume");
  if (factor === null || !stock || !diluent || !total) return null;
  if (factor === 1) return { sentence: `Use ${total} of stock as it is.`, copy: total };
  const fold = formatNumber(factor, COMPUTED);
  return { sentence: `Add ${stock} of stock to ${diluent} of diluent (${total} in total): a ${fold}-fold dilution.`, copy: stock };
}

const NAMES: Record<string, string> = {
  molarMass: "molecular weight",
  concentration: "concentration",
  volume: "volume",
  mass: "mass",
  stock: "stock concentration",
  target: "target concentration",
  finalVolume: "final volume",
};

/** "Fill in molecular weight and volume." for the inputs still empty. */
export function missingText(missing: string[]): string | null {
  if (!missing.length) return null;
  const names = missing.map((m) => NAMES[m]);
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `Fill in ${list}.`;
}
