// The scientific state: what the user has entered, as physical quantities in canonical units, and how every box on
// the page is derived from it.
//
//   keystroke ─► parse ─► canonical value ─► State.entries ─► derive() ─► solve (engine) ─► boxText() per unit
//
// The boxes are never the source of truth. A quantity is stored once (concentration = 0.0001 M), and every box that
// shows it, in any calculator and any unit, is computed from that one value. Typing in any of them replaces the
// quantity, so the others follow. Choosing another unit only changes how a quantity is shown, never its value, and
// the choice holds wherever that quantity appears, answers included.
//
// The page has GraphPad's four calculators. The first three share the concentration, molecular weight, volume and mass;
// each solves for the one it does not take, so the answers are never stored and nothing loops. The dilution has its
// own three values.
//
// Only the box being typed in shows the raw text (State.editing), so "1e-" or "0." is never reformatted under the
// user's fingers. Every other box, and that box once left, shows the formatted value.

import { solveDilution, solveSolution } from "../engine/solve";
import type { DilutionResult, SolutionResult, SolveFor } from "../engine/solve";
import { COMPUTED, ENTERED, formatNumber } from "../numbers/format";
import { parseNumber } from "../numbers/parse";
import { fromCanonical, toCanonical, unit } from "../units/units";
import type { Dimension, UnitId } from "../units/units";

export type { SolveFor };

/** The quantities the user can type. */
export type FieldId = "concentration" | "molarMass" | "volume" | "mass" | "stock" | "target" | "finalVolume";
/** Each calculator's answer: only ever calculated. */
export type OutputId = "massResult" | "volumeResult" | "concentrationResult" | "stockVolume";
export type QuantityId = FieldId | OutputId;

/** The unit choices. An answer shares its quantity's choice; the molecular weight is always g/mol. */
export type UnitSlot = "concentration" | "volume" | "mass" | "stock" | "target" | "finalVolume";
export const SLOT: Record<QuantityId, UnitSlot | null> = {
  concentration: "concentration",
  molarMass: null,
  volume: "volume",
  mass: "mass",
  stock: "stock",
  target: "target",
  finalVolume: "finalVolume",
  massResult: "mass",
  volumeResult: "volume",
  concentrationResult: "concentration",
  stockVolume: "finalVolume", // the required volume is shown in the unit of the desired volume
};

export const DIMENSION: Record<QuantityId, Dimension> = {
  concentration: "molar",
  molarMass: "molarMass",
  volume: "volume",
  mass: "mass",
  stock: "molar",
  target: "molar",
  finalVolume: "volume",
  massResult: "mass",
  volumeResult: "volume",
  concentrationResult: "molar",
  stockVolume: "volume",
};

/** Each calculator's answer. */
export const RESULT_OF: Record<SolveFor, OutputId> = { mass: "massResult", volume: "volumeResult", concentration: "concentrationResult" };

/** A typed value, in the canonical unit of its quantity (M, g/mol, L, g). */
export type Entry = { kind: "empty" } | { kind: "value"; value: number } | { kind: "invalid"; reason: string };

export interface State {
  entries: Record<FieldId, Entry>;
  /** the unit each quantity is shown in */
  units: Record<UnitSlot, UnitId>;
  /** the box being typed in (one quantity can have a box in several calculators), and its raw text */
  editing: { field: FieldId; unit: UnitId; box: string; text: string } | null;
}

export type Action =
  | { type: "type"; field: FieldId; unit: UnitId; text: string; box?: string }
  | { type: "leave"; field: FieldId }
  | { type: "unit"; quantity: QuantityId; unit: UnitId }
  | { type: "clear" };

const empty: Entry = { kind: "empty" };

// GraphPad's defaults: millimolar, milliliter, milligrams.
export const initialState: State = {
  entries: { concentration: empty, molarMass: empty, volume: empty, mass: empty, stock: empty, target: empty, finalVolume: empty },
  units: { concentration: "mM", volume: "mL", mass: "mg", stock: "mM", target: "mM", finalVolume: "mL" },
  editing: null,
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "type": {
      const parsed = parseNumber(action.text);
      const editing = { field: action.field, unit: action.unit, box: action.box ?? "", text: action.text };
      let entry = state.entries[action.field];
      if (parsed.kind === "number") entry = { kind: "value", value: toCanonical(parsed.value, action.unit) };
      if (parsed.kind === "empty") entry = empty;
      if (parsed.kind === "invalid") entry = { kind: "invalid", reason: parsed.reason };
      // partial ("1e-"): the quantity keeps its last value until the number is complete
      return { ...state, editing, entries: { ...state.entries, [action.field]: entry } };
    }
    case "leave": {
      if (!state.editing || state.editing.field !== action.field) return state;
      const parsed = parseNumber(state.editing.text);
      const entries =
        parsed.kind === "partial" ? { ...state.entries, [action.field]: { kind: "invalid", reason: "This number is not complete." } as Entry } : state.entries;
      return { ...state, editing: null, entries };
    }
    case "unit": {
      const slot = SLOT[action.quantity];
      return slot ? { ...state, units: { ...state.units, [slot]: action.unit } } : state;
    }
    case "clear":
      return { ...state, entries: initialState.entries, editing: null };
  }
}

// ---------- derivation ----------

export type Section = SolveFor | "dilution";

export interface Derived {
  /** every quantity in its canonical unit, or null when not known */
  values: Record<QuantityId, number | null>;
  /** each calculator's result; its issues are about its own inputs (a zero mass is fine for one, not another) */
  solutions: Record<SolveFor, SolutionResult>;
  dilution: DilutionResult;
}

const valueOf = (entry: Entry): number | null => (entry.kind === "value" ? entry.value : null);

export function derive(state: State): Derived {
  const e = state.entries;
  const inputs = { molarMass: valueOf(e.molarMass), concentration: valueOf(e.concentration), volume: valueOf(e.volume), mass: valueOf(e.mass) };
  const solutions = {
    mass: solveSolution("mass", inputs),
    volume: solveSolution("volume", inputs),
    concentration: solveSolution("concentration", inputs),
  };
  const dilution = solveDilution({ stock: valueOf(e.stock), target: valueOf(e.target), finalVolume: valueOf(e.finalVolume) });
  const values = {
    ...inputs,
    stock: valueOf(e.stock),
    target: valueOf(e.target),
    finalVolume: valueOf(e.finalVolume),
    massResult: solutions.mass.value,
    volumeResult: solutions.volume.value,
    concentrationResult: solutions.concentration.value,
    stockVolume: dilution.stockVolume,
  };
  return { values, solutions, dilution };
}

/** The problem to show at a box in one calculator: text that is not a number, else that calculator's rule. */
export function issueAt(state: State, derived: Derived, section: Section, field: FieldId): string | null {
  const entry = state.entries[field];
  if (entry.kind === "invalid") return entry.reason;
  const issues: { input: string; message: string }[] = section === "dilution" ? derived.dilution.issues : derived.solutions[section].issues;
  return issues.find((i) => i.input === field)?.message ?? null;
}

// ---------- display ----------

/** The unit a quantity is shown in. */
export const unitOf = (state: State, quantity: QuantityId): UnitId => {
  const slot = SLOT[quantity];
  return slot ? state.units[slot] : "g_mol";
};

/** A quantity in one unit, or null when it is not known. */
export function valueIn(derived: Derived, quantity: QuantityId, unitId: UnitId): number | null {
  const value = derived.values[quantity];
  return value === null ? null : fromCanonical(value, unitId);
}

/** What an input box shows: the raw text while it is typed in, otherwise the value formatted for display. Other boxes
 *  of the same quantity show the formatted value meanwhile. A typed value keeps up to 12 digits (numbers/format.ts). */
export function boxText(state: State, derived: Derived, quantity: FieldId, unitId: UnitId, box = ""): string {
  const editing = state.editing;
  if (editing && editing.field === quantity && editing.unit === unitId && editing.box === box) return editing.text;
  const value = valueIn(derived, quantity, unitId);
  return value === null ? "" : formatNumber(value, ENTERED);
}

/** What an answer box shows: "180.16 mg", in the unit chosen for that quantity, to 6 significant digits. */
export function resultText(state: State, derived: Derived, quantity: OutputId): string {
  const unitId = unitOf(state, quantity);
  const value = valueIn(derived, quantity, unitId);
  return value === null ? "" : `${formatNumber(value, COMPUTED)} ${unit(unitId).symbol}`;
}
