// The formulas each calculator uses, written for the info bubble (the "i" beside its title). Plain text, no logic:
// the code that computes them is engine/equations.ts, and doc/CALCULATIONS.md is the reference these lines follow.

export interface Formula {
  /** the equation, in symbols */
  equation: string;
  /** a few words on what it gives, or empty */
  meaning: string;
}

/** The formula calculator 1 uses for each quantity it can find, shown under its tiles. */
export const SOLVED_BY: Record<"mass" | "volume" | "concentration", string> = {
  mass: "m = C × V × MW",
  volume: "V = m / (C × MW)",
  concentration: "C = m / (MW × V)",
};

/** The formula calculator 2 uses for each quantity it can find. */
export const DILUTED_BY: Record<"stock" | "stockVolume" | "target" | "finalVolume", string> = {
  stock: "C₁ = C₂ × V₂ / V₁",
  stockVolume: "V₁ = C₂ × V₂ / C₁",
  target: "C₂ = C₁ × V₁ / V₂",
  finalVolume: "V₂ = C₁ × V₁ / C₂",
};

export interface CalculatorInfo {
  formulas: Formula[];
  /** conventions and checks that apply to the whole calculator */
  notes: string[];
}

export const INFO: Record<"solution" | "dilution" | "conversion", CalculatorInfo> = {
  solution: {
    formulas: [
      { equation: "n = C × V = m / MW", meaning: "" },
      { equation: "m = C × V × MW", meaning: "mass" },
      { equation: "V = m / (C × MW)", meaning: "volume" },
      { equation: "C = m / (MW × V)", meaning: "concentration" },
    ],
    notes: ["C^{mol/L}, V^{L}, m^{g}, MW^{g/mol}, n^{mol}. Units are converted to these first.", "MW > 0. To find V: m and C > 0."],
  },
  dilution: {
    formulas: [
      { equation: "C₁V₁ = C₂V₂", meaning: "" },
      { equation: "V₁ = C₂ × V₂ / C₁", meaning: "stock to take" },
      { equation: "V₂ = C₁ × V₁ / C₂", meaning: "final volume" },
      { equation: "C₁ = C₂ × V₂ / V₁", meaning: "stock concentration" },
      { equation: "C₂ = C₁ × V₁ / V₂", meaning: "final concentration" },
      { equation: "V₂ − V₁", meaning: "diluent to add" },
    ],
    notes: ["C₁^{mol/L}, C₂^{mol/L}, V₁^{L}, V₂^{L}. 1 = stock, 2 = final.", "C₂ ≤ C₁ and V₁ ≤ V₂."],
  },
  conversion: {
    formulas: [
      { equation: "ρ = C × MW", meaning: "mol/L → g/L" },
      { equation: "C = ρ / MW", meaning: "g/L → mol/L" },
      { equation: "1 % w/v = 10 g/L", meaning: "" },
      { equation: "1 ppm = 1 mg/L", meaning: "" },
    ],
    notes: ["ρ^{g/L}, C^{mol/L}, MW^{g/mol}.", "mg/mL = 1 g/L, µg/mL = 10⁻³ g/L. MW is needed only to cross between molar and mass."],
  },
};
