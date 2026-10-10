// The unit system: every unit the calculator knows, grouped by physical dimension, and the one conversion function.
//
// Each dimension has one canonical unit, and every value in the scientific state is stored in it:
//
//   molar concentration  M (mol/L)      mass concentration  g/L      volume  L      mass  g      molecular weight  g/mol
//
// A mass concentration is a pair, a mass unit per a volume unit (µg/mL, mg/L, ng/µL…): any of the 4 × 4 can be chosen, and
// its size is the mass unit's exponent minus the volume unit's. % w/v and ppm are not pairs and are listed beside them.
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

  // mass concentration that is not a pair: 1 % w/v is 1 g in 100 mL = 10 g/L; 1 ppm is 1 mg/L (a dilute aqueous solution)
  pct_wv: { symbol: "% w/v", name: "% w/v", dimension: "massConc", exponent: 1 },
  ppm: { symbol: "ppm", name: "ppm (mg/L)", dimension: "massConc", exponent: -3 },

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

type FixedUnitId = keyof typeof UNITS;

/** The mass and the volume units a mass concentration can be written with. */
export type MassUnitId = "g" | "mg" | "ug" | "ng";
export type VolumeUnitId = "L" | "mL" | "uL" | "nL";
/** A mass concentration written as a pair: "mg/mL", "ug/L"… */
export type PairUnitId = `${MassUnitId}/${VolumeUnitId}`;
export type UnitId = FixedUnitId | PairUnitId;

const MASS_IDS: MassUnitId[] = ["g", "mg", "ug", "ng"];
const VOLUME_IDS: VolumeUnitId[] = ["L", "mL", "uL", "nL"];

export const isPair = (id: UnitId): id is PairUnitId => id.includes("/");

/** The mass unit and the volume unit of a pair: "mg/mL" → ["mg", "mL"]. */
export const splitPair = (id: PairUnitId): [MassUnitId, VolumeUnitId] => id.split("/") as [MassUnitId, VolumeUnitId];

export const pair = (mass: MassUnitId, volume: VolumeUnitId): PairUnitId => `${mass}/${volume}`;

export function unit(id: UnitId): Unit {
  if (isPair(id)) {
    const [m, v] = splitPair(id);
    const mass = UNITS[m];
    const volume = UNITS[v];
    return { id, symbol: `${mass.symbol}/${volume.symbol}`, name: `${mass.name}/${volume.name}`, dimension: "massConc", exponent: mass.exponent - volume.exponent };
  }
  return { id, ...UNITS[id] };
}

/** The units of one dimension, largest first (the order the menus list them in). For a mass concentration: every pair, then the rest. */
export function unitsOf(dimension: Dimension): Unit[] {
  const fixed = (Object.keys(UNITS) as FixedUnitId[]).map(unit).filter((u) => u.dimension === dimension);
  if (dimension !== "massConc") return fixed;
  return [...MASS_IDS.flatMap((m) => VOLUME_IDS.map((v) => unit(pair(m, v)))), ...fixed];
}

export const CANONICAL: Record<Dimension, UnitId> = { molar: "M", massConc: "g/L", volume: "L", mass: "g", molarMass: "g_mol" };

// Multiply by 10^exponent without the rounding error of a float factor: 10^k is exact for |k| <= 22.
function scale(value: number, exponent: number): number {
  if (exponent === 0) return value;
  return exponent > 0 ? value * 10 ** exponent : value / 10 ** -exponent;
}

/** A value given in `from`, expressed in the canonical unit of its dimension. */
export function toCanonical(value: number, from: UnitId): number {
  return scale(value, unit(from).exponent);
}

/** A canonical value, expressed in `to`. */
export function fromCanonical(value: number, to: UnitId): number {
  return scale(value, -unit(to).exponent);
}

/** Converts between two units of the same dimension; throws on a mismatch, which is a programming error. */
export function convert(value: number, from: UnitId, to: UnitId): number {
  const [a, b] = [unit(from), unit(to)];
  if (a.dimension !== b.dimension) throw new Error(`Cannot convert ${from} to ${to}`);
  return scale(value, a.exponent - b.exponent);
}
