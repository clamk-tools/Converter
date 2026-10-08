// The scientific state: what the user has entered, as physical quantities in canonical units, and how every box on
// the page is derived from it.
//
//   keystroke ─► parse ─► canonical value ─► State.entries ─► derive() ─► solve (engine) ─► boxText() per unit
//
// The boxes are never the source of truth. A quantity is stored once (concentration = 0.0001 M), and every box that
// shows it, in any section and any unit, is computed from that one value. Typing in any of them replaces the
// quantity, so the others follow. Choosing another unit only changes how a quantity is shown, never its value, and
// the choice holds wherever that quantity appears.
//
// The page has four calculators (GraphPad's layout). Three share the typed formula weight, concentration, volume and
// mass; each solves for the one it does not take, so the answers are never stored and nothing loops.
//
// Only the box being typed in shows the raw text (State.editing), so "1e-" or "0." is never reformatted under the
// user's fingers. Every other box, and that box once left, shows the formatted value.

import { solveDilution, solveSolution } from "../engine/solve";
import type { DilutionResult, SolutionResult, SolveFor } from "../engine/solve";
import { massConcentrationOf, molarConcentrationOf } from "../engine/equations";
import { COMPUTED, ENTERED, formatNumber } from "../numbers/format";
import { parseNumber } from "../numbers/parse";
import { fromCanonical, toCanonical, unit, unitsOf } from "../units/units";
import type { Dimension, UnitId } from "../units/units";

export type { SolveFor };

/** The quantities the user can type. */
export type FieldId = "molarMass" | "concentration" | "volume" | "mass" | "stock" | "target" | "finalVolume";
/** The quantities that are only ever calculated: each calculator's answer. */
export type OutputId = "massResult" | "volumeResult" | "concentrationResult" | "moles" | "stockVolume" | "diluentVolume";
export type QuantityId = FieldId | OutputId;

/** The unit choices. An answer shares its quantity's choice: picking mg for a mass shows mg everywhere. */
export type UnitSlot = Exclude<QuantityId, "massResult" | "volumeResult" | "concentrationResult">;
export const SLOT: Record<QuantityId, UnitSlot> = {
  molarMass: "molarMass",
  concentration: "concentration",
  volume: "volume",
  mass: "mass",
  stock: "stock",
  target: "target",
  finalVolume: "finalVolume",
  massResult: "mass",
  volumeResult: "volume",
  concentrationResult: "concentration",
  moles: "moles",
  stockVolume: "stockVolume",
  diluentVolume: "diluentVolume",
};

/** Each calculator's answer. */
export const RESULT_OF: Record<SolveFor, OutputId> = { mass: "massResult", volume: "volumeResult", concentration: "concentrationResult" };

/** A value in the canonical unit of `dimension`. A concentration is molar (M) or a mass concentration (g/L). */
export interface Amount {
  dimension: Dimension;
  value: number;
}

export type Entry = { kind: "empty" } | { kind: "value"; amount: Amount } | { kind: "invalid"; reason: string };

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

/** The dimensions a quantity can be shown in. A concentration has two: molar, and mass concentration (via MW). */
export const DIMENSIONS: Record<QuantityId, Dimension[]> = {
  molarMass: ["molarMass"],
  concentration: ["molar", "massConc"],
  volume: ["volume"],
  mass: ["mass"],
  stock: ["molar", "massConc"],
  target: ["molar", "massConc"],
  finalVolume: ["volume"],
  massResult: ["mass"],
  volumeResult: ["volume"],
  concentrationResult: ["molar", "massConc"],
  moles: ["amount"],
  stockVolume: ["volume"],
  diluentVolume: ["volume"],
};

const FIELDS: FieldId[] = ["molarMass", "concentration", "volume", "mass", "stock", "target", "finalVolume"];
const OUTPUTS: OutputId[] = ["massResult", "volumeResult", "concentrationResult", "moles", "stockVolume", "diluentVolume"];

const empty: Entry = { kind: "empty" };

export const initialState: State = {
  entries: { molarMass: empty, concentration: empty, volume: empty, mass: empty, stock: empty, target: empty, finalVolume: empty },
  units: {
    molarMass: "g_mol",
    concentration: "mM",
    volume: "mL",
    mass: "mg",
    moles: "mmol",
    stock: "mM",
    target: "uM",
    finalVolume: "mL",
    stockVolume: "uL",
    diluentVolume: "mL",
  },
  editing: null,
};

export const isOutput = (quantity: QuantityId): quantity is OutputId => (OUTPUTS as string[]).includes(quantity);

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "type": {
      const parsed = parseNumber(action.text);
      const editing = { field: action.field, unit: action.unit, box: action.box ?? "", text: action.text };
      let entry = state.entries[action.field];
      if (parsed.kind === "number") entry = { kind: "value", amount: { dimension: unit(action.unit).dimension, value: toCanonical(parsed.value, action.unit) } };
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
    case "unit":
      return { ...state, units: { ...state.units, [SLOT[action.quantity]]: action.unit } };
    case "clear":
      return { ...state, entries: initialState.entries, editing: null };
  }
}

// ---------- derivation ----------

export interface QuantityView {
  amount: Amount | null;
  /** true when calculated, false when typed */
  output: boolean;
}

export type Section = SolveFor | "dilution";

export interface Derived {
  quantities: Record<QuantityId, QuantityView>;
  /** the formula weight in g/mol, when it is a usable value */
  molarMass: number | null;
  /** each calculator's result; its issues are about its own inputs (a zero mass is fine for one, not another) */
  solutions: Record<SolveFor, SolutionResult>;
  dilution: DilutionResult;
}

const amountOf = (entry: Entry): Amount | null => (entry.kind === "value" ? entry.amount : null);

/** An amount in another dimension of the same quantity: only between molar and mass concentration, through MW. */
export function inDimension(amount: Amount, dimension: Dimension, molarMass: number | null): number | null {
  if (amount.dimension === dimension) return amount.value;
  if (molarMass === null) return null;
  if (amount.dimension === "molar" && dimension === "massConc") return massConcentrationOf(amount.value, molarMass);
  if (amount.dimension === "massConc" && dimension === "molar") return molarConcentrationOf(amount.value, molarMass);
  return null;
}

export function derive(state: State): Derived {
  const { entries } = state;
  const mw = amountOf(entries.molarMass);
  const molarMass = mw && mw.value > 0 ? mw.value : null;

  const quantities = {} as Record<QuantityId, QuantityView>;
  for (const field of FIELDS) quantities[field] = { amount: amountOf(entries[field]), output: false };

  // ---- the three molarity calculators, on the same typed values ----
  const conc = amountOf(entries.concentration);
  const mass = amountOf(entries.mass);
  const volume = amountOf(entries.volume);
  const inputs = {
    molarMass: mw ? mw.value : null,
    concentration: conc ? inDimension(conc, "molar", molarMass) : null,
    volume: volume ? volume.value : null,
    mass: mass ? mass.value : null,
  };
  const solutions = {} as Record<SolveFor, SolutionResult>;
  for (const target of ["mass", "volume", "concentration"] as SolveFor[]) {
    const result = solveSolution(target, inputs);
    // a concentration in mg/mL waits for the formula weight to become molar: it is there, MW is what is missing
    if (conc) result.missing = result.missing.filter((m) => m !== "concentration");
    solutions[target] = result;
    quantities[RESULT_OF[target]] = {
      amount: result.value === null ? null : { dimension: DIMENSIONS[target][0], value: result.value },
      output: true,
    };
  }
  const moles = solutions.mass.moles;
  quantities.moles = { amount: moles === null ? null : { dimension: "amount", value: moles }, output: true };

  // ---- dilute a stock ----
  // C1 and C2 must be in the same unit family. Mixed (mg/mL against mM) they are compared as molar, through MW.
  const stock = amountOf(entries.stock);
  const goal = amountOf(entries.target);
  let c1: number | null;
  let c2: number | null;
  let mixIssue: string | null = null;
  if (stock && goal) {
    const dimension = stock.dimension === goal.dimension ? stock.dimension : "molar";
    c1 = inDimension(stock, dimension, molarMass);
    c2 = inDimension(goal, dimension, molarMass);
    if (c1 === null || c2 === null) mixIssue = "One concentration is molar and the other a mass concentration: enter the formula weight above to compare them.";
  } else {
    c1 = stock ? stock.value : null;
    c2 = goal ? goal.value : null;
  }
  const finalVolume = amountOf(entries.finalVolume);
  const dilution = solveDilution({ stock: c1, target: c2, finalVolume: finalVolume ? finalVolume.value : null });
  if (mixIssue) {
    dilution.issues.push({ input: "target", message: mixIssue });
    dilution.missing = dilution.missing.filter((m) => m !== "stock" && m !== "target");
  }
  const volumeAmount = (value: number | null): Amount | null => (value === null ? null : { dimension: "volume", value });
  quantities.stockVolume = { amount: volumeAmount(dilution.stockVolume), output: true };
  quantities.diluentVolume = { amount: volumeAmount(dilution.diluentVolume), output: true };

  return { quantities, molarMass, solutions, dilution };
}

/** The problem to show at a box in one section: text that is not a number, else that section's rule for the value. */
export function issueAt(state: State, derived: Derived, section: Section, field: FieldId): string | null {
  const entry = state.entries[field];
  if (entry.kind === "invalid") return entry.reason;
  const issues: { input: string; message: string }[] = section === "dilution" ? derived.dilution.issues : derived.solutions[section].issues;
  return issues.find((i) => i.input === field)?.message ?? null;
}

/** The first problem among a section's boxes, in page order, for its result line. */
export function firstIssue(state: State, derived: Derived, section: Section, fields: FieldId[]): string | null {
  for (const field of fields) {
    const issue = issueAt(state, derived, section, field);
    if (issue) return issue;
  }
  return null;
}

// ---------- display ----------

/** A quantity in one unit, as a number, or null when it is not known (or needs a formula weight). */
export function valueIn(derived: Derived, quantity: QuantityId, unitId: UnitId): number | null {
  const amount = derived.quantities[quantity].amount;
  if (!amount) return null;
  const canonical = inDimension(amount, unit(unitId).dimension, derived.molarMass);
  return canonical === null ? null : fromCanonical(canonical, unitId);
}

/** What a box shows: the raw text while it is typed in, otherwise the value formatted for display. Other boxes of
 *  the same quantity show the formatted value meanwhile. */
export function boxText(state: State, derived: Derived, quantity: QuantityId, unitId: UnitId, box = ""): string {
  const editing = state.editing;
  if (editing && editing.field === quantity && editing.unit === unitId && editing.box === box) return editing.text;
  const value = valueIn(derived, quantity, unitId);
  if (value === null) return "";
  return formatNumber(value, digitsFor(derived, quantity, unitId));
}

/** A typed value, in any of its units, keeps the digits typed; a calculated one is rounded (numbers/format.ts). */
export function digitsFor(derived: Derived, quantity: QuantityId, unitId: UnitId): number {
  const view = derived.quantities[quantity];
  return !view.output && view.amount?.dimension === unit(unitId).dimension ? ENTERED : COMPUTED;
}

/** The unit a quantity is shown in. */
export const unitOf = (state: State, quantity: QuantityId): UnitId => state.units[SLOT[quantity]];

/** The units a quantity can be shown in, grouped by dimension. */
export function unitGroups(quantity: QuantityId): { dimension: Dimension; units: UnitId[] }[] {
  return DIMENSIONS[quantity].map((dimension) => ({ dimension, units: unitsOf(dimension).map((u) => u.id) }));
}
