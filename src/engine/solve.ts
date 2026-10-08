// The two calculators: checks their inputs, then applies the equations. Canonical units in, canonical units out.
//
// An input is a number, or null when it is not there (empty, or not a valid number: the state layer has already
// said why at the box). A missing input is not an error, just a result that cannot be given yet.

import { concentrationFrom, massFrom, moles as molesOf, stockVolumeFrom, volumeFrom } from "./equations";

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
  if (!issues.length && !missing.length) {
    const { molarMass, concentration, volume, mass } = inputs as Record<SolutionInput, number>;
    if (target === "mass") value = massFrom(concentration, volume, molarMass);
    if (target === "concentration") value = concentrationFrom(mass, molarMass, volume);
    if (target === "volume") value = volumeFrom(mass, concentration, molarMass);
    if (!Number.isFinite(value)) value = null; // overflow: 1e300 × 1e300
  }

  const mass = target === "mass" ? value : inputs.mass;
  const molarMassOk = inputs.molarMass !== null && inputs.molarMass > 0;
  const moles = mass !== null && mass >= 0 && molarMassOk && !issues.length ? molesOf(mass, inputs.molarMass as number) : null;
  return { value, moles: moles !== null && Number.isFinite(moles) ? moles : null, issues, missing };
}

export interface DilutionInputs {
  stock: number | null; // C1, any concentration unit
  target: number | null; // C2, the same unit as C1
  finalVolume: number | null; // V2, L
}

export type DilutionInput = keyof DilutionInputs;

export interface DilutionResult {
  /** V1, L: the volume of stock to take */
  stockVolume: number | null;
  /** V2 − V1, L: the volume of diluent to add */
  diluentVolume: number | null;
  /** C1 / C2: "a 100-fold dilution" */
  factor: number | null;
  issues: Issue<DilutionInput>[];
  missing: DilutionInput[];
  /** a remark that is not a problem, e.g. the target equals the stock */
  note: string | null;
}

const DILUTION_NAMES: Record<DilutionInput, string> = {
  stock: "Stock concentration",
  target: "Desired concentration",
  finalVolume: "Desired volume",
};

export const HIGHER_THAN_STOCK =
  "The desired concentration is higher than the stock. A dilution can only lower the concentration: use a more concentrated stock or a lower desired concentration.";

export function solveDilution(inputs: DilutionInputs): DilutionResult {
  const issues: Issue<DilutionInput>[] = [];
  const missing: DilutionInput[] = [];
  for (const input of ["stock", "target", "finalVolume"] as const) {
    const value = inputs[input];
    if (value === null) missing.push(input);
    else {
      const message = check(DILUTION_NAMES[input], value, "positive");
      if (message) issues.push({ input, message });
    }
  }
  const none = { stockVolume: null, diluentVolume: null, factor: null, issues, missing, note: null };
  if (issues.length || missing.length) return none;

  const { stock, target, finalVolume } = inputs as Record<DilutionInput, number>;
  // equal within float noise: 1 mM against 1000 µM
  const same = Math.abs(target - stock) <= 1e-12 * stock;
  if (target > stock && !same) return { ...none, issues: [{ input: "target", message: HIGHER_THAN_STOCK }] };

  const stockVolume = stockVolumeFrom(stock, target, finalVolume);
  const factor = stock / target;
  if (!Number.isFinite(stockVolume) || !Number.isFinite(factor)) return none;
  return {
    stockVolume: same ? finalVolume : stockVolume,
    diluentVolume: same ? 0 : Math.max(0, finalVolume - stockVolume),
    factor: same ? 1 : factor,
    issues,
    missing,
    note: same ? "The desired concentration equals the stock: use the stock as it is, with no diluent." : null,
  };
}
