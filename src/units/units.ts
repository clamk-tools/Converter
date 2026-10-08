// The unit system: every unit the calculator knows, grouped by physical dimension, and the one conversion function.
//
// Each dimension has one canonical unit, and every value in the scientific state is stored in it:
//
//   molar concentration  M (mol/L)      mass concentration  g/L      volume  L      mass  g      molecular weight  g/mol
//
// A unit is a power of ten of its canonical unit, so it is stored as that exponent, not as a float factor:
// 1 µM = 10^-6 M. Converting by dividing or multiplying by an exact power of ten gives the closest double to the
// true decimal result (100 µM → 0.0001 M, not 0.00009999999999999999).

export type Dimension = "molar" | "massConc" | "volume" | "mass" | "molarMass";

export interface Unit {
  id: UnitId;
  /** written after a number: "µM" */
  symbol: string;
  /** written in a unit menu, as on GraphPad: "micromolar" */
  name: string;
  dimension: Dimension;
  /** 1 unit = 10^exponent canonical units */
  exponent: number;
}

const UNITS = {
  M: { symbol: "M", name: "molar", dimension: "molar", exponent: 0 },
  mM: { symbol: "mM", name: "millimolar", dimension: "molar", exponent: -3 },
  uM: { symbol: "µM", name: "micromolar", dimension: "molar", exponent: -6 },
  nM: { symbol: "nM", name: "nanomolar", dimension: "molar", exponent: -9 },
  pM: { symbol: "pM", name: "picomolar", dimension: "molar", exponent: -12 },

  // mass concentration: g/L is the same as mg/mL; 1 % w/v is 1 g in 100 mL = 10 g/L; 1 ppm is 1 mg/L (a dilute aqueous solution)
  g_L: { symbol: "g/L", name: "grams/liter", dimension: "massConc", exponent: 0 },
  mg_mL: { symbol: "mg/mL", name: "milligrams/milliliter", dimension: "massConc", exponent: 0 },
  pct_wv: { symbol: "% w/v", name: "percent weight/volume", dimension: "massConc", exponent: 1 },
  ug_mL: { symbol: "µg/mL", name: "micrograms/milliliter", dimension: "massConc", exponent: -3 },
  ppm: { symbol: "ppm", name: "ppm (mg/L)", dimension: "massConc", exponent: -3 },
  ng_mL: { symbol: "ng/mL", name: "nanograms/milliliter", dimension: "massConc", exponent: -6 },

  L: { symbol: "L", name: "liter", dimension: "volume", exponent: 0 },
  mL: { symbol: "mL", name: "milliliter", dimension: "volume", exponent: -3 },
  uL: { symbol: "µL", name: "microliter", dimension: "volume", exponent: -6 },
  nL: { symbol: "nL", name: "nanoliter", dimension: "volume", exponent: -9 },

  g: { symbol: "g", name: "grams", dimension: "mass", exponent: 0 },
  mg: { symbol: "mg", name: "milligrams", dimension: "mass", exponent: -3 },
  ug: { symbol: "µg", name: "micrograms", dimension: "mass", exponent: -6 },
  ng: { symbol: "ng", name: "nanograms", dimension: "mass", exponent: -9 },

  g_mol: { symbol: "g/mol", name: "grams/mole", dimension: "molarMass", exponent: 0 },
} as const satisfies Record<string, Omit<Unit, "id">>;

export type UnitId = keyof typeof UNITS;

export function unit(id: UnitId): Unit {
  return { id, ...UNITS[id] };
}

/** The units of one dimension, largest first (the order the menus list them in). */
export function unitsOf(dimension: Dimension): Unit[] {
  return (Object.keys(UNITS) as UnitId[]).map(unit).filter((u) => u.dimension === dimension);
}

export const CANONICAL: Record<Dimension, UnitId> = { molar: "M", massConc: "g_L", volume: "L", mass: "g", molarMass: "g_mol" };

// Multiply by 10^exponent without the rounding error of a float factor: 10^k is exact for |k| <= 22.
function scale(value: number, exponent: number): number {
  if (exponent === 0) return value;
  return exponent > 0 ? value * 10 ** exponent : value / 10 ** -exponent;
}

/** A value given in `from`, expressed in the canonical unit of its dimension. */
export function toCanonical(value: number, from: UnitId): number {
  return scale(value, UNITS[from].exponent);
}

/** A canonical value, expressed in `to`. */
export function fromCanonical(value: number, to: UnitId): number {
  return scale(value, -UNITS[to].exponent);
}

/** Converts between two units of the same dimension; throws on a mismatch, which is a programming error. */
export function convert(value: number, from: UnitId, to: UnitId): number {
  if (UNITS[from].dimension !== UNITS[to].dimension) throw new Error(`Cannot convert ${from} to ${to}`);
  return scale(value, UNITS[from].exponent - UNITS[to].exponent);
}
