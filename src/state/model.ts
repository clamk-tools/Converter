// The scientific state: what the user has entered, as physical quantities in canonical units, and how every box on
// the page is derived from it.
//
//   keystroke ─► parse ─► canonical value ─► State.entries ─► derive() ─► solve (engine) ─► boxText() per unit
//
// The boxes are never the source of truth. A quantity is stored once (concentration = 0.0001 M); its M, mM, µM, nM
// and pM boxes are all computed from that one value. Typing in any box replaces the quantity, so every other box
// follows. Choosing another unit only changes how a quantity is shown, never its value.
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
/** The quantities that are only ever calculated. */
export type OutputId = "moles" | "stockVolume" | "diluentVolume";
export type QuantityId = FieldId | OutputId;

export type Tab = "solution" | "dilution";

/** A value in the canonical unit of `dimension`. A concentration is molar (M) or a mass concentration (g/L). */
export interface Amount {
  dimension: Dimension;
  value: number;
}

export type Entry = { kind: "empty" } | { kind: "value"; amount: Amount } | { kind: "invalid"; reason: string };

export interface State {
  tab: Tab;
  solveFor: SolveFor;
  entries: Record<FieldId, Entry>;
  /** the unit each quantity's main box is shown in */
  units: Record<QuantityId, UnitId>;
  /** the box being typed in, and its raw text */
  editing: { field: FieldId; unit: UnitId; text: string } | null;
}

export type Action =
  | { type: "type"; field: FieldId; unit: UnitId; text: string }
  | { type: "leave"; field: FieldId }
  | { type: "unit"; quantity: QuantityId; unit: UnitId }
  | { type: "solveFor"; target: SolveFor }
  | { type: "tab"; tab: Tab }
  | { type: "clear"; tab: Tab };

/** The dimensions a quantity can be shown in. A concentration has two: molar, and mass concentration (via MW). */
export const DIMENSIONS: Record<QuantityId, Dimension[]> = {
  molarMass: ["molarMass"],
  concentration: ["molar", "massConc"],
  volume: ["volume"],
  mass: ["mass"],
  moles: ["amount"],
  stock: ["molar", "massConc"],
  target: ["molar", "massConc"],
  finalVolume: ["volume"],
  stockVolume: ["volume"],
  diluentVolume: ["volume"],
};

export const SOLUTION_FIELDS: FieldId[] = ["molarMass", "concentration", "volume", "mass"];
export const DILUTION_FIELDS: FieldId[] = ["stock", "target", "finalVolume"];

const empty: Entry = { kind: "empty" };

export const initialState: State = {
  tab: "solution",
  solveFor: "mass",
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

/** True when the field is the calculator's answer at the moment, so it cannot be typed in. */
export function isOutput(state: State, field: QuantityId): boolean {
  return field === "moles" || field === "stockVolume" || field === "diluentVolume" || field === state.solveFor;
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "type": {
      if (isOutput(state, action.field)) return state;
      const parsed = parseNumber(action.text);
      const editing = { field: action.field, unit: action.unit, text: action.text };
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
      return { ...state, units: { ...state.units, [action.quantity]: action.unit } };
    case "solveFor": {
      if (action.target === state.solveFor) return state;
      // The answer shown so far becomes an input, as shown (rounded to its display precision), so the numbers on the
      // screen stay consistent: solving for mass, then for concentration, gives back the concentration typed.
      const solved = derive(state).solution.value;
      const entries = { ...state.entries };
      if (solved !== null) {
        const dimension = DIMENSIONS[state.solveFor][0];
        entries[state.solveFor] = { kind: "value", amount: { dimension, value: Number(solved.toPrecision(COMPUTED)) } };
      }
      return { ...state, solveFor: action.target, entries, editing: null };
    }
    case "tab":
      return { ...state, tab: action.tab, editing: null };
    case "clear": {
      const fields = action.tab === "solution" ? SOLUTION_FIELDS : DILUTION_FIELDS;
      const entries = { ...state.entries };
      for (const field of fields) entries[field] = empty;
      // the molecular weight is shared by both tabs: clearing the dilution keeps it
      if (action.tab === "dilution") entries.molarMass = state.entries.molarMass;
      return { ...state, entries, editing: null };
    }
  }
}

// ---------- derivation ----------

export interface QuantityView {
  amount: Amount | null;
  /** true when calculated, false when typed */
  output: boolean;
  /** a problem to show at this quantity */
  issue: string | null;
}

export interface Derived {
  quantities: Record<QuantityId, QuantityView>;
  /** the molecular weight in g/mol, when it is a usable value */
  molarMass: number | null;
  solution: SolutionResult;
  dilution: DilutionResult;
}

const amountOf = (entry: Entry): Amount | null => (entry.kind === "value" ? entry.amount : null);
const issueOf = (entry: Entry): string | null => (entry.kind === "invalid" ? entry.reason : null);

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

  // The molecular weight is checked whether or not a calculation needs it: the dilution tab uses it to convert.
  const quantities = {} as Record<QuantityId, QuantityView>;
  for (const field of [...SOLUTION_FIELDS, ...DILUTION_FIELDS]) {
    quantities[field] = { amount: amountOf(entries[field]), output: false, issue: issueOf(entries[field]) };
  }

  // ---- make a solution ----
  const molar = (entry: Entry): number | null => {
    const amount = amountOf(entry);
    return amount ? inDimension(amount, "molar", molarMass) : null;
  };
  const mass = amountOf(entries.mass);
  const volume = amountOf(entries.volume);
  const solution = solveSolution(state.solveFor, {
    molarMass: mw ? mw.value : null,
    concentration: molar(entries.concentration),
    volume: volume ? volume.value : null,
    mass: mass ? mass.value : null,
  });
  // a concentration in mg/mL waits for the molecular weight to become molar: it is there, MW is what is missing
  if (entries.concentration.kind === "value") solution.missing = solution.missing.filter((m) => m !== "concentration");
  for (const { input, message } of solution.issues) quantities[input].issue ??= message;
  const target = state.solveFor;
  quantities[target] = {
    amount: solution.value === null ? null : { dimension: DIMENSIONS[target][0], value: solution.value },
    output: true,
    issue: null,
  };
  quantities.moles = { amount: solution.moles === null ? null : { dimension: "amount", value: solution.moles }, output: true, issue: null };

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
    if (c1 === null || c2 === null) mixIssue = "One concentration is molar and the other a mass concentration: enter the molecular weight to compare them.";
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
  for (const { input, message } of dilution.issues) quantities[input].issue ??= message;
  const volumeAmount = (value: number | null): Amount | null => (value === null ? null : { dimension: "volume", value });
  quantities.stockVolume = { amount: volumeAmount(dilution.stockVolume), output: true, issue: null };
  quantities.diluentVolume = { amount: volumeAmount(dilution.diluentVolume), output: true, issue: null };

  return { quantities, molarMass, solution, dilution };
}

/** The first problem among these fields, in page order, for the result bar. Typed fields only: an answer has none. */
export function firstProblem(derived: Derived, fields: FieldId[]): string | null {
  for (const field of fields) if (!derived.quantities[field].output && derived.quantities[field].issue) return derived.quantities[field].issue;
  return null;
}

// ---------- display ----------

/** A quantity in one unit, as a number, or null when it is not known (or needs a molecular weight). */
export function valueIn(derived: Derived, quantity: QuantityId, unitId: UnitId): number | null {
  const amount = derived.quantities[quantity].amount;
  if (!amount) return null;
  const canonical = inDimension(amount, unit(unitId).dimension, derived.molarMass);
  return canonical === null ? null : fromCanonical(canonical, unitId);
}

/** What a box shows: the raw text while it is typed in, otherwise the value formatted for display. */
export function boxText(state: State, derived: Derived, quantity: QuantityId, unitId: UnitId): string {
  const editing = state.editing;
  if (editing && editing.field === quantity && editing.unit === unitId) return editing.text;
  const value = valueIn(derived, quantity, unitId);
  if (value === null) return "";
  const view = derived.quantities[quantity];
  // a typed value, in any of its units, keeps the digits typed; a calculated one is rounded (numbers/format.ts)
  const typedHere = !view.output && view.amount?.dimension === unit(unitId).dimension;
  return formatNumber(value, typedHere ? ENTERED : COMPUTED);
}

/** The units a quantity's boxes are shown in, grouped by dimension. */
export function unitGroups(quantity: QuantityId): { dimension: Dimension; units: UnitId[] }[] {
  return DIMENSIONS[quantity].map((dimension) => ({ dimension, units: unitsOf(dimension).map((u) => u.id) }));
}
