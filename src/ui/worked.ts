// The dilution's formula with the numbers in it, as they are typed: "V₁ = 10 mM × 100 mL / 1 M = 1 mL". Each value is
// shown in the unit of its box, as typed; a value not there yet is "?". Display only: the answer itself comes from the
// engine (state/model.ts), so this line can never disagree with the tile that shows it.

import type { Derived, DilutionFor, FieldId, State } from "../state/model";
import { DILUTION_RESULT_OF, resultText, unitOf, valueIn } from "../state/model";
import { ENTERED, formatNumber } from "../numbers/format";
import { unit } from "../units/units";

// a number and its unit never part at the end of a line on a phone: "1 mL" stays whole
const NBSP = "\u00a0";

const SYMBOL: Record<DilutionFor, string> = { stock: "C₁", stockVolume: "V₁", target: "C₂", finalVolume: "V₂" };

/** The three values each formula takes, in the order it writes them: a × b / c. */
const TERMS: Record<DilutionFor, [FieldId, FieldId, FieldId]> = {
  stockVolume: ["target", "finalVolume", "stock"], // V₁ = C₂ × V₂ / C₁
  finalVolume: ["stock", "stockVolume", "target"], // V₂ = C₁ × V₁ / C₂
  stock: ["target", "finalVolume", "stockVolume"], // C₁ = C₂ × V₂ / V₁
  target: ["stock", "stockVolume", "finalVolume"], // C₂ = C₁ × V₁ / V₂
};

export function dilutionWorked(state: State, derived: Derived): string {
  const find = state.dilutionFind;
  const shown = (field: FieldId) => {
    const u = unitOf(state, field);
    const value = valueIn(derived, field, u);
    return value === null ? "?" : `${formatNumber(value, ENTERED)}${NBSP}${unit(u).symbol}`;
  };
  const [a, b, c] = TERMS[find].map(shown);
  const answer = resultText(state, derived, DILUTION_RESULT_OF[find]).replace(" ", NBSP) || "?";
  return `${SYMBOL[find]} = ${a} × ${b} / ${c} = ${answer}`;
}
