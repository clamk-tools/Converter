// The results in words, in the units the user chose: the sentence under each calculator, the text its Copy button
// puts on the clipboard, and the result in every unit. Pure functions of the state, tested without a browser.

import { formatNumber } from "../numbers/format";
import type { Derived, FieldId, QuantityId, SolveFor, State } from "../state/model";
import { digitsFor, unitGroups, unitOf, valueIn } from "../state/model";
import type { UnitId } from "../units/units";
import { unit } from "../units/units";

function textIn(derived: Derived, quantity: QuantityId, unitId: UnitId): string | null {
  const value = valueIn(derived, quantity, unitId);
  return value === null ? null : `${formatNumber(value, digitsFor(derived, quantity, unitId))} ${unit(unitId).symbol}`;
}

/** "180.16 mg": a quantity in its chosen unit, or null when it is not known. */
export const quantityText = (state: State, derived: Derived, quantity: QuantityId) => textIn(derived, quantity, unitOf(state, quantity));

/** The quantity in every unit it has, except the one it is shown in: "0.18016 g · 180160 µg · 180160000 ng". */
export function allUnitsText(state: State, derived: Derived, quantity: QuantityId): string | null {
  const shown = unitOf(state, quantity);
  const parts = unitGroups(quantity)
    .flatMap((g) => g.units)
    .filter((u) => u !== shown)
    .map((u) => textIn(derived, quantity, u))
    .filter((t): t is string => t !== null);
  return parts.length ? parts.join(" · ") : null;
}

export interface Summary {
  sentence: string;
  /** what Copy puts on the clipboard */
  copy: string;
}

export function solutionSummary(state: State, derived: Derived, target: SolveFor): Summary | null {
  if (derived.solutions[target].value === null) return null;
  const t = (q: QuantityId) => quantityText(state, derived, q);
  switch (target) {
    case "mass": {
      const [mass, volume, conc] = [t("massResult"), t("volume"), t("concentration")];
      return mass && volume && conc ? { sentence: `Weigh ${mass} and make up to ${volume} to get ${conc}.`, copy: mass } : null;
    }
    case "volume": {
      const [mass, volume, conc] = [t("mass"), t("volumeResult"), t("concentration")];
      return mass && volume && conc ? { sentence: `Make ${mass} up to ${volume} to get ${conc}.`, copy: volume } : null;
    }
    case "concentration": {
      const [mass, volume, conc] = [t("mass"), t("volume"), t("concentrationResult")];
      return mass && volume && conc ? { sentence: `${mass} made up to ${volume} gives ${conc}.`, copy: conc } : null;
    }
  }
}

export function dilutionSummary(state: State, derived: Derived): Summary | null {
  const { factor } = derived.dilution;
  const stock = quantityText(state, derived, "stockVolume");
  const diluent = quantityText(state, derived, "diluentVolume");
  const total = quantityText(state, derived, "finalVolume");
  if (factor === null || !stock || !diluent || !total) return null;
  if (factor === 1) return { sentence: `Use ${total} of stock as it is.`, copy: total };
  const fold = formatNumber(factor, 6);
  return { sentence: `Add ${stock} of stock to ${diluent} of diluent (${total} in total): a ${fold}-fold dilution.`, copy: stock };
}

const NAMES: Record<FieldId, string> = {
  molarMass: "formula weight",
  concentration: "concentration",
  volume: "volume",
  mass: "mass",
  stock: "stock concentration",
  target: "desired concentration",
  finalVolume: "final volume",
};

/** "Fill in formula weight and volume." for the inputs still empty. */
export function missingText(missing: string[]): string | null {
  if (!missing.length) return null;
  const names = missing.map((m) => NAMES[m as FieldId]);
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `Fill in ${list}.`;
}
