// The calculators: checks their inputs, then applies the equations. Canonical units in, canonical units out.
//
// An input is a number, or null when it is not there (empty, or not a valid number: the state layer has already
// said why at the box). A missing input is not an error, just a result that cannot be given yet.

import { concentrationFrom, finalVolumeFrom, massFrom, moles as molesOf, stockFrom, stockVolumeFrom, targetFrom, volumeFrom } from "./equations";

export type SolveFor = "mass" | "concentration" | "volume";

export interface SolutionInputs {
  molarMass: number | null; // g/mol
  concentration: number | null; // M
  volume: number | null; // L
  mass: number | null; // g
}

export type SolutionInput = keyof SolutionInputs;

/** A problem with one input, worded for the user. */
export interface Issue<K extends string> {
  input: K;
  message: string;
}

export interface SolutionResult {
  /** the solved quantity in canonical units (g, M or L), null when it cannot be calculated */
  value: number | null;
  /** n in mol, once mass and molecular weight are both known */
  moles: number | null;
  issues: Issue<SolutionInput>[];
  /** inputs still to fill in, in the order the page shows them */
  missing: SolutionInput[];
  /** why there is no answer although every input is fine: it is beyond what a double can hold */
  outOfRange: string | null;
}

/** Which inputs each calculation needs: the other three quantities. */
export const NEEDS: Record<SolveFor, SolutionInput[]> = {
  mass: ["molarMass", "concentration", "volume"],
  concentration: ["molarMass", "volume", "mass"],
  volume: ["molarMass", "concentration", "mass"],
};

const NAMES: Record<SolutionInput, string> = {
  molarMass: "Molecular weight",
  concentration: "Concentration",
  volume: "Volume",
  mass: "Mass",
};

type Rule = "positive" | "nonNegative";

// Zero is refused where it would divide by zero, or give a meaningless answer (a volume of 0 L to hold 0 g).
function rule(input: SolutionInput, target: SolveFor): Rule {
  if (input === "molarMass" || input === "volume") return "positive";
  if (target === "volume") return "positive"; // V = m / (C × MW): C = 0 divides by zero, m = 0 gives V = 0
  return "nonNegative";
}

// A double holds about 10^-308 to 10^308. Beyond that an answer overflows (Infinity) or underflows (0, or a value
// with few digits left): no lab value comes near, but a mistyped exponent can, and the page says so rather than
// showing nothing, or 0.
const MIN_NORMAL = 2 ** -1022;
export const TOO_LARGE = "The answer is too large to calculate (above about 10³⁰⁸). Check the values and their units.";
export const TOO_SMALL = "The answer is too small to calculate (below about 10⁻³⁰⁸). Check the values and their units.";

/** Why a result cannot be shown, or null: too large, or too small although none of its factors is zero. */
export function outOfRange(value: number, factors: number[]): string | null {
  if (!Number.isFinite(value)) return TOO_LARGE;
  if (Math.abs(value) < MIN_NORMAL && factors.every((f) => f !== 0)) return TOO_SMALL;
  return null;
}

export function check(name: string, value: number, r: Rule, why = ""): string | null {
  if (value < 0) return `${name} cannot be negative.`;
  if (r === "positive" && value === 0) return `${name} must be greater than zero${why}.`;
  return null;
}

export function solveSolution(target: SolveFor, inputs: SolutionInputs): SolutionResult {
  const issues: Issue<SolutionInput>[] = [];
  const missing: SolutionInput[] = [];
  for (const input of NEEDS[target]) {
    const value = inputs[input];
    if (value === null) {
      missing.push(input);
      continue;
    }
    const why = target === "volume" && (input === "concentration" || input === "mass") ? " to calculate a volume" : "";
    const message = check(NAMES[input], value, rule(input, target), why);
    if (message) issues.push({ input, message });
  }

  let value: number | null = null;
  let range: string | null = null;
  if (!issues.length && !missing.length) {
    const { molarMass, concentration, volume, mass } = inputs as Record<SolutionInput, number>;
    let found = 0;
    if (target === "mass") found = massFrom(concentration, volume, molarMass);
    if (target === "concentration") found = concentrationFrom(mass, molarMass, volume);
    if (target === "volume") found = volumeFrom(mass, concentration, molarMass);
    range = outOfRange(found, NEEDS[target].map((input) => inputs[input] as number)); // 1e300 × 1e300, 1e-300 × 1e-300
    if (!range) value = found;
  }

  const mass = target === "mass" ? value : inputs.mass;
  const molarMassOk = inputs.molarMass !== null && inputs.molarMass > 0;
  const moles = mass !== null && mass >= 0 && molarMassOk && !issues.length ? molesOf(mass, inputs.molarMass as number) : null;
  return { value, moles: moles !== null && Number.isFinite(moles) ? moles : null, issues, missing, outOfRange: range };
}

/** C1 × V1 = C2 × V2: the dilution finds any one of the four from the other three. */
export type DilutionFor = "stock" | "stockVolume" | "target" | "finalVolume";

export interface DilutionInputs {
  stock: number | null; // C1, any concentration unit
  stockVolume: number | null; // V1, L
  target: number | null; // C2, the same unit as C1
  finalVolume: number | null; // V2, L
}

export type DilutionInput = keyof DilutionInputs;

export interface DilutionResult {
  /** the quantity found: C1 or C2 in the unit of the other, V1 or V2 in L; null when it cannot be calculated */
  value: number | null;
  /** V2 − V1, L: the volume of diluent to add */
  diluentVolume: number | null;
  /** C1 / C2: "a 100-fold dilution" */
  factor: number | null;
  issues: Issue<DilutionInput>[];
  missing: DilutionInput[];
  /** a remark that is not a problem, e.g. the final concentration equals the stock */
  note: string | null;
  /** why there is no answer although every input is fine: too large or too small to calculate */
  outOfRange: string | null;
}

/** The order the page shows them in: the stock on the first row, the final solution on the second. */
const DILUTION_ORDER: DilutionInput[] = ["stock", "stockVolume", "target", "finalVolume"];

const DILUTION_NAMES: Record<DilutionInput, string> = { stock: "C₁", stockVolume: "V₁", target: "C₂", finalVolume: "V₂" };

export const HIGHER_THAN_STOCK =
  "C₂ is higher than C₁. A dilution can only lower the concentration: use a more concentrated stock or a lower final concentration.";
export const LARGER_THAN_FINAL = "V₁ is larger than V₂. The volume of stock cannot be more than the final volume.";
const NO_DILUTION = "C₂ equals C₁: use the stock as it is, with no diluent.";

// equal within float noise: 1 mM against 1000 µM
const same = (a: number, b: number) => Math.abs(a - b) <= 1e-12 * Math.max(a, b);

export function solveDilution(find: DilutionFor, inputs: DilutionInputs): DilutionResult {
  const issues: Issue<DilutionInput>[] = [];
  const missing: DilutionInput[] = [];
  for (const input of DILUTION_ORDER) {
    if (input === find) continue;
    const value = inputs[input];
    if (value === null) missing.push(input);
    else {
      const message = check(DILUTION_NAMES[input], value, "positive");
      if (message) issues.push({ input, message });
    }
  }
  const none = { value: null, diluentVolume: null, factor: null, issues, missing, note: null, outOfRange: null };
  if (issues.length || missing.length) return none;

  const { stock, stockVolume, target, finalVolume } = inputs as Record<DilutionInput, number>;
  // the rule given by the typed values: C2 ≤ C1 when both concentrations are typed, else V1 ≤ V2
  const findsVolume = find === "stockVolume" || find === "finalVolume";
  if (findsVolume && target > stock && !same(target, stock)) return { ...none, issues: [{ input: "target", message: HIGHER_THAN_STOCK }] };
  if (!findsVolume && stockVolume > finalVolume && !same(stockVolume, finalVolume))
    return { ...none, issues: [{ input: "stockVolume", message: LARGER_THAN_FINAL }] };

  const noDilution = findsVolume ? same(target, stock) : same(stockVolume, finalVolume);
  let value: number;
  if (find === "stockVolume") value = noDilution ? finalVolume : stockVolumeFrom(stock, target, finalVolume);
  else if (find === "finalVolume") value = noDilution ? stockVolume : finalVolumeFrom(stock, stockVolume, target);
  else if (find === "stock") value = noDilution ? target : stockFrom(target, finalVolume, stockVolume);
  else value = noDilution ? stock : targetFrom(stock, stockVolume, finalVolume);
  const range = outOfRange(value, DILUTION_ORDER.filter((input) => input !== find).map((input) => inputs[input] as number));
  if (range) return { ...none, outOfRange: range };

  const all = { stock, stockVolume, target, finalVolume, [find]: value };
  return {
    value,
    diluentVolume: noDilution ? 0 : Math.max(0, all.finalVolume - all.stockVolume),
    factor: noDilution ? 1 : all.stock / all.target,
    issues,
    missing,
    note: noDilution ? NO_DILUTION : null,
    outOfRange: null,
  };
}

export interface ConversionResult {
  issues: Issue<"converter" | "molarMass">[];
}

/**
 * The checks for converting a concentration between mass and molar. The value may be zero (nothing dissolved) but not
 * negative. The molecular weight, when there is one, must be positive: it is only needed to cross between the two
 * kinds of concentration, so its absence is not a problem here (the page says "needs MW" at the boxes it affects).
 */
export function checkConversion(value: number | null, molarMass: number | null): ConversionResult {
  const issues: ConversionResult["issues"] = [];
  if (value !== null) {
    const message = check("Concentration", value, "nonNegative");
    if (message) issues.push({ input: "converter", message });
  }
  if (molarMass !== null) {
    const message = check(NAMES.molarMass, molarMass, "positive");
    if (message) issues.push({ input: "molarMass", message });
  }
  return { issues };
}
