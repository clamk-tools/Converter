// The formulas each calculator uses, written for the info bubble (the "i" beside its title). Plain text, no logic:
// the code that computes them is engine/equations.ts, and doc/CALCULATIONS.md is the reference these lines follow.

export interface Formula {
  /** the equation, in symbols */
  equation: string;
  /** what it says, in words */
  meaning: string;
}

export interface CalculatorInfo {
  formulas: Formula[];
  /** conventions and checks that apply to the whole calculator */
  notes: string[];
}

const UNITS_NOTE = "Every value is first converted to a base unit (M, L, g, g/mol); each unit is a power of ten of its base unit (1 mM = 10⁻³ M, 1 mL = 10⁻³ L, 1 mg = 10⁻³ g).";
const LETTERS = "C = concentration (mol/L), V = volume (L), m = mass (g), MW = molecular weight (g/mol), n = amount (mol).";

export const INFO: Record<"mass" | "volume" | "concentration" | "dilution" | "conversion", CalculatorInfo> = {
  mass: {
    formulas: [
      { equation: "n = C × V", meaning: "the amount of substance in the solution" },
      { equation: "m = n × MW", meaning: "the mass that amount weighs" },
      { equation: "m = C × V × MW", meaning: "the two together: the mass to weigh" },
    ],
    notes: [LETTERS, UNITS_NOTE, "A concentration of 0 gives a mass of 0. The molecular weight and the volume must be above 0."],
  },
  volume: {
    formulas: [
      { equation: "n = m / MW", meaning: "the amount of substance in the mass" },
      { equation: "V = n / C", meaning: "the volume that holds that amount at the concentration" },
      { equation: "V = m / (C × MW)", meaning: "the two together: the volume to make up" },
    ],
    notes: [LETTERS, UNITS_NOTE, "The mass, the concentration and the molecular weight must all be above 0, since the concentration is a divisor."],
  },
  concentration: {
    formulas: [
      { equation: "n = m / MW", meaning: "the amount of substance in the mass" },
      { equation: "C = n / V", meaning: "the amount in each liter" },
      { equation: "C = m / (MW × V)", meaning: "the two together: the molarity" },
    ],
    notes: [LETTERS, UNITS_NOTE, "A mass of 0 gives 0 M. The molecular weight and the volume must be above 0."],
  },
  dilution: {
    formulas: [
      { equation: "C₁ × V₁ = C₂ × V₂", meaning: "the amount of substance does not change when a stock is diluted" },
      { equation: "V₁ = C₂ × V₂ / C₁", meaning: "the volume of stock to take" },
      { equation: "V₂ − V₁", meaning: "the volume of diluent to add to reach the desired volume" },
    ],
    notes: [
      "C₁ = stock concentration, C₂ = desired concentration, V₂ = desired volume, V₁ = required volume of stock.",
      "C₁ and C₂ are compared in the same unit, whichever ones were chosen. The required volume is shown in the unit of the desired volume.",
      "The desired concentration cannot be above the stock: a dilution can only lower a concentration.",
    ],
  },
  conversion: {
    formulas: [
      { equation: "ρ = C × MW", meaning: "from molar (mol/L) to mass per volume (g/L)" },
      { equation: "C = ρ / MW", meaning: "from mass per volume (g/L) back to molar (mol/L)" },
      { equation: "1 % w/v = 1 g / 100 mL = 10 g/L", meaning: "percent weight per volume" },
      { equation: "1 ppm = 1 mg/L", meaning: "parts per million, for a dilute water solution (1 L weighs 1 kg)" },
    ],
    notes: [
      "ρ = mass concentration (g/L), C = molar concentration (mol/L), MW = molecular weight (g/mol).",
      "A mass concentration is a mass unit per a volume unit, a power of ten of g/L: 10 raised to (exponent of the mass unit − exponent of the volume unit). mg/mL: −3 − (−3) = 0, so 1 g/L. µg/mL: −6 − (−3) = −3, so 10⁻³ g/L.",
      "Changing the unit within one line (mM to µM, mg/mL to µg/mL) never needs the molecular weight. Crossing between molar and mass does.",
    ],
  },
};
