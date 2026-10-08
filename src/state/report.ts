// The report: calculations the user chose to keep, as a snapshot of the text shown when they were added (later edits
// to the calculators do not change them). Kept in the viewer's browser only; storage can be refused, so every read
// and write is guarded and the page works without it.

import { ENTERED, formatNumber } from "../numbers/format";
import { unit } from "../units/units";
import type { Derived, FieldId, OutputId, Section, State } from "./model";
import { resultText, unitOf, valueIn } from "./model";

export interface ReportEntry {
  id: string;
  section: Section;
  /** "C 100 mM", "MW 180.16 g/mol", … in the order the calculator shows them */
  inputs: { symbol: string; text: string }[];
  /** "m 180.16 mg" */
  result: { symbol: string; text: string };
}

/** Short names for the report's first column. */
export const SECTION_NAMES: Record<Section, string> = { mass: "Mass", volume: "Volume", concentration: "Molarity", dilution: "Dilution" };

const SYMBOLS: Record<FieldId | OutputId, string> = {
  concentration: "C",
  molarMass: "MW",
  volume: "V",
  mass: "m",
  stock: "C₁",
  target: "C₂",
  finalVolume: "V₂",
  massResult: "m",
  volumeResult: "V",
  concentrationResult: "C",
  stockVolume: "V₁",
};

function inputText(state: State, derived: Derived, field: FieldId): string {
  const unitId = unitOf(state, field);
  const value = valueIn(derived, field, unitId);
  return value === null ? "" : `${formatNumber(value, ENTERED)} ${unit(unitId).symbol}`;
}

/** The entry for one calculator as shown now, or null when it has no answer yet. */
export function entryFor(state: State, derived: Derived, section: Section, fields: FieldId[], output: OutputId, id: string): ReportEntry | null {
  const result = resultText(state, derived, output);
  if (!result) return null;
  return {
    id,
    section,
    inputs: fields.map((f) => ({ symbol: SYMBOLS[f], text: inputText(state, derived, f) })),
    result: { symbol: SYMBOLS[output], text: result },
  };
}

/** The entry as one line of text: "Mass: C 100 mM · MW 180.16 g/mol · V 10 mL → m 180.16 mg". */
export const entryLine = (e: ReportEntry) =>
  `${SECTION_NAMES[e.section]}: ${e.inputs.map((i) => `${i.symbol} ${i.text}`).join(" · ")} → ${e.result.symbol} ${e.result.text}`;

// ---------- the viewer's browser ----------

const KEY = "molarity-calculator:report";

export function loadReport(): ReportEntry[] {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(stored) ? stored : [];
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
