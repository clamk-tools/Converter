// The unit system: every unit the calculator knows, grouped by physical dimension, and the one conversion function.
//
// Each dimension has one canonical unit, and every value in the scientific state is stored in it:
//
//   molar concentration  M (mol/L)      mass concentration  g/L (= mg/mL)
//   volume               L              mass                g
//   amount               mol            molar mass          g/mol
//
// A unit is a power of ten of its canonical unit, so it is stored as that exponent, not as a float factor:
// 1 µM = 10^-6 M. Converting by dividing or multiplying by an exact power of ten gives the closest double to the
// true decimal result (100 µM → 0.0001 M, not 0.00009999999999999999).

export type Dimension = "molar" | "massConc" | "volume" | "mass" | "amount" | "molarMass";

export interface Unit {
  id: UnitId;
  /** what the page shows, e.g. "µM" */
  symbol: string;
  dimension: Dimension;
  /** 1 unit = 10^exponent canonical units */
  exponent: number;
}

const UNITS = {
  M: { symbol: "M", dimension: "molar", exponent: 0 },
  mM: { symbol: "mM", dimension: "molar", exponent: -3 },
  uM: { symbol: "µM", dimension: "molar", exponent: -6 },
  nM: { symbol: "nM", dimension: "molar", exponent: -9 },
  pM: { symbol: "pM", dimension: "molar", exponent: -12 },

  mg_mL: { symbol: "mg/mL", dimension: "massConc", exponent: 0 },
  ug_mL: { symbol: "µg/mL", dimension: "massConc", exponent: -3 },
  ng_mL: { symbol: "ng/mL", dimension: "massConc", exponent: -6 },

  L: { symbol: "L", dimension: "volume", exponent: 0 },
  mL: { symbol: "mL", dimension: "volume", exponent: -3 },
  uL: { symbol: "µL", dimension: "volume", exponent: -6 },
  nL: { symbol: "nL", dimension: "volume", exponent: -9 },

  g: { symbol: "g", dimension: "mass", exponent: 0 },
  mg: { symbol: "mg", dimension: "mass", exponent: -3 },
  ug: { symbol: "µg", dimension: "mass", exponent: -6 },
  ng: { symbol: "ng", dimension: "mass", exponent: -9 },

  mol: { symbol: "mol", dimension: "amount", exponent: 0 },
  mmol: { symbol: "mmol", dimension: "amount", exponent: -3 },
  umol: { symbol: "µmol", dimension: "amount", exponent: -6 },
  nmol: { symbol: "nmol", dimension: "amount", exponent: -9 },
  pmol: { symbol: "pmol", dimension: "amount", exponent: -12 },

  g_mol: { symbol: "g/mol", dimension: "molarMass", exponent: 0 },
  kDa: { symbol: "kDa", dimension: "molarMass", exponent: 3 }, // 1 kDa = 1 kg/mol = 1000 g/mol
} as const satisfies Record<string, Omit<Unit, "id">>;

export type UnitId = keyof typeof UNITS;

export function unit(id: UnitId): Unit {
  return { id, ...UNITS[id] };
}

/** The units of one dimension, largest first (the order the page lists them in). */
export function unitsOf(dimension: Dimension): Unit[] {
  return (Object.keys(UNITS) as UnitId[]).map(unit).filter((u) => u.dimension === dimension);
}

export const CANONICAL: Record<Dimension, UnitId> = {
  molar: "M",
  massConc: "mg_mL",
  volume: "L",
  mass: "g",
  amount: "mol",
  molarMass: "g_mol",
};

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
