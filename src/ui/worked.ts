// A calculator's formula with the numbers in it, as they are typed: "V₁ = 10 mM × 100 mL / 1 M = 1 mL". Shown under
// the formula of each calculator. Each value is written in the unit of its box; a value not there yet is "?". Display
// only: the answer itself comes from the engine (state/model.ts), so this line can never disagree with the page.

import type { Derived, DilutionFor, FieldId, SolveFor, State } from "../state/model";
import { DILUTION_RESULT_OF, RESULT_OF, converterValueIn, resultText, unitOf, valueIn } from "../state/model";
import { COMPUTED, ENTERED, formatNumber } from "../numbers/format";
import { unit } from "../units/units";
import type { UnitId } from "../units/units";

// a number and its unit never part at the end of a line on a phone: "1 mL" stays whole
const NBSP = " ";

const withUnit = (value: number | null, unitId: UnitId, digits: number) =>
  value === null ? "?" : `${formatNumber(value, digits)}${NBSP}${unit(unitId).symbol}`;

/** A typed quantity as its box shows it, with its unit: "100 mM", or "?". */
function typed(state: State, derived: Derived, field: FieldId): string {
  const u = unitOf(state, field);
  return withUnit(valueIn(derived, field, u), u, ENTERED);
}

/** Fills "{field}" in a template with the typed values: "{target} × {finalVolume}" → "10 mM × 100 mL". */
const fill = (template: string, state: State, derived: Derived) => template.replace(/\{(\w+)\}/g, (_, field: FieldId) => typed(state, derived, field));

const SOLUTION: Record<SolveFor, { symbol: string; terms: string }> = {
  mass: { symbol: "m", terms: "{concentration} × {volume} × {molarMass}" }, // m = C × V × MW
  volume: { symbol: "V", terms: "{mass} / ({concentration} × {molarMass})" }, // V = m / (C × MW)
  concentration: { symbol: "C", terms: "{mass} / ({molarMass} × {volume})" }, // C = m / (MW × V)
};

const DILUTION: Record<DilutionFor, { symbol: string; terms: string }> = {
  stockVolume: { symbol: "V₁", terms: "{target} × {finalVolume} / {stock}" }, // V₁ = C₂ × V₂ / C₁
  finalVolume: { symbol: "V₂", terms: "{stock} × {stockVolume} / {target}" }, // V₂ = C₁ × V₁ / C₂
  stock: { symbol: "C₁", terms: "{target} × {finalVolume} / {stockVolume}" }, // C₁ = C₂ × V₂ / V₁
  target: { symbol: "C₂", terms: "{stock} × {stockVolume} / {finalVolume}" }, // C₂ = C₁ × V₁ / V₂
};

const answer = (text: string) => text.replace(" ", NBSP) || "?";

/** Calculator 1: "m = 100 mM × 10 mL × 180.16 g/mol = 180.16 mg". */
export function solutionWorked(state: State, derived: Derived): string {
  const { symbol, terms } = SOLUTION[state.find];
  return `${symbol} = ${fill(terms, state, derived)} = ${answer(resultText(state, derived, RESULT_OF[state.find]))}`;
}

/** Calculator 2: "V₁ = 10 mM × 100 mL / 1 M = 1 mL". */
export function dilutionWorked(state: State, derived: Derived): string {
  const { symbol, terms } = DILUTION[state.dilutionFind];
  return `${symbol} = ${fill(terms, state, derived)} = ${answer(resultText(state, derived, DILUTION_RESULT_OF[state.dilutionFind]))}`;
}

/** Calculator 3 goes from the line typed in to the other: molar typed (or nothing yet) gives Cm = C × MW, mass gives C = Cm / MW. */
export const converterFromMass = (state: State) => state.entries.converter.kind === "value" && state.entries.converter.dimension === "massConc";

/** Calculator 3: "Cm = 100 mM × 180.16 g/mol = 18.016 mg/mL", or "C = 18.016 mg/mL / 180.16 g/mol = 100 mM". */
export function converterWorked(state: State, derived: Derived): string {
  const molar = state.units.converterMolar;
  const mass = state.units.converterMass;
  const mw = typed(state, derived, "molarMass");
  if (converterFromMass(state)) {
    return `C = ${withUnit(converterValueIn(derived, mass), mass, ENTERED)} / ${mw} = ${withUnit(converterValueIn(derived, molar), molar, COMPUTED)}`;
  }
  return `Cm = ${withUnit(converterValueIn(derived, molar), molar, ENTERED)} × ${mw} = ${withUnit(converterValueIn(derived, mass), mass, COMPUTED)}`;
}
