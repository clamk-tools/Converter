// The calculation report: calculations the user chose to keep, each written out as a worked calculation a client can
// follow: what was entered, the conversion to base units, the formula, the numbers substituted, the result, and a
// check made by working backwards from the result.
//
//   Given → In base units → Formula → Substitution → Result → Check
//
// An entry is a snapshot of text, built from the same stored values and the same equations (engine/equations.ts) as
// the calculators, so the report cannot disagree with the page; later edits to the calculators do not change it.
// Kept in the viewer's browser only; storage can be refused, so every read and write is guarded.

import { concentrationFrom, massFrom } from "../engine/equations";
import { COMPUTED, ENTERED, formatNumber } from "../numbers/format";
import { CANONICAL, unit } from "../units/units";
import type { Dimension, UnitId } from "../units/units";
import { DIMENSION } from "./model";
import type { Derived, DilutionFor, FieldId, OutputId, Section, SolveFor, State } from "./model";
import { resultText, unitOf, valueIn } from "./model";

export interface ReportEntry {
  id: string;
  section: Section;
  /** what kind of calculation it is: "Mass from volume & concentration" */
  title: string;
  /** a name the user gave it ("Buffer A, 10 mL"); the title shows when there is none */
  name?: string;
  /** folded to its heading and result */
  collapsed?: boolean;
  /** what was entered: "C = 100 mM", with the quantity's name */
  given: { name: string; text: string }[];
  /** conversions to base units, only for values not already in them: "V = 10 mL × 10⁻³ = 0.01 L" */
  convert: string[];
  formula: string;
  /** the formula with the base-unit values in it, then its value */
  substitution: string[];
  /** the result in base units, then in the unit chosen if that differs */
  result: string[];
  /** a reverse calculation from the result, and whether it gives back the input */
  check: { text: string; ok: boolean };
}

/** Names for the report's titles and the Report tab's lines. */
export const SECTION_NAMES: Record<Section, string> = { mass: "Mass", volume: "Volume", concentration: "Molarity", dilution: "Dilution" };

const BASE_LABEL: Record<Dimension, string> = { molar: "mol/L", massConc: "g/L", volume: "L", mass: "g", molarMass: "g/mol" };

const SYMBOL: Record<FieldId | OutputId, string> = {
  concentration: "C",
  molarMass: "MW",
  volume: "V",
  mass: "m",
  stock: "C₁",
  stockVolume: "V₁",
  target: "C₂",
  finalVolume: "V₂",
  massResult: "m",
  volumeResult: "V",
  concentrationResult: "C",
  stockResult: "C₁",
  stockVolumeResult: "V₁",
  targetResult: "C₂",
  finalVolumeResult: "V₂",
};

const NAME: Record<FieldId | OutputId, string> = {
  concentration: "Concentration",
  molarMass: "Molecular weight",
  volume: "Volume",
  mass: "Mass",
  stock: "Stock concentration",
  stockVolume: "Volume of stock",
  target: "Final concentration",
  finalVolume: "Final volume",
  massResult: "Mass",
  volumeResult: "Volume",
  concentrationResult: "Molarity",
  stockResult: "Stock concentration",
  stockVolumeResult: "Volume of stock",
  targetResult: "Final concentration",
  finalVolumeResult: "Final volume",
};

const SUPERSCRIPT: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const power = (exponent: number) => `10${String(exponent).replace(/./g, (c) => SUPERSCRIPT[c])}`;

interface Spec {
  title: string;
  inputs: FieldId[];
  output: OutputId;
  formula: string;
  /** the formula with values in it; `v` holds the base-unit values, `out` the result in base units */
  substitute: (v: Record<string, string>) => string;
  /** works backwards from the result: the text, and the value it gives against the value it should give */
  check: (v: Record<string, number>, out: number, f: (n: number) => string) => { text: string; got: number; want: number };
}

const SPECS: Record<SolveFor, Spec> = {
  mass: {
    title: "Mass from volume & concentration",
    inputs: ["concentration", "molarMass", "volume"],
    output: "massResult",
    formula: "m = C × V × MW",
    substitute: (v) => `m = ${v.concentration} mol/L × ${v.volume} L × ${v.molarMass} g/mol`,
    check: (v, m, f) => {
      const got = concentrationFrom(m, v.molarMass, v.volume);
      return { text: `C = m / (MW × V) = ${f(m)} / (${f(v.molarMass)} × ${f(v.volume)}) = ${f(got)} mol/L`, got, want: v.concentration };
    },
  },
  volume: {
    title: "Volume from mass & concentration",
    inputs: ["mass", "molarMass", "concentration"],
    output: "volumeResult",
    formula: "V = m / (C × MW)",
    substitute: (v) => `V = ${v.mass} g / (${v.concentration} mol/L × ${v.molarMass} g/mol)`,
    check: (v, volume, f) => {
      const got = massFrom(v.concentration, volume, v.molarMass);
      return { text: `m = C × V × MW = ${f(v.concentration)} × ${f(volume)} × ${f(v.molarMass)} = ${f(got)} g`, got, want: v.mass };
    },
  },
  concentration: {
    title: "Molarity from mass & volume",
    inputs: ["mass", "molarMass", "volume"],
    output: "concentrationResult",
    formula: "C = m / (MW × V)",
    substitute: (v) => `C = ${v.mass} g / (${v.molarMass} g/mol × ${v.volume} L)`,
    check: (v, c, f) => {
      const got = massFrom(c, v.volume, v.molarMass);
      return { text: `m = C × V × MW = ${f(c)} × ${f(v.volume)} × ${f(v.molarMass)} = ${f(got)} g`, got, want: v.mass };
    },
  },
};

// C₁V₁ = C₂V₂, solved for each of the four. The check is the same for all: both sides, in mol.
const dilutionCheck = (v: Record<string, number>, out: number, find: DilutionFor, f: (n: number) => string) => {
  const all = { ...v, [find]: out };
  const got = all.stock * all.stockVolume;
  const want = all.target * all.finalVolume;
  return { text: `C₁ × V₁ = ${f(all.stock)} × ${f(all.stockVolume)} = ${f(got)} mol, and C₂ × V₂ = ${f(all.target)} × ${f(all.finalVolume)} = ${f(want)} mol`, got, want };
};

const DILUTION_SPECS: Record<DilutionFor, Spec> = {
  stockVolume: {
    title: "Dilution: volume of stock",
    inputs: ["stock", "target", "finalVolume"],
    output: "stockVolumeResult",
    formula: "V₁ = C₂ × V₂ / C₁",
    substitute: (v) => `V₁ = ${v.target} mol/L × ${v.finalVolume} L / ${v.stock} mol/L`,
    check: (v, out, f) => dilutionCheck(v, out, "stockVolume", f),
  },
  finalVolume: {
    title: "Dilution: final volume",
    inputs: ["stock", "stockVolume", "target"],
    output: "finalVolumeResult",
    formula: "V₂ = C₁ × V₁ / C₂",
    substitute: (v) => `V₂ = ${v.stock} mol/L × ${v.stockVolume} L / ${v.target} mol/L`,
    check: (v, out, f) => dilutionCheck(v, out, "finalVolume", f),
  },
  stock: {
    title: "Dilution: stock concentration",
    inputs: ["stockVolume", "target", "finalVolume"],
    output: "stockResult",
    formula: "C₁ = C₂ × V₂ / V₁",
    substitute: (v) => `C₁ = ${v.target} mol/L × ${v.finalVolume} L / ${v.stockVolume} L`,
    check: (v, out, f) => dilutionCheck(v, out, "stock", f),
  },
  target: {
    title: "Dilution: final concentration",
    inputs: ["stock", "stockVolume", "finalVolume"],
    output: "targetResult",
    formula: "C₂ = C₁ × V₁ / V₂",
    substitute: (v) => `C₂ = ${v.stock} mol/L × ${v.stockVolume} L / ${v.finalVolume} L`,
    check: (v, out, f) => dilutionCheck(v, out, "target", f),
  },
};

// equal to within the rounding of a calculation done with doubles
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b), Number.MIN_VALUE);

/** The worked calculation for one calculator as it stands now, or null when it has no answer yet. */
export function entryFor(state: State, derived: Derived, section: Section, id: string): ReportEntry | null {
  const spec = section === "dilution" ? DILUTION_SPECS[state.dilutionFind] : SPECS[section];
  const out = derived.values[spec.output];
  if (out === null) return null;
  const f = (n: number) => formatNumber(n, ENTERED);

  const base: Record<string, number> = {};
  const given: ReportEntry["given"] = [];
  const convert: string[] = [];
  for (const field of spec.inputs) {
    const value = derived.values[field];
    if (value === null) return null;
    base[field] = value;
    const unitId: UnitId = unitOf(state, field);
    const shown = unit(unitId);
    const shownText = f(valueIn(derived, field, unitId) ?? value);
    given.push({ name: NAME[field], text: `${SYMBOL[field]} = ${shownText} ${shown.symbol}` });
    if (shown.exponent !== 0) {
      convert.push(`${SYMBOL[field]} = ${shownText} ${shown.symbol} × ${power(shown.exponent)} = ${f(value)} ${BASE_LABEL[DIMENSION[field]]}`);
    }
  }

  const texts = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, f(v)]));
  const baseOut = `${SYMBOL[spec.output]} = ${formatNumber(out, COMPUTED)} ${BASE_LABEL[DIMENSION[spec.output]]}`;
  const chosen = `${SYMBOL[spec.output]} = ${resultText(state, derived, spec.output)}`;
  const check = spec.check(base, out, f);

  return {
    id,
    section,
    title: spec.title,
    given,
    convert,
    formula: spec.formula,
    substitution: [spec.substitute(texts), `= ${formatNumber(out, COMPUTED)} ${BASE_LABEL[DIMENSION[spec.output]]}`],
    result: unitOf(state, spec.output) === CANONICAL[DIMENSION[spec.output]] ? [chosen] : [baseOut, chosen],
    check: { text: check.text, ok: close(check.got, check.want) },
  };
}

// ---------- renaming and collapsing ----------

/** What the entry is called on the page: the user's name, or its title. */
export const displayName = (e: ReportEntry) => e.name || e.title;

/** Gives an entry a name; an empty name (spaces only) takes it back. */
export const rename = (entries: ReportEntry[], id: string, name: string): ReportEntry[] =>
  entries.map((e) => (e.id === id ? { ...e, name: name.trim().replace(/\s+/g, " ").slice(0, 80) || undefined } : e));

export const toggleCollapsed = (entries: ReportEntry[], id: string): ReportEntry[] =>
  entries.map((e) => (e.id === id ? { ...e, collapsed: !e.collapsed } : e));

/** Folds every entry, or, when all are already folded, opens them all. */
export const toggleAll = (entries: ReportEntry[]): ReportEntry[] => {
  const fold = entries.some((e) => !e.collapsed);
  return entries.map((e) => ({ ...e, collapsed: fold }));
};

/** The entry as plain text, for copying into a document. */
export function entryText(e: ReportEntry, n: number): string {
  const lines = [`${n}. ${e.name ? `${e.name} (${e.title})` : e.title}`, "Given:", ...e.given.map((g) => `  ${g.text}  (${g.name.toLowerCase()})`)];
  if (e.convert.length) lines.push("In base units:", ...e.convert.map((c) => `  ${c}`));
  lines.push("Formula:", `  ${e.formula}`, "Substitution:", ...e.substitution.map((s) => `  ${s}`), "Result:", ...e.result.map((r) => `  ${r}`));
  lines.push("Check:", `  ${e.check.text} ${e.check.ok ? "✓" : "✗"}`);
  return lines.join("\n");
}

// ---------- the viewer's browser ----------

// the entries changed shape when the report became a calculation report, so earlier ones are not read
const KEY = "molarity-calculator:report-v2";

// every field the Report view reads, so an entry stored in another shape is left out rather than breaking the view
const isEntry = (x: unknown): x is ReportEntry => {
  if (typeof x !== "object" || x === null) return false;
  const e = x as ReportEntry;
  return (
    typeof e.id === "string" &&
    typeof e.title === "string" &&
    typeof e.formula === "string" &&
    [e.given, e.convert, e.substitution, e.result].every(Array.isArray) &&
    e.result.length > 0 &&
    typeof e.check === "object" &&
    e.check !== null &&
    typeof e.check.text === "string"
  );
};

export function loadReport(): ReportEntry[] {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter(isEntry) : [];
  } catch {
    return [];
  }
}

export function saveReport(entries: ReportEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // storage refused (private window, blocked site data): the report lasts for this visit
  }
}
